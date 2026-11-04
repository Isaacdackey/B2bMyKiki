export interface LigneDevisDetaillee {
  id: string;
  designation: string;
  description: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  totalHT: number;
}

export interface PropositionEvenement {
  id: string;
  demandeId: string;
  numeroDevis: string;
  dateEmission: string;
  validiteDate: string;
  gestionnaireNom: string;
  statut: 'EN_ATTENTE_CLIENT' | 'ACCEPTEE' | 'REFUSEE';
  lignes: LigneDevisDetaillee[];
  totalHT: number;
  tauxTVA: number; // 18%
  totalTTC: number;
  remiseCommerciale: number;
  acompteRequis: number; // 50%
  commentairesChef: string;
}

export interface DemandeEvenementB2B {
  id: string;
  reference: string;
  entrepriseNom: string;
  demandeurNom: string;
  demandeurEmail: string;
  demandeurTelephone: string;
  typeEvenement: 'SEMINAIRE' | 'COCKTAIL_DINATOIRE' | 'GALA_ENTREPRISE' | 'SALLE_DIVA_PRIVATISATION';
  lieuChoisi: 'SALLE_DIVA' | 'SITE_ENTREPRISE' | 'EXTERIEUR';
  dateEvenement: string;
  heureDebut: string;
  heureFin: string;
  nbConvives: number;
  budgetEstime?: number;
  besoinsSpecifiques: string[]; // ['Service en gants blancs', 'Équipement Sono & Micro', 'Atelier Découpe Jambon/Bœuf', 'Buffet Végétarien']
  statut: 'EN_ETUDE' | 'PROPOSITION_ENVOYEE' | 'CONFIRMEE' | 'CLOTUREE';
  proposition?: PropositionEvenement;
}

