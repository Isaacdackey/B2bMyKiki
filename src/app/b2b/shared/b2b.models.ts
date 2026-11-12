export type UserRoleB2B = 'SUPER_ADMIN' | 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI' | 'SALARIE_CONVENTIONNE' | 'SALARIE_AUTONOME';

export interface UserSessionB2B {
  role: UserRoleB2B;
  nomComplet: string;
  titrePoste: string;
  entite: string; // Ex: "TotalEnergies Sénégal" ou "Kiki Traiteur Exploitation"
  siteId?: string;
  siteNom?: string;
  matricule?: string;
  badge: string;
  badgeColor: string;
}

export type CategoriePlatB2B = 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON' | string;

export type TypePrestationB2B = 'CUISINE_SUR_PLACE' | 'SERVICE_SUR_PLACE' | 'LIVRAISON_BARQUETTES' | string;

export interface PrestationConfigB2B {
  type: string;
  libelle: string;
  description?: string;
  categoriesAutorisees: string[]; // Ex: ['PLAT', 'BOISSON']
}

export type TypeCutOffB2B = 'J_MOINS_1' | 'JOUR_J';

export interface CutOffConfigB2B {
  type: TypeCutOffB2B; // 'J_MOINS_1' (La veille) ou 'JOUR_J' (Le jour même)
  heure: string; // ex: "18:00" ou "09:00"
}

export interface SiteB2B {
  id: string;
  nom: string;
  adresse: string;
  heureCutOff: string; // ex: "10:30"
  contactReferent: string;
  telephoneReferent: string;
  creneauxDisponibles?: string[];
  typePrestation?: TypePrestationB2B;
  categoriesAutorisees?: CategoriePlatB2B[];
}

export interface EntrepriseB2B {
  id: string;
  nom: string;
  codeEntreprise: string;
  ninea?: string;
  rccm?: string; // Registre de Commerce et du Crédit Mobilier
  adresse?: string; // Adresse physique directe (1 Site = 1 Entreprise)
  emailContact?: string;
  telephone?: string;
  contactReferent?: string;
  
  // Prise en charge & Tarification par repas
  montantPriseEnChargeRepas: number; // Ex: 5000 FCFA (tarif/offre du repas vendu par Kiki)
  tauxPriseEnCharge?: number; // compatibilité legacy si nécessaire
  plafondJournalier?: number; // en FCFA
  budgetMensuelAlloue?: number; // ex: 15 000 000 FCFA
  tarifNegocieHtva?: number; // ex: 4500 FCFA
  cadenceFacturation?: 'HEBDOMADAIRE' | 'MENSUELLE' | 'BIMESTRIELLE';
  
  // Cut-off heure limite de commande
  cutOffType: TypeCutOffB2B; // 'J_MOINS_1' ou 'JOUR_J'
  cutOffHeure: string; // Ex: '18:00' ou '09:00'

  // Prestation et catégories
  typePrestation: TypePrestationB2B; // 'CUISINE_SUR_PLACE' | 'SERVICE_SUR_PLACE' | 'LIVRAISON_BARQUETTES'
  categoriesAutorisees: CategoriePlatB2B[]; // ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
  
  isArchivee?: boolean;
  sites: SiteB2B[]; // Garanti non-optionnel pour la rétro-compatibilité
}

export interface PlatB2B {
  id: string;
  nom: string;
  description: string;
  categorie: 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON';
  prixUnitaire: number;
  image: string;
  allergene?: string;
  calories?: number;
  disponible?: boolean; // Activable / désactivable par le Responsable de Site selon le stock
  isArchive?: boolean; // Archivage du catalogue par le Super Admin
}

export interface FormuleRegle {
  id: string;
  nom: string;
  description: string;
  prixForfait: number; // ex: 5000 FCFA
  quotas: {
    ENTREE: number;
    PLAT: number;
    DESSERT: number;
    BOISSON: number;
  };
}

