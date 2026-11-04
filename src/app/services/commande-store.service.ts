import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommandeDto, LigneCommandeDto } from './gestionnaire-api.service';
import { Commande, LigneCommande } from '../site/mykiki/services/commande-client.service';

const STORAGE_KEY = 'kiki_commandes_store_v3';

function getTransitionsPossibles(statut: string): string[] {
  switch (statut) {
    case 'EN_ATTENTE':
      return ['ACCEPTEE', 'ANNULEE'];
    case 'ACCEPTEE':
      return ['EN_COURS', 'ANNULEE'];
    case 'EN_COURS':
      return ['PRETE', 'ANNULEE'];
    case 'PRETE':
      return ['TERMINEE', 'ANNULEE'];
    case 'TERMINEE':
    case 'ANNULEE':
      return [];
    default:
      return ['ACCEPTEE', 'ANNULEE'];
  }
}

function getStatutLibelle(statut: string): string {
  switch (statut) {
    case 'EN_ATTENTE': return 'En attente';
    case 'ACCEPTEE':   return 'Acceptée';
    case 'EN_COURS':   return 'En préparation';
    case 'PRETE':      return 'Prête';
    case 'TERMINEE':   return 'Terminée';
    case 'ANNULEE':    return 'Annulée';
    default:           return statut;
  }
}

function getModeRemiseLibelle(mode: string): string {
  return mode === 'LIVRAISON' ? 'Livraison' : 'Retrait';
}

function getModePaiementLibelle(mode: string): string {
  switch (mode) {
    case 'WAVE': return 'Wave';
    case 'ORANGE_MONEY': return 'Orange Money';
    case 'ESPECES_A_LA_LIVRAISON': return 'Espèces à la livraison';
    case 'ESPECES_AU_RETRAIT': return 'Espèces au retrait';
    case 'CARTE_BANCAIRE': return 'Carte bancaire';
    default: return mode || 'Paiement direct';
  }
}

function getStatutPaiementLibelle(statut: string): string {
  switch (statut) {
    case 'PAYEE': return 'Payée';
    case 'A_ENCAISSER_A_LA_REMISE': return 'À payer à la remise';
    case 'EN_ATTENTE': return 'En attente';
    case 'REMBOURSEE': return 'Remboursée';
    default: return statut;
  }
}

export interface LivreurAssigne {
  chauffeurId: number;
  chauffeurNom: string;
  chauffeurRole?: string;
  telephone?: string;
  dateAssignation: string;
  instructions?: string;
}

export interface InfoDisponibiliteLivreur {
  disponible: boolean;
  commandesEnCours: number;
  libelle: string;
}

@Injectable({ providedIn: 'root' })
export class CommandeStoreService {

  private commandesSubject = new BehaviorSubject<CommandeDto[]>([]);
  commandes$ = this.commandesSubject.asObservable();

  constructor() {
    this.initialiserStore();
  }

