export interface LigneProductionCuisine {
  platId: string;
  nomPlat: string;
  categorie: 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON';
  quantiteTotale: number;
  unite: string;
  statut: 'EN_ATTENTE' | 'EN_CUISSON' | 'PREPARATION_TERMINEE';
}

export interface CommandePersonnelleAutonome {
  id: string;
  codeCommande: string;
  clientNom: string;
  telephone: string;
  siteNom: string;
  articles: string;
  montantTotal: number;
  heurePrevue: string;
  statut: 'EN_PREPARATION' | 'PRET_AU_RETRAIT' | 'LIVRE';
}

export interface BonLivraisonSite {
  id: string;
  numeroBL: string;
  dateLivraison: string;
  siteId: string;
  siteNom: string;
  adresseLivraison: string;
  creneau: string;
  contactReferent: string;
  telephoneReferent: string;
  nbPlateauxTotal: number;
  chauffeurLivreur: string;
  heureDepartPrevue: string;
  statut: 'A_PREPARER' | 'EXPEDIE' | 'LIVRE';
  emargementEffectue: boolean;
  lignes: {
    employeNom: string;
    matricule: string;
    detailPlateau: string;
    emargement: string;
  }[];
}

