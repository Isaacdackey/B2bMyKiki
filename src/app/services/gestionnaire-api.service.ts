import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, catchError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CommandeStoreService } from './commande-store.service';

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

/** Média stocké côté serveur (Cloudinary en production). */
export interface MediaDto {
  id: number;
  nom: string;
  /** URL absolue servie par Cloudinary, ou relative en stockage local. */
  url: string;
  /** IMAGE | VIDEO | PDF | DOCUMENT */
  type: string;
  sizeBytes?: number;
  evenementId?: number;
  evenementNom?: string;
  typeEvenement?: string;
  nombreConvives?: string;
  lieu?: string;
  description?: string;
  visiblePublic?: boolean;
  uploadedAt?: string;
}

// =============================================
// MODULE COMMANDES & CATALOGUE
// =============================================

export interface CategorieDto {
  id: number;
  nom: string;
  description?: string;
  imageUrl?: string;
  ordreAffichage?: number;
  delaiCommandeHeures?: number;
  accepteGarnitures?: boolean;
  archivee: boolean;
  nombreProduits?: number;
}

export interface ProduitDto {
  id: number;
  nom: string;
  description?: string;
  imageUrl?: string;
  prix: number;
  categorieId: number;
  categorieNom?: string;
  delaiPreparationHeures: number;
  quantiteMinimale?: number;
  exigences?: string;
  disponible: boolean;
  estPhare?: boolean;
  archive: boolean;
  garnitureIds?: number[];
  garnituresCompatibles?: ProduitDto[];
}

export interface ConfigurationFideliteDto {
  id?: number;
  pointsBienvenue: number;
  seuilMontantPanier: number;
  pointsGagnesParSeuil: number;
  pointsRequisBonus: number;
  descriptionBonus?: string;
  produitIdsBonus?: number[];
  produitsBonus?: { id: number; nom: string; prix: number; imageUrl?: string }[];
  pointsAvisClient?: number;
  delaiApparitionAvisHeures?: number;
  dureeValiditeAvisJours?: number;
}

/** Métadonnées d'un média déjà hébergé sur Cloudinary. */
export interface EnregistrerMediaRequest {
  nom: string;
  /** secure_url renvoyée par Cloudinary. */
  url: string;
  /** public_id Cloudinary, nécessaire à la suppression ultérieure. */
  storageId?: string;
  storageResourceType?: string;
  type?: string;
  sizeBytes?: number;
  evenementId?: number;
  evenementNom?: string;
  typeEvenement?: string;
  nombreConvives?: string;
  lieu?: string;
  description?: string;
  visiblePublic?: boolean;
}

export interface ModifierAlbumRequest {
  ancienTitre: string;
  nouveauTitre?: string;
  typeEvenement?: string;
  nombreConvives?: string;
  lieu?: string;
  description?: string;
  visiblePublic?: boolean;
}

export interface LigneCommandeDto {
  produitId?: number;
  produitNom: string;
  prixUnitaire: number;
  quantite: number;
  sousTotal: number;
}

export interface CommandeDto {
  id: number;
  numero: string;
  clientId: number;
  clientNom: string;
  clientEmail?: string;
  clientTelephone?: string;
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
  lignes?: LigneCommandeDto[];
  createdAt: string;
  updatedAt: string;
  /** Statuts atteignables : pilote les boutons d'action. */
  transitionsPossibles: string[];
}

export interface GestionnaireDemandeDto {
  id: number;
  clientId: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientType: string;
  clientOrganization?: string;
  prestationId: string;
  prestationTitle: string;
  date: string;
  time: string;
  guests: number;
  isInstitution?: boolean;
  organization?: string;
  location?: string;
  locationType?: string;
  locationDetails?: string;
  cuisine?: string;
  message?: string;
  status: string;
  dateSubmitted: string;
  propositions?: any[];
}

export interface PrestationStatDto {
  id: string;
  nom: string;
  count: number;
  pourcentage: number;
  couleur: string;
  icone: string;
}

export interface OccupationSalleDivaDto {
  id: number;
  date: string;
  client: string;
  heure: string;
  invites: string;
  joursRestants: number;
  couleur: string;
}

export interface TopProduitStatDto {
  nom: string;
  id?: number;
  categorie?: string;
  prix?: number;
  quantite: number;
  chiffreAffaires: number;
  commandesCount: number;
  pourcentage: number;
  rang: number;
  disponible?: boolean;
}

