export interface SiteB2B {
  id: string;
  nom: string;
  adresse: string;
  heureCutOff: string; // ex: "10:30"
  contactReferent: string;
  telephoneReferent: string;
  creneauxDisponibles?: string[];
}

export interface EntrepriseB2B {
  id: string;
  nom: string;
  codeEntreprise: string;
  tauxPriseEnCharge: number; // ex: 100 ou 70 (%)
  plafondJournalier: number; // en FCFA
  budgetMensuelAlloue: number; // ex: 15 000 000 FCFA
  sites: SiteB2B[];
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
  actif: boolean;
  repasConsommesMois: number;
  montantPrisEnChargeMois: number;
}

export interface LignePanierAutonome {
  plat: PlatB2B;
  quantite: number;
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
