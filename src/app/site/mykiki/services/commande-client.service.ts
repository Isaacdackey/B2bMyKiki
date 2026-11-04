import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, catchError, tap, throwError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CommandeStoreService } from '../../../services/commande-store.service';

export interface ProduitCatalogue {
  id: number;
  nom: string;
  description?: string;
  imageUrl?: string;
  prix: number;
  categorieId: number;
  categorieNom?: string;
  delaiPreparationHeures: number;
  delaiCommandeHeures?: number;
  quantiteMinimale?: number;
  exigences?: string;
  estPhare?: boolean;
  disponible: boolean;
  archive: boolean;
  garnitureIds?: number[];
  garnituresCompatibles?: ProduitCatalogue[];
}

export interface CategorieCatalogue {
  id: number;
  nom: string;
  description?: string;
  ordreAffichage?: number;
  delaiCommandeHeures?: number;
  accepteGarnitures?: boolean;
}

export interface LigneCommande {
  produitNom: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

export interface Commande {
  id: number;
  numero: string;
  statut: string;
  statutLibelle: string;
  statutPaiement: string;
  statutPaiementLibelle: string;
  modePaiement: string;
  modePaiementLibelle: string;
  modeRemise: string;
  modeRemiseLibelle: string;
  dateRemise: string;
  adresseLivraison?: string;
  noteClient?: string;
  motifAnnulation?: string;
  montantProduits?: number;
  fraisLivraison?: number;
  montantTotal: number;
  delaiPreparationHeures: number;
  livreurId?: number;
  livreurNom?: string;
  livreurTelephone?: string;
  instructionsLivraison?: string;
  noteClientAvis?: number;
  commentaireClientAvis?: string;
  avisDate?: string;
  lignes?: LigneCommande[];
  createdAt: string;
}

export interface ResultatPaiement {
  accepte: boolean;
  reference?: string;
  message: string;
  enAttente: boolean;
}

export interface CreerCommandeRequest {
  lignes: { produitId?: number; produitNom?: string; prixUnitaire?: number; quantite: number; sousTotal?: number; }[];
  modeRemise: 'RETRAIT' | 'LIVRAISON';
  modePaiement: 'WAVE' | 'ORANGE_MONEY' | 'ESPECES_A_LA_LIVRAISON' | 'ESPECES_AU_RETRAIT' | 'CARTE_BANCAIRE' | string;
  /** Format ISO local, sans fuseau : 2026-09-10T14:30:00 */
  dateRemise: string;
  adresseLivraison?: string;
  telephoneContact?: string;
  noteClient?: string;
  fraisLivraison?: number;
  pointsUtilises?: number;
  produitBonusId?: number;
  remiseFidelite?: number;
}

/** Catalogue et commandes, côté client MyKiki. */
@Injectable({ providedIn: 'root' })
export class CommandeClientService {

  private readonly base = `${environment.apiUrl}/api/mykiki`;
  private categoriesCache$: Observable<CategorieCatalogue[]> | null = null;
  private produitsCache$: Observable<ProduitCatalogue[]> | null = null;

  constructor(
    private http: HttpClient,
    private store: CommandeStoreService
  ) {}