export interface CalendarDayEventDto {
  id: number;
  date: string;
  clientName: string;
  prestationId: string;
  prestationTitle: string;
  time: string;
  status: string;
  guests?: number;
  locationDetails?: string;
}

export interface EquilibreVerdictDto {
  titre: string;
  description: string;
  icone: string;
  classe: string;
}

export interface DashboardDemandesStatsDto {
  total: number;
  abouties: number;
  enCours: number;
  urgentes: number;
  refusees: number;
  tauxConversion: number;
  caPrevisionnel: number;
  repartitionPrestations: PrestationStatDto[];
  occupationSalleDiva: OccupationSalleDivaDto[];
  conflitsCount: number;
  roomBlockedCount: number;
  recentesDemandes: GestionnaireDemandeDto[];
}

export interface DashboardCommandesStatsDto {
  total: number;
  totalVentes: number;
  soldeEncaisse: number;
  soldeRestant: number;
  panierMoyen: number;
  tauxLivrees: number;
  enAttente: number;
  acceptees: number;
  enPreparation: number;
  pretes: number;
  terminees: number;
  annulees: number;
  livraisons: number;
  retraits: number;
  pctLivraison: number;
  pctRetrait: number;
  payees: number;
  aEncaisser: number;
  pctPayee: number;
  pctAEncaisser: number;
  recentesCommandes: CommandeDto[];
  topProduits: TopProduitStatDto[];
}

export interface DashboardSyntheseDto {
  caGlobalTotal: number;
  volumeActiviteGlobal: number;
  syntheseDemandesPct: number;
  syntheseCommandesPct: number;
  totalClients: number;
  particuliersCount: number;
  entreprisesCount: number;
  equilibreVerdict: EquilibreVerdictDto;
}

export interface DashboardChartsDto {
  demandesParMois: number[];
  commandesParMois: number[];
  caCommandesParMois: number[];
  caDemandesParMois: number[];
  demandesParPrestationParMois: Record<string, number[]>;
}

export interface DashboardResponseDto {
  year: number;
  month: number;
  monthLabel: string;
  statsDemandes: DashboardDemandesStatsDto;
  statsCommandes: DashboardCommandesStatsDto;
  statsSynthese: DashboardSyntheseDto;
  charts: DashboardChartsDto;
  calendarEvents: CalendarDayEventDto[];
  classementMets: TopProduitStatDto[];
}

export interface DashboardStatsDto {
  totalRequests: number;
  acceptedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  urgentRequests: number;
  conversionRate: number;
  totalRevenue: number;
  totalClients: number;
  particuliersCount: number;
  entreprisesCount: number;
  recentRequests: GestionnaireDemandeDto[];
}