export interface SelectionRepas {
  entree?: PlatB2B;
  plat?: PlatB2B;
  dessert?: PlatB2B;
  boisson?: PlatB2B;
  supplements: PlatB2B[];
}

export interface EmployeB2B {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  siteId: string;
  siteNom?: string;
  departement: string;
  type: 'SUBVENTIONNE' | 'AUTONOME';
  tauxSubvention: number; // Taux de prise en charge paramétrable de 0% à 100%
  actif: boolean;
  repasConsommesMois: number;
  montantPrisEnChargeMois: number;
}

export interface LignePanierAutonome {
  plat: PlatB2B;
  quantite: number;
}

export type StatutCommandeSite = 'EN_COURS' | 'SCANNE' | 'LIVRE';

export interface CommandeEntrepriseSite {
  id: string;
  codeCommande: string;
  entrepriseId: string;
  entrepriseNom: string;
  matricule: string;
  employeNom: string;
  categorie: 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON';
  platNom: string;
  date: string; // YYYY-MM-DD
  heure: string; // HH:mm
  montantTotal: number;
  partEntreprise: number;
  partEmploye: number;
  statut: StatutCommandeSite;
  scanneAt?: string;
  livreAt?: string;
}

export interface FacturationLigneJournaliere {
  date: string; // YYYY-MM-DD
  dateAffichee: string; // ex: 12 nov. 2026
  nbPlatsLivres: number;
  nbPresents: number; // effectif ayant émargé/badgé
  montantTotal: number;
  montantPartEntreprise: number;
  montantPartEmploye: number;
  statut: 'FACTURE' | 'EN_COURS' | 'VALIDE';
}

export interface LigneMenuPlanifie {
  id: string;
  categorie: CategoriePlatB2B;
  platId: string;
  nomPlat: string;
  image?: string;
  quantitePrevue: number; // Saisie par le Responsable Site / Admin
  disponible?: boolean;
}

export interface MenuPlanifieJourEntreprise {
  id: string;
  entrepriseId: string;
  jourNom: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
  dateStr: string; // YYYY-MM-DD
  theme?: string;
  lignes: LigneMenuPlanifie[];
  quantitesSaisies: boolean; // Tant que false => ne s'affiche pas chez les salariés
  statutConformite: 'CONFORME' | 'NON_CONFORME' | 'NON_SAISI';
}

export interface InvitationAdminB2B {
  id: string;
  email: string;
  nomComplet: string;
  role: 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI';
  roleLibelle: string;
  entrepriseId: string;
  entrepriseNom: string;
  dateEnvoi: string;
  tokenActivation: string;
  statut: 'EN_ATTENTE' | 'ACTIVE';
}

export interface CommandeHistoriqueB2B {
  id: string;
  date: string; // YYYY-MM-DD
  heure: string;
  matricule: string;
  employeNom: string;
  siteId: string;
  siteNom: string;
  formuleNom: string;
  platNom: string;
  prixTotal: number;
  partEntreprise: number;
  partEmploye: number;
  statut: 'LIVRE' | 'VALIDE' | 'EN_PREPARATION';
}

export interface PlanningMenuSiteB2B {
  id: string;
  jour: string; // Ex: 'Lundi', 'Mardi (Aujourd\'hui)', etc.
  date: string; // Ex: '04 Nov'
  cadence: 'HEBDO' | 'MENSUEL';
  theme: string;
  platVedette: string;
  entreeProposee?: string;
  dessertPropose?: string;
  boissonProposee?: string;
  siteId: string; // 'TOUS' ou id spécifique (ex: 'site-1')
  siteNom: string; // Ex: 'Tous les sites (Global)' ou 'Siège Plateau - Dakar'
  entrepriseNom?: string; // Ex: 'TotalEnergies Sénégal'
  totalPrevu: number;
  statut: 'CLOTURE' | 'EN_PRODUCTION' | 'VALIDE' | 'PROGRAMME';
}