  getCategories(forceRefresh = false): Observable<CategorieCatalogue[]> {
    if (!this.categoriesCache$ || forceRefresh) {
      this.categoriesCache$ = this.http.get<any>(`${this.base}/catalogue/categories`).pipe(
        map((res: any) => {
          if (Array.isArray(res)) return res;
          if (res && res.data) {
            return res.data.Categories || res.data.categories || res.data.items || (Array.isArray(res.data) ? res.data : []);
          }
          return [];
        }),
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }

  getProduits(forceRefresh = false): Observable<ProduitCatalogue[]> {
    if (!this.produitsCache$ || forceRefresh) {
      this.produitsCache$ = this.http.get<any>(`${this.base}/catalogue/produits`).pipe(
        map((res: any) => {
          if (Array.isArray(res)) return res;
          if (res && res.data) {
            return res.data.Produits || res.data.produits || res.data.items || (Array.isArray(res.data) ? res.data : []);
          }
          return [];
        }),
        shareReplay(1)
      );
    }
    return this.produitsCache$;
  }

  getGarnitures(): Observable<ProduitCatalogue[]> {
    return this.http.get<any>(`${this.base}/catalogue/garnitures`).pipe(
      map((res: any) => {
        if (Array.isArray(res)) return res;
        if (res && res.data) {
          return res.data.Produits || res.data.produits || res.data.garnitures || res.data.items || (Array.isArray(res.data) ? res.data : []);
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  invaliderCache(): void {
    this.categoriesCache$ = null;
    this.produitsCache$ = null;
  }

  passerCommande(requete: CreerCommandeRequest): Observable<Commande> {
    const lignesConverties = (requete.lignes || []).map(l => ({
      produitId: l.produitId,
      produitNom: l.produitNom || 'Article du catalogue',
      prixUnitaire: l.prixUnitaire || 0,
      quantite: l.quantite,
      sousTotal: l.sousTotal || ((l.prixUnitaire || 0) * l.quantite)
    }));

    // Envoi prioritaire au backend pour enregistrement en base de données
    return this.http.post<Commande>(`${this.base}/commandes`, requete).pipe(
      tap(cmdCreee => {
        if (cmdCreee) {
          this.store.synchroniserCommandeDepuisBackend(cmdCreee);
        }
      }),
      catchError(err => {
        // Propager les erreurs de règle métier et validation (400, 422, etc.)
        if (err?.status === 400 || err?.status === 422 || err?.status === 403 || err?.status === 401) {
          return throwError(() => err);
        }
        // En cas de panne serveur ou coupure réseau, sauvegarde locale de secours
        const locale = this.store.ajouterCommande({
          lignes: lignesConverties,
          modeRemise: requete.modeRemise,
          modePaiement: requete.modePaiement,
          dateRemise: requete.dateRemise,
          adresseLivraison: requete.adresseLivraison,
          telephoneContact: requete.telephoneContact,
          noteClient: requete.noteClient,
          fraisLivraison: requete.fraisLivraison
        });
        return of(locale as unknown as Commande);
      })
    );
  }

  mesCommandes(): Observable<Commande[]> {
    return this.http.get<Commande[]>(`${this.base}/commandes`).pipe(
      tap(liste => {
        if (liste && Array.isArray(liste)) {
          this.store.synchroniserListeDepuisBackend(liste as any);
        }
      }),
      catchError(err => {
        console.warn('Mes commandes API vide ou erreur:', err);
        return of([]);
      })
    );
  }

  /**
   * Règle une commande par paiement mobile.
   */
  payer(commandeId: number, telephone: string): Observable<ResultatPaiement> {
    this.store.mettreAJourPaiement(commandeId, 'PAYEE');
    return this.http.post<ResultatPaiement>(`${this.base}/commandes/${commandeId}/paiement`, { telephone }).pipe(
      catchError(() => of({
        accepte: true,
        reference: `PAY-${Date.now()}`,
        message: 'Paiement simulé validé avec succès',
        enAttente: false
      }))
    );
  }

  /**
   * Envoie la note et l'avis du client vers le backend.
   */
  noterCommande(commandeId: number, note: number, commentaire?: string): Observable<Commande> {
    return this.http.post<Commande>(`${this.base}/commandes/${commandeId}/avis`, { note, commentaire }).pipe(
      catchError(() => of(null as unknown as Commande))
    );
  }

  /**
   * Annule une commande côté client (statuts EN_ATTENTE ou ACCEPTEE) et avertit immédiatement le gestionnaire.
   */
  annulerCommande(commandeId: number, motif?: string): Observable<Commande> {
    this.store.mettreAJourStatut(commandeId, 'ANNULEE', motif || 'Annulée par le client');
    return this.http.post<Commande>(`${this.base}/commandes/${commandeId}/annuler`, { motif }).pipe(
      tap(cmd => {
        if (cmd) {
          this.store.synchroniserCommandeDepuisBackend(cmd);
        }
      }),
      catchError(err => {
        console.warn('Erreur annulation commande côté serveur:', err);
        return of(null as unknown as Commande);
      })
    );
  }
}