export interface UpdateStatusRequestDto {
  status: string;
  propositionIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class GestionnaireApiService {
  private baseUrl = environment.apiUrl;
  private apiUrl = `${this.baseUrl}/api/gestionnaire`;
  private devisApiUrl = `${this.baseUrl}/api/devis`;

  constructor(
    private http: HttpClient,
    private store: CommandeStoreService
  ) {}

  getAllDemandes(page: number = 0, size: number = 10, status?: string): Observable<PageResponse<GestionnaireDemandeDto>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }
    return this.http.get<PageResponse<GestionnaireDemandeDto>>(`${this.apiUrl}/demandes`, { params });
  }

  getDemandeById(id: number): Observable<GestionnaireDemandeDto> {
    return this.http.get<GestionnaireDemandeDto>(`${this.apiUrl}/demandes/${id}`);
  }

  getDemandesStatusCounts(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/demandes/stats`);
  }

  createDevisDirectly(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/devis/direct`, payload);
  }

  /** ÉTAPE 2 : EN_ATTENTE → ACCEPTEE */
  priseEnCharge(id: number): Observable<GestionnaireDemandeDto> {
    return this.http.post<GestionnaireDemandeDto>(`${this.apiUrl}/demandes/${id}/prise-en-charge`, {});
  }

  /** ÉTAPE 3 : ACCEPTEE → PROPOSITION_ENVOYEE */
  envoyerProposition(id: number, propositionIds: number[]): Observable<GestionnaireDemandeDto> {
    return this.http.post<GestionnaireDemandeDto>(`${this.apiUrl}/demandes/${id}/envoyer-proposition`, { propositionIds });
  }

  /** ÉTAPE 5 : REFUSEE_CLIENT → PROPOSITION_ENVOYEE */
  regenererProposition(id: number, propositionIds: number[]): Observable<GestionnaireDemandeDto> {
    return this.http.post<GestionnaireDemandeDto>(`${this.apiUrl}/demandes/${id}/regenerer-proposition`, { propositionIds });
  }

  /** ÉTAPE 6 : PROPOSITION_VALIDEE → ABOUTI + génération du Devis */
  genererDevis(id: number, options?: { gestionnaireName?: string; tvaRate?: number; discount?: number }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/demandes/${id}/generer-devis`, options || {});
  }

  accepterDemande(id: number, propositionIds: number[]): Observable<GestionnaireDemandeDto> {
    return this.http.post<GestionnaireDemandeDto>(`${this.apiUrl}/demandes/${id}/accepter`, { propositionIds });
  }

  refuserDemande(id: number, motif?: string): Observable<GestionnaireDemandeDto> {
    return this.http.post<GestionnaireDemandeDto>(`${this.apiUrl}/demandes/${id}/refuser`, { motif });
  }

  validerSelection(id: number, extraData?: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/demandes/${id}/valider-selection`, extraData || {});
  }

  updateStatus(id: number, status: string, propositionIds?: number[]): Observable<GestionnaireDemandeDto> {
    const payload: UpdateStatusRequestDto = { status };
    if (propositionIds) payload.propositionIds = propositionIds;
    return this.http.put<GestionnaireDemandeDto>(`${this.apiUrl}/demandes/${id}/status`, payload);
  }

  getPropositions(page: number = 0, size: number = 10): Observable<PageResponse<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<PageResponse<any>>(`${this.apiUrl}/propositions`, { params });
  }

  getPropositionById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/propositions/${id}`);
  }

  getPropositionsEnvoyees(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/propositions-envoyees`);
  }

  createProposition(prop: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/propositions`, prop);
  }

  updateProposition(id: number, prop: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/propositions/${id}`, prop);
  }

  deleteProposition(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/propositions/${id}`);
  }

  createDemande(demande: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/client/devis`, demande);
  }

  getDashboardOverview(year?: number, month?: number): Observable<DashboardResponseDto> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.get<DashboardResponseDto>(`${this.apiUrl}/dashboard`, { params });
  }

  getDashboardStats(year?: number, month?: number): Observable<DashboardStatsDto> {
    let params = new HttpParams();
    if (year) params = params.set('year', year.toString());
    if (month) params = params.set('month', month.toString());
    return this.http.get<DashboardStatsDto>(`${this.apiUrl}/dashboard/stats`, { params });
  }

  createClient(clientData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clients`, clientData);
  }

  updateClient(id: number, clientData: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/client/clients/${id}`, clientData);
  }

  deleteClient(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/api/client/clients/${id}`);
  }

  /**
   * Bloque ou débloque un client. Le compte MyKiki associé est désactivé
   * dans le même mouvement, côté serveur.
   */
  setClientBlocage(id: number, bloque: boolean): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/api/client/clients/${id}/blocage`, { bloque });
  }

  createOrUpdateDevis(devis: any): Observable<any> {
    return this.http.post<any>(this.devisApiUrl, devis);
  }

  getDevisByDemandeId(demandeId: number): Observable<any> {
    return this.http.get<any>(`${this.devisApiUrl}/demande/${demandeId}`);
  }

  getAllDevis(): Observable<any[]> {
    return this.http.get<any[]>(this.devisApiUrl);
  }

  /**
   * Envoie le devis PDF par email depuis le backend Spring Boot
   * (Gmail SMTP → contact@kikitraiteursenegal.net → client)
   */
  sendDevisEmail(devisId: number): Observable<{ status: string; message: string }> {
    return this.http.post<{ status: string; message: string }>(
      `${this.devisApiUrl}/${devisId}/sendMail`,
      {}
    );
  }

  /**
   * Télécharge le PDF du devis depuis l'API (retourne un Blob)
   */
  downloadDevisPdf(devisId: number): Observable<Blob> {
    return this.http.get(`${this.devisApiUrl}/${devisId}/pdf`, {
      responseType: 'blob'
    });
  }

  getAllClients(page: number = 0, size: number = 10): Observable<PageResponse<any>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<PageResponse<any>>(`${this.baseUrl}/api/client/clients`, { params });
  }

  // --- FAQs ---
  getFaqs(page: number = 0, size: number = 100): Observable<any[]> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(`${this.baseUrl}/api/faqs`, { params }).pipe(
      map(res => {
        if (!res) return [];
        if (Array.isArray(res.content)) return res.content;
        if (res.data) {
          if (Array.isArray(res.data.Faqs)) return res.data.Faqs;
          if (Array.isArray(res.data.faqs)) return res.data.faqs;
          if (Array.isArray(res.data.questions)) return res.data.questions;
          if (Array.isArray(res.data)) return res.data;
        }
        if (Array.isArray(res)) return res;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  createFaq(faq: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/faqs`, faq);
  }

  updateFaq(id: number | string, faq: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/faqs/${id}`, faq);
  }

  deleteFaq(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/faqs/${id}`);
  }

  // --- Témoignages ---
  getTestimonials(page: number = 0, size: number = 100): Observable<any[]> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(`${this.baseUrl}/api/testimonials`, { params }).pipe(
      map(res => {
        if (!res) return [];
        if (res.data) {
          if (Array.isArray(res.data.Testimonials)) return res.data.Testimonials;
          if (Array.isArray(res.data.testimonials)) return res.data.testimonials;
          if (Array.isArray(res.data.temoignages)) return res.data.temoignages;
          if (Array.isArray(res.data)) return res.data;
        }
        if (Array.isArray(res)) return res;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  createTestimonial(t: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/testimonials`, t);
  }

  updateTestimonial(id: number | string, t: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/testimonials/${id}`, t);
  }

  deleteTestimonial(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/testimonials/${id}`);
  }

  // =============================================
  // MÉDIATHÈQUE
  // Les fichiers sont stockés sur Cloudinary par le backend : ils survivent
  // aux redéploiements et sont visibles par toute l'équipe, contrairement à
  // l'ancienne médiathèque qui n'écrivait que dans le localStorage du poste.
  // =============================================

  getMedias(evenementId?: number): Observable<MediaDto[]> {
    let params = new HttpParams();
    if (evenementId != null) {
      params = params.set('evenementId', String(evenementId));
    }
    return this.http.get<MediaDto[]>(`${this.baseUrl}/api/gestionnaire/media`, { params });
  }

  /**
   * Enregistre des médias DÉJÀ hébergés sur Cloudinary.
   *
   * Aucun binaire ne transite par notre API : le navigateur a posté le fichier
   * directement à Cloudinary via CloudinaryService, et seules des chaînes de
   * caractères arrivent ici.
   */
  enregistrerMedias(medias: EnregistrerMediaRequest[]): Observable<MediaDto[]> {
    return this.http.post<MediaDto[]>(`${this.baseUrl}/api/gestionnaire/media`, medias);
  }

  /**
   * Téléverse un ou plusieurs fichiers médias vers le backend (stockage Cloudinary / local).
   */
  uploadMediaFiles(
    files: File[],
    evenementNom?: string,
    evenementId?: number,
    typeEvenement?: string,
    nombreConvives?: string,
    lieu?: string,
    description?: string,
    visiblePublic?: boolean
  ): Observable<MediaDto[]> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    if (evenementNom) {
      formData.append('evenementNom', evenementNom);
    }
    if (evenementId != null) {
      formData.append('evenementId', String(evenementId));
    }
    if (typeEvenement) {
      formData.append('typeEvenement', typeEvenement);
    }
    if (nombreConvives) {
      formData.append('nombreConvives', nombreConvives);
    }
    if (lieu) {
      formData.append('lieu', lieu);
    }
    if (description) {
      formData.append('description', description);
    }
    if (visiblePublic != null) {
      formData.append('visiblePublic', String(visiblePublic));
    }
    return this.http.post<MediaDto[]>(`${this.baseUrl}/api/gestionnaire/media/upload`, formData);
  }

  /**
   * Récupère la liste des réalisations publiques (photos d'événements avec métadonnées) pour le site vitrine.
   */
  getRealisationsPubliques(): Observable<MediaDto[]> {
    return this.http.get<any>(`${this.baseUrl}/api/realisations`).pipe(
      map(res => {
        if (Array.isArray(res)) return res;
        if (res && res.data) {
          return res.data.Realisations || res.data.realisations || res.data.items || (Array.isArray(res.data) ? res.data : []);
        }
        return [];
      })
    );
  }

  /**
   * Modifie les métadonnées d'un album complet (tous ses médias associés).
   */
  modifierAlbum(payload: ModifierAlbumRequest): Observable<MediaDto[]> {
    return this.http.put<MediaDto[]>(`${this.baseUrl}/api/gestionnaire/media/album`, payload);
  }

  /**
   * Modifie la visibilité publique d'un média unique.
   */
  changerVisibiliteMedia(id: number, visible: boolean): Observable<MediaDto> {
    const params = new HttpParams().set('visible', String(visible));
    return this.http.patch<MediaDto>(`${this.baseUrl}/api/gestionnaire/media/${id}/visibilite`, {}, { params });
  }

  /**
   * Modifie la visibilité publique d'un album entier (toutes ses photos).
   */
  changerVisibiliteAlbum(titre: string, visible: boolean): Observable<MediaDto[]> {
    const params = new HttpParams().set('titre', titre).set('visible', String(visible));
    return this.http.patch<MediaDto[]>(`${this.baseUrl}/api/gestionnaire/media/album/visibilite`, {}, { params });
  }

  /**
   * Téléverse une image de produit / met vers le backend et retourne son URL.
   */
  uploadProductImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<MediaDto[]>(`${this.baseUrl}/api/gestionnaire/media/upload`, formData).pipe(
      map((res: MediaDto[]) => {
        if (res && res.length > 0 && res[0].url) {
          return res[0].url;
        }
        throw new Error('Aucune URL de média renvoyée par le serveur.');
      })
    );
  }

  deleteMedia(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/api/gestionnaire/media/${id}`);
  }

  // =============================================
  // CATALOGUE (back-office)
  // =============================================

  private get catalogueUrl(): string { return `${this.baseUrl}/api/gestionnaire/catalogue`; }

  getCategories(inclureArchivees = true): Observable<CategorieDto[]> {
    const params = new HttpParams().set('inclureArchivees', String(inclureArchivees));
    return this.http.get<CategorieDto[]>(`${this.catalogueUrl}/categories`, { params });
  }

  createCategorie(c: Partial<CategorieDto>): Observable<CategorieDto> {
    return this.http.post<CategorieDto>(`${this.catalogueUrl}/categories`, c);
  }

  updateCategorie(id: number, c: Partial<CategorieDto>): Observable<CategorieDto> {
    return this.http.put<CategorieDto>(`${this.catalogueUrl}/categories/${id}`, c);
  }

  /** Archive ou désarchive une catégorie ET tous ses produits. */
  setArchivageCategorie(id: number, archivee: boolean): Observable<CategorieDto> {
    return this.http.patch<CategorieDto>(`${this.catalogueUrl}/categories/${id}/archivage`, { archivee });
  }

  getProduits(): Observable<ProduitDto[]> {
    return this.http.get<ProduitDto[]>(`${this.catalogueUrl}/produits`);
  }

  createProduit(p: Partial<ProduitDto>): Observable<ProduitDto> {
    return this.http.post<ProduitDto>(`${this.catalogueUrl}/produits`, p);
  }

  updateProduit(id: number, p: Partial<ProduitDto>): Observable<ProduitDto> {
    return this.http.put<ProduitDto>(`${this.catalogueUrl}/produits/${id}`, p);
  }

  setArchivageProduit(id: number, archive: boolean): Observable<ProduitDto> {
    return this.http.patch<ProduitDto>(`${this.catalogueUrl}/produits/${id}/archivage`, { archive });
  }

  toggleDisponibiliteProduit(id: number): Observable<ProduitDto> {
    return this.http.patch<ProduitDto>(`${this.catalogueUrl}/produits/${id}/disponibilite`, {});
  }

  togglePhareProduit(id: number): Observable<ProduitDto> {
    return this.http.patch<ProduitDto>(`${this.catalogueUrl}/produits/${id}/phare`, {});
  }

  // =============================================
  // COMMANDES (back-office)
  // =============================================

  private get commandesUrl(): string { return `${this.baseUrl}/api/gestionnaire/commandes`; }

  getCommandes(statut?: string, paiement?: string, page = 0, size = 20): Observable<PageResponse<CommandeDto>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (statut && statut !== 'TOUTES') params = params.set('statut', statut);
    if (paiement && paiement !== 'TOUS') params = params.set('paiement', paiement);

    const filtrerStore = (): PageResponse<CommandeDto> => {
      let liste = this.store.getCommandes();
      if (statut && statut !== 'TOUTES') {
        liste = liste.filter(c => c.statut === statut);
      }
      if (paiement && paiement !== 'TOUS') {
        if (paiement === 'PAYEE') {
          liste = liste.filter(c => c.statutPaiement === 'PAYEE');
        } else if (paiement === 'A_ENCAISSER_A_LA_REMISE') {
          liste = liste.filter(c => c.statutPaiement !== 'PAYEE');
        }
      }
      const total = liste.length;
      const start = page * size;
      const end = start + size;
      const content = liste.slice(start, end);
      return {
        content,
        totalElements: total,
        totalPages: Math.ceil(total / size) || 1,
        pageNumber: page,
        pageSize: size,
        last: end >= total
      };
    };

    return this.http.get<PageResponse<CommandeDto>>(this.commandesUrl, { params }).pipe(
      catchError(() => of(filtrerStore()))
    );
  }

  getCommandesStats(): Observable<Record<string, number>> {
    const calculerStats = (): Record<string, number> => {
      const liste = this.store.getCommandes();
      return {
        TOUTES: liste.length,
        EN_ATTENTE: liste.filter(c => c.statut === 'EN_ATTENTE').length,
        ACCEPTEE: liste.filter(c => c.statut === 'ACCEPTEE').length,
        EN_COURS: liste.filter(c => c.statut === 'EN_COURS').length,
        PRETE: liste.filter(c => c.statut === 'PRETE').length,
        TERMINEE: liste.filter(c => c.statut === 'TERMINEE').length,
        ANNULEE: liste.filter(c => c.statut === 'ANNULEE').length
      };
    };

    return this.http.get<Record<string, number>>(`${this.commandesUrl}/stats`).pipe(
      catchError(() => of(calculerStats()))
    );
  }

  getCommande(id: number): Observable<CommandeDto> {
    const cmdStore = this.store.getCommandeById(id);
    return this.http.get<CommandeDto>(`${this.commandesUrl}/${id}`).pipe(
      catchError(() => {
        if (cmdStore) return of(cmdStore);
        throw new Error('Commande introuvable');
      })
    );
  }

  changerStatutCommande(id: number, statut: string, motif?: string, fraisLivraison?: number): Observable<CommandeDto> {
    const cmd = this.store.mettreAJourStatut(id, statut, motif, fraisLivraison);
    const payload: any = { statut, motif };
    if (fraisLivraison != null) {
      payload.fraisLivraison = fraisLivraison;
    }
    return this.http.patch<CommandeDto>(`${this.commandesUrl}/${id}/statut`, payload).pipe(
      catchError(() => {
        if (cmd) return of(cmd);
        throw new Error('Erreur mise à jour statut');
      })
    );
  }

  definirFraisLivraison(id: number, fraisLivraison: number): Observable<CommandeDto> {
    const cmd = this.store.mettreAJourFraisLivraison(id, fraisLivraison);
    return this.http.patch<CommandeDto>(`${this.commandesUrl}/${id}/frais-livraison`, { fraisLivraison }).pipe(
      catchError(() => {
        if (cmd) return of(cmd);
        throw new Error('Erreur mise à jour frais');
      })
    );
  }

  changerPaiementCommande(id: number, statutPaiement: string): Observable<CommandeDto> {
    const cmd = this.store.mettreAJourPaiement(id, statutPaiement);
    return this.http.patch<CommandeDto>(`${this.commandesUrl}/${id}/paiement`, { statutPaiement }).pipe(
      catchError(() => {
        if (cmd) return of(cmd);
        throw new Error('Erreur mise à jour paiement');
      })
    );
  }

  assignerLivreur(id: number, chauffeurId: number | null, instructions?: string): Observable<CommandeDto> {
    const payload: any = { chauffeurId, instructions };
    return this.http.patch<CommandeDto>(`${this.commandesUrl}/${id}/livreur`, payload);
  }

  /**
   * Création directe d'une commande par le gestionnaire.
   */
  creerCommandeGestionnaire(payload: any): Observable<CommandeDto> {
    return this.http.post<CommandeDto>(this.commandesUrl, payload).pipe(
      map(cmd => {
        this.store.synchroniserCommandeDepuisBackend(cmd);
        return cmd;
      }),
      catchError(err => {
        console.warn('Création backend indisponible, enregistrement local dans le store', err);
        const fraisLivraison = payload.modeRemise === 'LIVRAISON' ? (payload.fraisLivraison ?? 2000) : 0;
        const cmdLocal = this.store.ajouterCommande({
          lignes: (payload.lignes || []).map((l: any) => ({
            produitId: l.produitId,
            produitNom: l.produitNom || 'Mets',
            prixUnitaire: l.prixUnitaire || 0,
            quantite: l.quantite || 1,
            sousTotal: (l.prixUnitaire || 0) * (l.quantite || 1)
          })),
          modeRemise: payload.modeRemise,
          modePaiement: payload.modePaiement,
          dateRemise: payload.dateRemise,
          adresseLivraison: payload.adresseLivraison,
          noteClient: payload.noteClient,
          clientNom: payload.client?.nom || payload.clientNom || 'Client',
          clientTelephone: payload.client?.telephone || payload.clientTelephone || '',
          clientEmail: payload.client?.email || payload.clientEmail || '',
          fraisLivraison: fraisLivraison
        });
        if (payload.statutPaiement) {
          this.store.mettreAJourPaiement(cmdLocal.id, payload.statutPaiement);
        }
        if (payload.statutCommande && payload.statutCommande !== 'EN_ATTENTE') {
          this.store.mettreAJourStatut(cmdLocal.id, payload.statutCommande);
        }
        return of(cmdLocal);
      })
    );
  }

  // =============================================
  // MODULE FIDÉLITÉ & POINTS
  // =============================================

  getFideliteConfig(): Observable<ConfigurationFideliteDto> {
    return this.http.get<ConfigurationFideliteDto>(`${this.baseUrl}/api/fidelite/config`);
  }

  updateFideliteConfig(config: ConfigurationFideliteDto): Observable<ConfigurationFideliteDto> {
    return this.http.put<ConfigurationFideliteDto>(`${this.baseUrl}/api/gestionnaire/fidelite/config`, config);
  }

  // =============================================
  // MODULE ÉQUIPE ADMINISTRATIVE & DIRECTION (CMS)
  // =============================================

  getMembresEquipePublic(page: number = 0, size: number = 100): Observable<MembreEquipeDto[]> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(`${this.baseUrl}/api/equipe`, { params }).pipe(
      map(res => {
        if (!res) return [];
        if (res.data) {
          if (Array.isArray(res.data.Equipe)) return res.data.Equipe;
          if (Array.isArray(res.data.equipe)) return res.data.equipe;
          if (Array.isArray(res.data.membres)) return res.data.membres;
          if (Array.isArray(res.data)) return res.data;
        }
        if (Array.isArray(res)) return res;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  getMembresEquipeGestionnaire(page: number = 0, size: number = 100): Observable<MembreEquipeDto[]> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(`${this.baseUrl}/api/gestionnaire/equipe`, { params }).pipe(
      map(res => {
        if (!res) return [];
        if (res.data) {
          if (Array.isArray(res.data.Equipe)) return res.data.Equipe;
          if (Array.isArray(res.data.equipe)) return res.data.equipe;
          if (Array.isArray(res.data.membres)) return res.data.membres;
          if (Array.isArray(res.data)) return res.data;
        }
        if (Array.isArray(res)) return res;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  creerMembreEquipe(membre: MembreEquipeDto): Observable<MembreEquipeDto> {
    return this.http.post<MembreEquipeDto>(`${this.baseUrl}/api/gestionnaire/equipe`, membre);
  }

  modifierMembreEquipe(id: number, membre: MembreEquipeDto): Observable<MembreEquipeDto> {
    return this.http.put<MembreEquipeDto>(`${this.baseUrl}/api/gestionnaire/equipe/${id}`, membre);
  }

  supprimerMembreEquipe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/gestionnaire/equipe/${id}`);
  }

  // =============================================
  // MODULE MESSAGES "NOUS ÉCRIRE" (CMS / CONTACT)
  // =============================================

  getMessagesContact(): Observable<ContactMessageDto[]> {
    return this.http.get<ContactMessageDto[]>(`${this.baseUrl}/api/gestionnaire/messages`).pipe(
      catchError(() => of([]))
    );
  }

  toggleMessageTraite(id: number, traite?: boolean): Observable<ContactMessageDto> {
    let params = new HttpParams();
    if (traite !== undefined) {
      params = params.set('traite', String(traite));
    }
    return this.http.put<ContactMessageDto>(`${this.baseUrl}/api/gestionnaire/messages/${id}/traite`, {}, { params });
  }

  supprimerMessageContact(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/gestionnaire/messages/${id}`);
  }

  // =============================================
  // MODULE PRESTATIONS (CMS / NOS PRESTATIONS)
  // =============================================

  getPrestationsPublic(page?: number, size?: number): Observable<PrestationDto[]> {
    let params = new HttpParams();
    if (page !== undefined && size !== undefined) {
      params = params.set('page', page.toString()).set('size', size.toString());
    }
    const options = (page !== undefined && size !== undefined) ? { params } : {};
    return this.http.get<any>(`${this.baseUrl}/api/prestations`, options).pipe(
      map(res => {
        if (!res) return [];
        if (res.data) {
          if (Array.isArray(res.data.Prestations)) return res.data.Prestations;
          if (Array.isArray(res.data.prestations)) return res.data.prestations;
          if (Array.isArray(res.data.items)) return res.data.items;
          if (Array.isArray(res.data.slides)) return res.data.slides;
          if (Array.isArray(res.data)) return res.data;
        }
        if (Array.isArray(res)) return res;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  getPrestationsGestionnaire(page?: number, size?: number): Observable<PrestationDto[]> {
    let params = new HttpParams();
    if (page !== undefined && size !== undefined) {
      params = params.set('page', page.toString()).set('size', size.toString());
    }
    const options = (page !== undefined && size !== undefined) ? { params } : {};
    return this.http.get<any>(`${this.baseUrl}/api/gestionnaire/prestations`, options).pipe(
      map(res => {
        if (!res) return [];
        if (res.data) {
          if (Array.isArray(res.data.Prestations)) return res.data.Prestations;
          if (Array.isArray(res.data.prestations)) return res.data.prestations;
          if (Array.isArray(res.data.items)) return res.data.items;
          if (Array.isArray(res.data.slides)) return res.data.slides;
          if (Array.isArray(res.data)) return res.data;
        }
        if (Array.isArray(res)) return res;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  getPrestationById(id: number): Observable<PrestationDto> {
    return this.http.get<PrestationDto>(`${this.baseUrl}/api/gestionnaire/prestations/${id}`);
  }

  creerPrestation(prestation: PrestationDto): Observable<PrestationDto> {
    return this.http.post<PrestationDto>(`${this.baseUrl}/api/gestionnaire/prestations`, prestation);
  }

  modifierPrestation(id: number, prestation: PrestationDto): Observable<PrestationDto> {
    return this.http.put<PrestationDto>(`${this.baseUrl}/api/gestionnaire/prestations/${id}`, prestation);
  }

  togglePrestationActif(id: number, actif?: boolean): Observable<PrestationDto> {
    let params = new HttpParams();
    if (actif !== undefined) {
      params = params.set('actif', String(actif));
    }
    return this.http.patch<PrestationDto>(`${this.baseUrl}/api/gestionnaire/prestations/${id}/actif`, {}, { params });
  }

  supprimerPrestation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/gestionnaire/prestations/${id}`);
  }
}

export interface PrestationImageDto {
  id?: number;
  url: string;
  alt?: string;
  caption?: string;
  ordreAffichage?: number;
}

export interface PrestationDto {
  id?: number;
  code?: string;
  indexNum?: string;
  tabTitle: string;
  subtitle?: string;
  title: string;
  desc?: string;
  description?: string;
  ordreAffichage?: number;
  actif?: boolean;
  showCatalogueCta?: boolean;
  images: PrestationImageDto[];
  currentPhotoIndex?: number;
}

export interface MembreEquipeDto {
  id?: number;
  nom: string;
  titre: string;
  description?: string;
  photoUrl?: string;
  tag?: string;
  ordreAffichage?: number;
  actif?: boolean;
}

export interface ContactMessageDto {
  id?: number;
  nom: string;
  email: string;
  telephone?: string;
  sujet: string;
  message: string;
  dateEnvoi?: string;
  traite?: boolean;
}