  private initialiserStore(): void {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.commandesSubject.next(parsed);
          return;
        }
      } catch (e) {
        console.warn('Erreur lecture commandes store', e);
      }
    }
    // Pas de mock statique par défaut : liste propre connectée au backend
    this.sauvegarder([]);
  }

  private sauvegarder(liste: CommandeDto[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(liste));
    this.commandesSubject.next(liste);
  }

  getCommandes(): CommandeDto[] {
    return [...this.commandesSubject.value];
  }

  getCommandesClient(): Commande[] {
    const dtos = this.getCommandes();
    return dtos.map(d => this.versCommandeClient(d));
  }

  getCommandeById(id: number): CommandeDto | null {
    return this.commandesSubject.value.find(c => c.id === id) || null;
  }

  synchroniserCommandeDepuisBackend(cmd: any): void {
    if (!cmd || !cmd.id) return;
    const actuelles = this.getCommandes();
    const idx = actuelles.findIndex(c => c.id === cmd.id || c.numero === cmd.numero);
    if (idx >= 0) {
      actuelles[idx] = { ...actuelles[idx], ...cmd };
      this.sauvegarder(actuelles);
    } else {
      this.sauvegarder([cmd, ...actuelles]);
    }
  }

  synchroniserListeDepuisBackend(liste: CommandeDto[]): void {
    if (!Array.isArray(liste)) return;
    this.sauvegarder(liste);
  }

  ajouterCommande(params: {
    lignes: LigneCommandeDto[];
    modeRemise: 'RETRAIT' | 'LIVRAISON';
    modePaiement: string;
    dateRemise: string;
    adresseLivraison?: string;
    telephoneContact?: string;
    noteClient?: string;
    clientNom?: string;
    clientEmail?: string;
    clientTelephone?: string;
    fraisLivraison?: number;
    delaiPreparationHeures?: number;
  }): CommandeDto {
    const actuelles = this.getCommandes();
    const id = Date.now();
    const annee = new Date().getFullYear();
    const ref = Math.floor(10000 + Math.random() * 90000);
    const numero = `CMD-${annee}-${ref}`;
    const dateNow = new Date().toISOString();

    const montantProduits = params.lignes.reduce((sum, l) => sum + (l.sousTotal || (l.prixUnitaire * l.quantite)), 0);
    const frais = params.modeRemise === 'LIVRAISON' ? (params.fraisLivraison || 2000) : 0;
    const total = montantProduits + frais;

    const estPayee = params.modePaiement === 'WAVE' || params.modePaiement === 'ORANGE_MONEY' || params.modePaiement === 'CARTE_BANCAIRE';
    const statutPaiement = estPayee ? 'PAYEE' : 'A_ENCAISSER_A_LA_REMISE';

    const nouvelle: CommandeDto = {
      id,
      numero,
      clientId: 1,
      clientNom: params.clientNom || 'Client Kiki',
      clientEmail: params.clientEmail || 'client@example.com',
      clientTelephone: params.telephoneContact || params.clientTelephone || '',
      statut: 'EN_ATTENTE',
      statutLibelle: 'En attente',
      statutPaiement,
      statutPaiementLibelle: getStatutPaiementLibelle(statutPaiement),
      modePaiement: params.modePaiement,
      modePaiementLibelle: getModePaiementLibelle(params.modePaiement),
      modeRemise: params.modeRemise,
      modeRemiseLibelle: getModeRemiseLibelle(params.modeRemise),
      dateRemise: params.dateRemise,
      adresseLivraison: params.adresseLivraison,
      noteClient: params.noteClient,
      montantProduits,
      fraisLivraison: frais,
      montantTotal: total,
      delaiPreparationHeures: params.delaiPreparationHeures || 2,
      lignes: params.lignes,
      createdAt: dateNow,
      updatedAt: dateNow,
      transitionsPossibles: ['ACCEPTEE', 'ANNULEE']
    };

    const miseAJour = [nouvelle, ...actuelles];
    this.sauvegarder(miseAJour);
    return nouvelle;
  }

  mettreAJourStatut(id: number, nouveauStatut: string, motif?: string, fraisLivraison?: number): CommandeDto | null {
    const liste = this.getCommandes();
    const idx = liste.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const cmd = { ...liste[idx] };
    cmd.statut = nouveauStatut;
    cmd.statutLibelle = getStatutLibelle(nouveauStatut);
    cmd.updatedAt = new Date().toISOString();
    cmd.transitionsPossibles = getTransitionsPossibles(nouveauStatut);

    if (motif) cmd.motifAnnulation = motif;
    if (fraisLivraison != null) {
      cmd.fraisLivraison = fraisLivraison;
      cmd.montantTotal = (cmd.montantProduits || 0) + fraisLivraison;
    }

    liste[idx] = cmd;
    this.sauvegarder(liste);
    return cmd;
  }

  mettreAJourFraisLivraison(id: number, frais: number): CommandeDto | null {
    const liste = this.getCommandes();
    const idx = liste.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const cmd = { ...liste[idx] };
    cmd.fraisLivraison = frais;
    cmd.montantTotal = (cmd.montantProduits || 0) + frais;
    cmd.updatedAt = new Date().toISOString();

    liste[idx] = cmd;
    this.sauvegarder(liste);
    return cmd;
  }

  mettreAJourPaiement(id: number, statutPaiement: string, modePaiement?: string): CommandeDto | null {
    const liste = this.getCommandes();
    const idx = liste.findIndex(c => c.id === id);
    if (idx === -1) return null;

    const cmd = { ...liste[idx] };
    cmd.statutPaiement = statutPaiement;
    cmd.statutPaiementLibelle = getStatutPaiementLibelle(statutPaiement);
    if (modePaiement) {
      cmd.modePaiement = modePaiement;
      cmd.modePaiementLibelle = getModePaiementLibelle(modePaiement);
    }
    cmd.updatedAt = new Date().toISOString();

    liste[idx] = cmd;
    this.sauvegarder(liste);
    return cmd;
  }

  assignerLivreur(commandeId: number, livreur: LivreurAssigne): void {
    localStorage.setItem(`kiki_livreur_cmd_${commandeId}`, JSON.stringify(livreur));
    const liste = this.getCommandes();
    this.commandesSubject.next([...liste]);
  }

  retirerLivreur(commandeId: number): void {
    localStorage.removeItem(`kiki_livreur_cmd_${commandeId}`);
    const liste = this.getCommandes();
    this.commandesSubject.next([...liste]);
  }

  getLivreur(commandeId: number): LivreurAssigne | null {
    try {
      const raw = localStorage.getItem(`kiki_livreur_cmd_${commandeId}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Calcule la disponibilité en temps réel d'un livreur / chauffeur
   * en comptant les commandes en livraison actives (PRETE ou EN_COURS).
   */
  getDisponibiliteLivreur(chauffeurId: number, commandesActives: CommandeDto[] = []): InfoDisponibiliteLivreur {
    const listToCheck = commandesActives.length > 0 ? commandesActives : this.getCommandes();
    let coursesEnCours = 0;

    for (const cmd of listToCheck) {
      if (cmd.modeRemise === 'LIVRAISON' && (cmd.statut === 'PRETE' || cmd.statut === 'EN_COURS' || cmd.statut === 'ACCEPTEE')) {
        const liv = this.getLivreur(cmd.id);
        if (liv && liv.chauffeurId === chauffeurId) {
          coursesEnCours++;
        }
      }
    }

    if (coursesEnCours === 0) {
      return {
        disponible: true,
        commandesEnCours: 0,
        libelle: 'Disponible'
      };
    } else {
      return {
        disponible: false,
        commandesEnCours: coursesEnCours,
        libelle: `En livraison (${coursesEnCours} en cours)`
      };
    }
  }

  private versCommandeClient(d: CommandeDto): Commande {
    return {
      id: d.id,
      numero: d.numero,
      statut: d.statut,
      statutLibelle: d.statutLibelle,
      statutPaiement: d.statutPaiement,
      statutPaiementLibelle: d.statutPaiementLibelle,
      modePaiement: d.modePaiement,
      modePaiementLibelle: d.modePaiementLibelle,
      modeRemise: d.modeRemise,
      modeRemiseLibelle: d.modeRemiseLibelle,
      dateRemise: d.dateRemise,
      adresseLivraison: d.adresseLivraison,
      noteClient: d.noteClient,
      motifAnnulation: d.motifAnnulation,
      montantProduits: d.montantProduits,
      fraisLivraison: d.fraisLivraison,
      montantTotal: d.montantTotal,
      delaiPreparationHeures: d.delaiPreparationHeures,
      lignes: d.lignes?.map(l => ({
        produitNom: l.produitNom,
        prixUnitaire: l.prixUnitaire,
        quantite: l.quantite,
        sousTotal: l.sousTotal
      })),
      createdAt: d.createdAt
    };
  }
}
