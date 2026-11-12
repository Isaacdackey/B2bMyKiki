import { Injectable, signal, computed, effect } from '@angular/core';
import { EntrepriseB2B, SiteB2B, PlatB2B, FormuleRegle, EmployeB2B, SelectionRepas, CommandeHistoriqueB2B, LignePanierAutonome, UserRoleB2B, UserSessionB2B, CommandeEntrepriseSite, FacturationLigneJournaliere, MenuPlanifieJourEntreprise, InvitationAdminB2B, StatutCommandeSite } from './b2b.models';

@Injectable({
  providedIn: 'root'
})
export class B2bStateService {
  // Session utilisateur B2B active (conformité stricte aux 4 rôles exigés par le Mentor Tonton Fufu)
  currentSession = signal<UserSessionB2B>({
    role: 'RESPONSABLE_ENTREPRISE',
    nomComplet: 'Mme Fatou Fall',
    titrePoste: 'Responsable RH & Moyens Généraux',
    entite: 'TotalEnergies Sénégal',
    siteId: 'site-1',
    siteNom: 'Siège Plateau - Dakar',
    badge: 'Responsable Entreprise',
    badgeColor: '#721513'
  });

  // Section active dans l'Espace Super Admin Kiki Traiteur
  superAdminActiveSection = signal<'DASHBOARD' | 'ENTREPRISES' | 'SITES' | 'CATALOGUE' | 'PLANNING' | 'FACTURATION'>('DASHBOARD');

  // Section active dans l'Espace Responsable Entreprise (RH) : Dashboard Vue Globale par défaut
  rhActiveSection = signal<'STATISTIQUES' | 'COMMANDES_SITE' | 'EMPLOYES' | 'FACTURATION' | 'SITES'>('STATISTIQUES');

  // Types de prestation configurables
  typesPrestationConfigurables = signal<{ code: string; libelle: string; desc: string; categoriesDefaut: string[] }[]>([
    { 
      code: 'CUISINE_SUR_PLACE', 
      libelle: 'Cuisine et service sur place', 
      desc: 'Préparation et dressage en restaurant d’entreprise sur place', 
      categoriesDefaut: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'] 
    },
    { 
      code: 'SERVICE_SUR_PLACE', 
      libelle: 'Service sur place (Réfectoire)', 
      desc: 'Plats cuisinés acheminés chauds et servis à l’assiette au réfectoire', 
      categoriesDefaut: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'] 
    },
    { 
      code: 'LIVRAISON_BARQUETTES', 
      libelle: 'Livraison en barquettes', 
      desc: 'Conditionnement individuel hermétique scellé et étiqueté', 
      categoriesDefaut: ['PLAT', 'BOISSON'] 
    }
  ]);

  // Catégories alimentaires configurables
  categoriesConfigurables = signal<{ code: string; libelle: string; icone: string; couleur: string }[]>([
    { code: 'ENTREE', libelle: 'Entrée', icone: 'fa-leaf', couleur: '#606C38' },
    { code: 'PLAT', libelle: 'Plat chaud', icone: 'fa-bowl-food', couleur: '#721513' },
    { code: 'DESSERT', libelle: 'Dessert', icone: 'fa-cake-candles', couleur: '#C5A880' },
    { code: 'BOISSON', libelle: 'Boisson', icone: 'fa-wine-glass', couleur: '#332724' }
  ]);

  // Ajouter un nouveau type de prestation
  ajouterTypePrestation(item: { code: string; libelle: string; desc: string; categoriesDefaut: string[] }) {
    this.typesPrestationConfigurables.update(list => [...list, item]);
  }

  // Ajouter une nouvelle catégorie alimentaire
  ajouterCategorie(item: { code: string; libelle: string; icone: string; couleur: string }) {
    this.categoriesConfigurables.update(list => [...list, item]);
  }

  // Méthode pour ajouter une entreprise cliente
  ajouterEntreprise(nouvelle: Omit<EntrepriseB2B, 'id' | 'sites'>) {
    const id = 'ent-' + Date.now();
    const ent: EntrepriseB2B = {
      ...nouvelle,
      id,
      sites: []
    };
    this.listeEntreprises.update(list => [ent, ...list]);
    return ent;
  }

  // Méthode pour modifier une entreprise cliente
  modifierEntreprise(id: string, updates: Partial<EntrepriseB2B>) {
    this.listeEntreprises.update(list => list.map(e => e.id === id ? { ...e, ...updates } : e));
    if (this.currentEntreprise().id === id) {
      this.currentEntreprise.update(e => ({ ...e, ...updates }));
    }
  }

  // Méthode pour archiver / désarchiver une entreprise
  toggleArchiverEntreprise(id: string) {
    this.listeEntreprises.update(list => list.map(e => e.id === id ? { ...e, isArchivee: !e.isArchivee } : e));
  }

  // Méthode pour ajouter un site à une entreprise
  ajouterSiteAEntreprise(entrepriseId: string, site: Omit<SiteB2B, 'id'>) {
    const siteId = 'site-' + Date.now();
    const nouveauSite: SiteB2B = { ...site, id: siteId };
    this.listeEntreprises.update(list => list.map(e => {
      if (e.id === entrepriseId) {
        return { ...e, sites: [...e.sites, nouveauSite] };
      }
      return e;
    }));
    if (this.currentEntreprise().id === entrepriseId) {
      this.currentEntreprise.update(e => ({ ...e, sites: [...e.sites, nouveauSite] }));
    }
    return nouveauSite;
  }

  // Méthode pour modifier un site
  modifierSite(entrepriseId: string, siteId: string, updates: Partial<SiteB2B>) {
    this.listeEntreprises.update(list => list.map(e => {
      if (e.id === entrepriseId) {
        return {
          ...e,
          sites: e.sites.map(s => s.id === siteId ? { ...s, ...updates } : s)
        };
      }
      return e;
    }));
    if (this.currentEntreprise().id === entrepriseId) {
      this.currentEntreprise.update(e => ({
        ...e,
        sites: e.sites.map(s => s.id === siteId ? { ...s, ...updates } : s)
      }));
    }
  }

  // Méthodes Catalogue Global Super Admin (Ajouter, Modifier, Archiver)
  ajouterPlatCatalogue(plat: Omit<PlatB2B, 'id'>) {
    const nouveauPlat: PlatB2B = { ...plat, id: 'plat-' + Date.now(), disponible: true, isArchive: false };
    this.catalogueJour.update(list => [nouveauPlat, ...list]);
  }

  modifierPlatCatalogue(id: string, updates: Partial<PlatB2B>) {
    this.catalogueJour.update(list => list.map(p => p.id === id ? { ...p, ...updates } : p));
  }

  toggleArchiverPlat(id: string) {
    this.catalogueJour.update(list => list.map(p => p.id === id ? { ...p, isArchive: !p.isArchive } : p));
  }

  // Onglet actif dans l'Espace Responsable de Site Kiki (Cuisine & Dispatch)
  cuisineActiveTab = signal<'PRODUCTION' | 'SCAN_QR' | 'AUTONOME' | 'BORDEREAUX' | 'PLANNING_SEMAINE'>('PRODUCTION');

  // Mode profil employé simulé : SUBVENTIONNE (prise en charge RH 100%) ou AUTONOME (frais personnels, panier libre, Wave)
  modeProfil = signal<'SUBVENTIONNE' | 'AUTONOME'>('SUBVENTIONNE');

  // État de la Sidebar rétractable (Collapsed / Expanded) persisté
  isSidebarCollapsed = signal<boolean>(localStorage.getItem('b2b_sidebar_collapsed') === 'true');

  // État du Drawer Mobile (< 1024px)
  isMobileDrawerOpen = signal<boolean>(false);

  constructor() {
    // Définition immédiate dès le premier rendu
    this.updateSidebarCssVar(this.isSidebarCollapsed());

    // Réaction réactive aux changements d'état
    effect(() => {
      const collapsed = this.isSidebarCollapsed();
      this.updateSidebarCssVar(collapsed);
    });
  }

  private updateSidebarCssVar(collapsed: boolean) {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--b2b-sidebar-w', collapsed ? '80px' : '300px');
    }
  }

  toggleSidebar() {
    this.isSidebarCollapsed.update(v => {
      const next = !v;
      localStorage.setItem('b2b_sidebar_collapsed', String(next));
      return next;
    });
  }

  toggleMobileDrawer() {
    this.isMobileDrawerOpen.update(v => {
      const next = !v;
      this.handleBodyScrollLock(next);
      return next;
    });
  }

  closeMobileDrawer() {
    this.isMobileDrawerOpen.set(false);
    this.handleBodyScrollLock(false);
  }

  private handleBodyScrollLock(lock: boolean) {
    if (typeof document !== 'undefined' && document.body) {
      if (lock) {
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
      } else {
        document.body.style.removeProperty('overflow');
        document.body.style.removeProperty('touch-action');
      }
    }
  }

  // Panier libre pour le salarié autonome / prestataire
  panierAutonome = signal<LignePanierAutonome[]>([]);

  // Liste des entreprises clientes conventionnées (1 Site = 1 Entreprise)
  listeEntreprises = signal<EntrepriseB2B[]>([
    {
      id: 'ent-001',
      nom: 'TotalEnergies — Siège Plateau',
      codeEntreprise: 'TOT-PLA',
      ninea: '001294829 2V1',
      rccm: 'SN-DKR-2012-B-1428',
      adresse: 'Boulevard de la République, Dakar Plateau',
      emailContact: 'moyens.generaux@totalenergies.sn',
      telephone: '+221 33 832 29 66',
      contactReferent: 'M. Babacar Ndiaye (RH)',
      montantPriseEnChargeRepas: 5000,
      tauxPriseEnCharge: 100,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 18500000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'MENSUELLE',
      cutOffType: 'J_MOINS_1',
      cutOffHeure: '18:00',
      typePrestation: 'CUISINE_SUR_PLACE',
      categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
      isArchivee: false,
      sites: [
        { 
          id: 'site-1', 
          nom: 'TotalEnergies — Siège Plateau', 
          adresse: 'Boulevard de la République, Dakar Plateau', 
          heureCutOff: '18:00 (J-1)', 
          contactReferent: 'M. Babacar Ndiaye (RH)', 
          telephoneReferent: '+221 77 123 45 67',
          typePrestation: 'CUISINE_SUR_PLACE',
          categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
        }
      ]
    },
    {
      id: 'ent-002',
      nom: 'TotalEnergies — Dépôt Bel-Air Port',
      codeEntreprise: 'TOT-BEL',
      ninea: '001294829 2V1',
      rccm: 'SN-DKR-2012-B-1428',
      adresse: 'Zone Industrielle Bel-Air, Port Autonome de Dakar',
      emailContact: 'logistique.belair@totalenergies.sn',
      telephone: '+221 33 849 11 22',
      contactReferent: 'Mme Aminata Sow (Logistique)',
      montantPriseEnChargeRepas: 5000,
      tauxPriseEnCharge: 100,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 12000000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'MENSUELLE',
      cutOffType: 'JOUR_J',
      cutOffHeure: '09:00',
      typePrestation: 'LIVRAISON_BARQUETTES',
      categoriesAutorisees: ['PLAT', 'BOISSON'],
      isArchivee: false,
      sites: [
        { 
          id: 'site-2', 
          nom: 'TotalEnergies — Dépôt Bel-Air Port', 
          adresse: 'Zone Industrielle Bel-Air, Port Autonome de Dakar', 
          heureCutOff: '09:00 (Jour J)', 
          contactReferent: 'Mme Aminata Sow (Logistique)', 
          telephoneReferent: '+221 78 234 56 78',
          typePrestation: 'LIVRAISON_BARQUETTES',
          categoriesAutorisees: ['PLAT', 'BOISSON']
        }
      ]
    },
    {
      id: 'ent-003',
      nom: 'Sonatel Orange — Siège Technopole Pikine',
      codeEntreprise: 'SONA-PIK',
      ninea: '003849182 2K4',
      rccm: 'SN-DKR-1997-B-5821',
      adresse: 'Parc Technologique de la Sonatel, Pikine',
      emailContact: 'comite.entreprise@orange-sonatel.sn',
      telephone: '+221 33 839 12 00',
      contactReferent: 'Mme Awa Cissé (RH)',
      montantPriseEnChargeRepas: 5000,
      tauxPriseEnCharge: 70,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 25000000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'HEBDOMADAIRE',
      cutOffType: 'J_MOINS_1',
      cutOffHeure: '17:30',
      typePrestation: 'SERVICE_SUR_PLACE',
      categoriesAutorisees: ['PLAT', 'DESSERT', 'BOISSON'],
      isArchivee: false,
      sites: [
        {
          id: 'site-sona-1',
          nom: 'Sonatel Orange — Siège Technopole Pikine',
          adresse: 'Parc Technologique de la Sonatel, Pikine',
          heureCutOff: '17:30 (J-1)',
          contactReferent: 'Mme Awa Cissé (RH)',
          telephoneReferent: '+221 77 450 99 88',
          typePrestation: 'SERVICE_SUR_PLACE',
          categoriesAutorisees: ['PLAT', 'DESSERT', 'BOISSON']
        }
      ]
    },
    {
      id: 'ent-004',
      nom: 'Sonatel Orange — Agence Cheikh Anta Diop',
      codeEntreprise: 'SONA-FANN',
      ninea: '003849182 2K4',
      rccm: 'SN-DKR-1997-B-5821',
      adresse: 'Avenue Cheikh Anta Diop, Fann',
      emailContact: 'agence.fann@orange-sonatel.sn',
      telephone: '+221 33 869 40 00',
      contactReferent: 'M. Mansour Sy',
      montantPriseEnChargeRepas: 5000,
      tauxPriseEnCharge: 70,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 8000000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'HEBDOMADAIRE',
      cutOffType: 'JOUR_J',
      cutOffHeure: '09:30',
      typePrestation: 'LIVRAISON_BARQUETTES',
      categoriesAutorisees: ['PLAT', 'BOISSON'],
      isArchivee: false,
      sites: [
        {
          id: 'site-sona-2',
          nom: 'Sonatel Orange — Agence Cheikh Anta Diop',
          adresse: 'Avenue Cheikh Anta Diop, Fann',
          heureCutOff: '09:30 (Jour J)',
          contactReferent: 'M. Mansour Sy',
          telephoneReferent: '+221 78 112 33 44',
          typePrestation: 'LIVRAISON_BARQUETTES',
          categoriesAutorisees: ['PLAT', 'BOISSON']
        }
      ]
    },
    {
      id: 'ent-005',
      nom: 'CBAO Attijariwafa — Place Indépendance',
      codeEntreprise: 'CBAO-IND',
      ninea: '004192837 1B2',
      rccm: 'SN-DKR-2005-B-3104',
      adresse: '1 Place de l\'Indépendance, Dakar Plateau',
      emailContact: 'services.generaux@cbao.sn',
      telephone: '+221 33 849 96 96',
      contactReferent: 'Mme Marième Diallo (DRH)',
      montantPriseEnChargeRepas: 5000,
      tauxPriseEnCharge: 80,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 16000000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'MENSUELLE',
      cutOffType: 'J_MOINS_1',
      cutOffHeure: '18:00',
      typePrestation: 'SERVICE_SUR_PLACE',
      categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT'],
      isArchivee: false,
      sites: [
        {
          id: 'site-cbao-1',
          nom: 'CBAO Attijariwafa — Place Indépendance',
          adresse: '1 Place de l\'Indépendance, Dakar Plateau',
          heureCutOff: '18:00 (J-1)',
          contactReferent: 'Mme Marième Diallo (DRH)',
          telephoneReferent: '+221 77 310 22 11',
          typePrestation: 'SERVICE_SUR_PLACE',
          categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT']
        }
      ]
    },
    {
      id: 'ent-006',
      nom: 'Port Autonome de Dakar (PAD) — Direction',
      codeEntreprise: 'PAD-DIR',
      ninea: '001029384 2G9',
      rccm: 'SN-DKR-1988-B-0941',
      adresse: '21 Boulevard de la Libération, Dakar',
      emailContact: 'intendance@portdakar.sn',
      telephone: '+221 33 849 45 45',
      contactReferent: 'M. Ousmane Ndoye',
      montantPriseEnChargeRepas: 5000,
      tauxPriseEnCharge: 100,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 21000000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'MENSUELLE',
      cutOffType: 'JOUR_J',
      cutOffHeure: '08:45',
      typePrestation: 'CUISINE_SUR_PLACE',
      categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
      isArchivee: false,
      sites: [
        {
          id: 'site-pad-1',
          nom: 'Port Autonome de Dakar (PAD) — Direction',
          adresse: '21 Boulevard de la Libération, Dakar',
          heureCutOff: '08:45 (Jour J)',
          contactReferent: 'M. Ousmane Ndoye',
          telephoneReferent: '+221 77 612 90 00',
          typePrestation: 'CUISINE_SUR_PLACE',
          categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
        }
      ]
    }
  ]);

  // Entreprise active
  currentEntreprise = signal<EntrepriseB2B>(this.listeEntreprises()[0]);

  selectedSiteId = signal<string>('site-1');

  // Employé actif pour la commande
  currentEmploye = signal<EmployeB2B>({
    id: 'emp-101',
    matricule: 'TOT-9842',
    nom: 'Ndiaye',
    prenom: 'Babacar',
    email: 'b.ndiaye@totalenergies.sn',
    telephone: '+221 77 123 45 67',
    siteId: 'site-1',
    siteNom: 'Siège Plateau - Dakar',
    departement: 'Finance & Comptabilité',
    type: 'SUBVENTIONNE',
    tauxSubvention: 100, // Prise en charge 100%
    actif: true,
    repasConsommesMois: 18,
    montantPrisEnChargeMois: 90000
  });

  // Liste des invitations administrateurs par email
  listeInvitationsAdmins = signal<InvitationAdminB2B[]>([
    {
      id: 'inv-1',
      email: 'moyens.generaux@totalenergies.sn',
      nomComplet: 'Mme Fatou Fall (RH / DAF)',
      role: 'RESPONSABLE_ENTREPRISE',
      roleLibelle: 'Admin Entreprise (RH)',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      dateEnvoi: '2026-11-10 09:30',
      tokenActivation: 'ACT-TOT-RH-99827',
      statut: 'ACTIVE'
    },
    {
      id: 'inv-2',
      email: 'chef.cantine.plateau@kikitraiteur.sn',
      nomComplet: 'Mamadou Seck (Chef Gérant)',
      role: 'RESPONSABLE_SITE_KIKI',
      roleLibelle: 'Responsable de Site Kiki',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      dateEnvoi: '2026-11-11 11:15',
      tokenActivation: 'ACT-KIKI-SITE-44219',
      statut: 'EN_ATTENTE'
    }
  ]);

  // Menus planifiés par entreprise (Calendrier Semaine Lundi - Dimanche avec quantités & conformité)
  menusPlanifiesEntreprises = signal<MenuPlanifieJourEntreprise[]>([
    {
      id: 'plan-ent1-lun',
      entrepriseId: 'ent-001',
      jourNom: 'Lundi',
      dateStr: '2026-11-09',
      theme: 'Saveurs Sénégalaises & Terroir',
      quantitesSaisies: true,
      statutConformite: 'CONFORME',
      lignes: [
        { id: 'l1', categorie: 'ENTREE', platId: 'e1', nomPlat: 'Salade Niçoise au Thon Frais', quantitePrevue: 35, disponible: true },
        { id: 'l2', categorie: 'ENTREE', platId: 'e2', nomPlat: 'Pastels Dorés au Thon (x3)', quantitePrevue: 40, disponible: true },
        { id: 'l3', categorie: 'PLAT', platId: 'p1', nomPlat: 'Poulet Yassa Braisé Kiki & Riz Parfumé', quantitePrevue: 45, disponible: true },
        { id: 'l4', categorie: 'PLAT', platId: 'p4', nomPlat: 'Thiéboudienne Penda Mbaye Royal', quantitePrevue: 35, disponible: true },
        { id: 'l5', categorie: 'DESSERT', platId: 'd1', nomPlat: 'Coupe de Fruits Exotiques Frais', quantitePrevue: 40, disponible: true },
        { id: 'l6', categorie: 'DESSERT', platId: 'd2', nomPlat: 'Fondant Chocolat Intense', quantitePrevue: 35, disponible: true },
        { id: 'l7', categorie: 'BOISSON', platId: 'b1', nomPlat: 'Jus Naturel de Bissap Frais Menthe', quantitePrevue: 45, disponible: true },
        { id: 'l8', categorie: 'BOISSON', platId: 'b3', nomPlat: 'Eau Minérale Naturelle Kirène (50cl)', quantitePrevue: 35, disponible: true }
      ]
    },
    {
      id: 'plan-ent1-mar',
      entrepriseId: 'ent-001',
      jourNom: 'Mardi',
      dateStr: '2026-11-10',
      theme: 'Pêche Fraîche & Grillades',
      quantitesSaisies: true,
      statutConformite: 'CONFORME',
      lignes: [
        { id: 'l9', categorie: 'ENTREE', platId: 'e3', nomPlat: 'Velouté de Légumes & Croûtons d\'Ail', quantitePrevue: 30, disponible: true },
        { id: 'l10', categorie: 'ENTREE', platId: 'e1', nomPlat: 'Salade Niçoise au Thon Frais', quantitePrevue: 45, disponible: true },
        { id: 'l11', categorie: 'PLAT', platId: 'p2', nomPlat: 'Capitaine Braisé & Riz Jasmin', quantitePrevue: 50, disponible: true },
        { id: 'l12', categorie: 'PLAT', platId: 'p3', nomPlat: 'Pavé de Bœuf aux Herbes & Légumes', quantitePrevue: 30, disponible: true },
        { id: 'l13', categorie: 'DESSERT', platId: 'd3', nomPlat: 'Yaourt Onctueux Fait Maison au Miel', quantitePrevue: 40, disponible: true },
        { id: 'l14', categorie: 'DESSERT', platId: 'd1', nomPlat: 'Coupe de Fruits Exotiques Frais', quantitePrevue: 35, disponible: true },
        { id: 'l15', categorie: 'BOISSON', platId: 'b2', nomPlat: 'Jus de Bouye Artisanal', quantitePrevue: 40, disponible: true },
        { id: 'l16', categorie: 'BOISSON', platId: 'b1', nomPlat: 'Jus de Bissap Frais Menthe', quantitePrevue: 40, disponible: true }
      ]
    },
    {
      id: 'plan-ent1-mer',
      entrepriseId: 'ent-001',
      jourNom: 'Mercredi',
      dateStr: '2026-11-11',
      theme: 'Rôtisserie & Saveurs d\'Afrique',
      quantitesSaisies: true,
      statutConformite: 'CONFORME',
      lignes: [
        { id: 'l17', categorie: 'ENTREE', platId: 'e2', nomPlat: 'Pastels Dorés au Thon (x3)', quantitePrevue: 45, disponible: true },
        { id: 'l18', categorie: 'PLAT', platId: 'p1', nomPlat: 'Poulet Yassa Braisé Kiki & Riz Parfumé', quantitePrevue: 50, disponible: true },
        { id: 'l19', categorie: 'PLAT', platId: 'p4', nomPlat: 'Thiéboudienne Penda Mbaye Royal', quantitePrevue: 30, disponible: true },
        { id: 'l20', categorie: 'DESSERT', platId: 'd2', nomPlat: 'Fondant Chocolat Intense', quantitePrevue: 40, disponible: true },
        { id: 'l21', categorie: 'BOISSON', platId: 'b1', nomPlat: 'Jus Naturel de Bissap Frais Menthe', quantitePrevue: 45, disponible: true },
        { id: 'l22', categorie: 'BOISSON', platId: 'b3', nomPlat: 'Eau Minérale Naturelle Kirène (50cl)', quantitePrevue: 35, disponible: true }
      ]
    },
    {
      id: 'plan-ent1-jeu',
      entrepriseId: 'ent-001',
      jourNom: 'Jeudi',
      dateStr: '2026-11-12',
      theme: 'Délices Culinaires du Chef',
      quantitesSaisies: true,
      statutConformite: 'CONFORME',
      lignes: [
        { id: 'l23', categorie: 'ENTREE', platId: 'e1', nomPlat: 'Salade Niçoise au Thon Frais', quantitePrevue: 40, disponible: true },
        { id: 'l24', categorie: 'PLAT', platId: 'p2', nomPlat: 'Capitaine Braisé & Riz Jasmin', quantitePrevue: 45, disponible: true },
        { id: 'l25', categorie: 'PLAT', platId: 'p1', nomPlat: 'Poulet Yassa Braisé Kiki & Riz Parfumé', quantitePrevue: 35, disponible: true },
        { id: 'l26', categorie: 'DESSERT', platId: 'd1', nomPlat: 'Coupe de Fruits Exotiques Frais', quantitePrevue: 40, disponible: true },
        { id: 'l27', categorie: 'DESSERT', platId: 'd3', nomPlat: 'Yaourt Onctueux Fait Maison au Miel', quantitePrevue: 35, disponible: true },
        { id: 'l28', categorie: 'BOISSON', platId: 'b2', nomPlat: 'Jus de Bouye Artisanal', quantitePrevue: 40, disponible: true },
        { id: 'l29', categorie: 'BOISSON', platId: 'b1', nomPlat: 'Jus de Bissap Frais Menthe', quantitePrevue: 40, disponible: true }
      ]
    },
    {
      id: 'plan-ent1-ven',
      entrepriseId: 'ent-001',
      jourNom: 'Vendredi',
      dateStr: '2026-11-13',
      theme: 'Thiéboudienne Sacré du Vendredi',
      quantitesSaisies: true,
      statutConformite: 'CONFORME',
      lignes: [
        { id: 'l30', categorie: 'ENTREE', platId: 'e2', nomPlat: 'Pastels Dorés au Thon (x3)', quantitePrevue: 50, disponible: true },
        { id: 'l31', categorie: 'PLAT', platId: 'p4', nomPlat: 'Thiéboudienne Penda Mbaye Royal (Riz Rouge)', quantitePrevue: 65, disponible: true },
        { id: 'l32', categorie: 'PLAT', platId: 'p3', nomPlat: 'Pavé de Bœuf aux Herbes & Légumes', quantitePrevue: 20, disponible: true },
        { id: 'l33', categorie: 'DESSERT', platId: 'd2', nomPlat: 'Fondant Chocolat Intense', quantitePrevue: 45, disponible: true },
        { id: 'l34', categorie: 'BOISSON', platId: 'b1', nomPlat: 'Jus Naturel de Bissap Frais Menthe', quantitePrevue: 55, disponible: true },
        { id: 'l35', categorie: 'BOISSON', platId: 'b2', nomPlat: 'Jus de Bouye Artisanal', quantitePrevue: 30, disponible: true }
      ]
    },
    {
      id: 'plan-ent1-sam',
      entrepriseId: 'ent-001',
      jourNom: 'Samedi',
      dateStr: '2026-11-14',
      theme: 'Permanence & Équipes Week-End',
      quantitesSaisies: false,
      statutConformite: 'NON_SAISI',
      lignes: [
        { id: 'l36', categorie: 'PLAT', platId: 'p1', nomPlat: 'Poulet Yassa Braisé Kiki & Riz Parfumé', quantitePrevue: 0, disponible: true },
        { id: 'l37', categorie: 'BOISSON', platId: 'b1', nomPlat: 'Jus Naturel de Bissap Frais Menthe', quantitePrevue: 0, disponible: true }
      ]
    },
    {
      id: 'plan-ent1-dim',
      entrepriseId: 'ent-001',
      jourNom: 'Dimanche',
      dateStr: '2026-11-15',
      theme: 'Service Restreint Dimanche',
      quantitesSaisies: false,
      statutConformite: 'NON_SAISI',
      lignes: [
        { id: 'l38', categorie: 'PLAT', platId: 'p4', nomPlat: 'Thiéboudienne Penda Mbaye Royal', quantitePrevue: 0, disponible: true },
        { id: 'l39', categorie: 'BOISSON', platId: 'b3', nomPlat: 'Eau Minérale Naturelle Kirène (50cl)', quantitePrevue: 0, disponible: true }
      ]
    }
  ]);

  // Commandes de site avec statuts : EN_COURS -> SCANNE -> LIVRE
  listeCommandesSite = signal<CommandeEntrepriseSite[]>([
    {
      id: 'cmd-e1-01',
      codeCommande: 'CMD-TOT-701',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-9842',
      employeNom: 'Babacar Ndiaye',
      categorie: 'PLAT',
      platNom: 'Poulet Yassa Braisé Kiki & Riz Parfumé',
      date: '2026-11-12',
      heure: '11:45',
      montantTotal: 5000,
      partEntreprise: 5000,
      partEmploye: 0,
      statut: 'LIVRE',
      scanneAt: '12:05',
      livreAt: '12:08'
    },
    {
      id: 'cmd-e1-02',
      codeCommande: 'CMD-TOT-702',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-9843',
      employeNom: 'Fatou Fall',
      categorie: 'PLAT',
      platNom: 'Capitaine Braisé & Riz Jasmin',
      date: '2026-11-12',
      heure: '11:50',
      montantTotal: 5000,
      partEntreprise: 5000,
      partEmploye: 0,
      statut: 'LIVRE',
      scanneAt: '12:12',
      livreAt: '12:14'
    },
    {
      id: 'cmd-e1-03',
      codeCommande: 'CMD-TOT-703',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-9844',
      employeNom: 'Mamadou Diallo',
      categorie: 'PLAT',
      platNom: 'Poulet Yassa Braisé Kiki & Riz Parfumé',
      date: '2026-11-12',
      heure: '12:02',
      montantTotal: 5000,
      partEntreprise: 3500,
      partEmploye: 1500,
      statut: 'SCANNE',
      scanneAt: '12:20'
    },
    {
      id: 'cmd-e1-04',
      codeCommande: 'CMD-TOT-704',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-9845',
      employeNom: 'Aminata Sow',
      categorie: 'PLAT',
      platNom: 'Capitaine Braisé & Riz Jasmin',
      date: '2026-11-12',
      heure: '12:10',
      montantTotal: 5000,
      partEntreprise: 2500,
      partEmploye: 2500,
      statut: 'SCANNE',
      scanneAt: '12:22'
    },
    {
      id: 'cmd-e1-05',
      codeCommande: 'CMD-TOT-705',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-9847',
      employeNom: 'Khady Sarr',
      categorie: 'PLAT',
      platNom: 'Poulet Yassa Braisé Kiki & Riz Parfumé',
      date: '2026-11-12',
      heure: '12:15',
      montantTotal: 5000,
      partEntreprise: 5000,
      partEmploye: 0,
      statut: 'EN_COURS'
    },
    {
      id: 'cmd-e1-06',
      codeCommande: 'CMD-TOT-706',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-EXT-01',
      employeNom: 'Ousmane Ba (Consultant)',
      categorie: 'PLAT',
      platNom: 'Capitaine Braisé & Riz Jasmin',
      date: '2026-11-12',
      heure: '12:18',
      montantTotal: 5000,
      partEntreprise: 0,
      partEmploye: 5000,
      statut: 'EN_COURS'
    },
    {
      id: 'cmd-e1-07',
      codeCommande: 'CMD-TOT-690',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-9842',
      employeNom: 'Babacar Ndiaye',
      categorie: 'PLAT',
      platNom: 'Thiéboudienne Penda Mbaye Royal',
      date: '2026-11-11',
      heure: '12:00',
      montantTotal: 5000,
      partEntreprise: 5000,
      partEmploye: 0,
      statut: 'LIVRE',
      scanneAt: '12:15',
      livreAt: '12:18'
    },
    {
      id: 'cmd-e1-08',
      codeCommande: 'CMD-TOT-691',
      entrepriseId: 'ent-001',
      entrepriseNom: 'TotalEnergies — Siège Plateau',
      matricule: 'TOT-9843',
      employeNom: 'Fatou Fall',
      categorie: 'PLAT',
      platNom: 'Poulet Yassa Braisé Kiki',
      date: '2026-11-11',
      heure: '12:05',
      montantTotal: 5000,
      partEntreprise: 5000,
      partEmploye: 0,
      statut: 'LIVRE',
      scanneAt: '12:20',
      livreAt: '12:22'
    }
  ]);

  // Lignes de facturation journalières pour l'entreprise
  lignesFacturationEntreprise = signal<FacturationLigneJournaliere[]>([
    {
      date: '2026-11-12',
      dateAffichee: 'Jeudi 12 novembre 2026',
      nbPlatsLivres: 48,
      nbPresents: 52,
      montantTotal: 240000,
      montantPartEntreprise: 216000,
      montantPartEmploye: 24000,
      statut: 'EN_COURS'
    },
    {
      date: '2026-11-11',
      dateAffichee: 'Mercredi 11 novembre 2026',
      nbPlatsLivres: 50,
      nbPresents: 54,
      montantTotal: 250000,
      montantPartEntreprise: 228000,
      montantPartEmploye: 22000,
      statut: 'VALIDE'
    },
    {
      date: '2026-11-10',
      dateAffichee: 'Mardi 10 novembre 2026',
      nbPlatsLivres: 53,
      nbPresents: 55,
      montantTotal: 265000,
      montantPartEntreprise: 242000,
      montantPartEmploye: 23000,
      statut: 'VALIDE'
    },
    {
      date: '2026-11-09',
      dateAffichee: 'Lundi 09 novembre 2026',
      nbPlatsLivres: 49,
      nbPresents: 51,
      montantTotal: 245000,
      montantPartEntreprise: 221000,
      montantPartEmploye: 24000,
      statut: 'VALIDE'
    },
    {
      date: '2026-11-06',
      dateAffichee: 'Vendredi 06 novembre 2026',
      nbPlatsLivres: 58,
      nbPresents: 60,
      montantTotal: 290000,
      montantPartEntreprise: 265000,
      montantPartEmploye: 25000,
      statut: 'FACTURE'
    },
    {
      date: '2026-11-05',
      dateAffichee: 'Jeudi 05 novembre 2026',
      nbPlatsLivres: 51,
      nbPresents: 53,
      montantTotal: 255000,
      montantPartEntreprise: 232000,
      montantPartEmploye: 23000,
      statut: 'FACTURE'
    },
    {
      date: '2026-11-04',
      dateAffichee: 'Mercredi 04 novembre 2026',
      nbPlatsLivres: 52,
      nbPresents: 55,
      montantTotal: 260000,
      montantPartEntreprise: 236000,
      montantPartEmploye: 24000,
      statut: 'FACTURE'
    }
  ]);

  // Méthode pour ajouter un employé
  ajouterEmploye(emp: Partial<EmployeB2B>) {
    const site = this.currentEntreprise().sites.find(s => s.id === emp.siteId);
    const nouvelEmploye: EmployeB2B = {
      id: 'emp-' + Date.now(),
      matricule: emp.matricule || 'TOT-' + Math.floor(1000 + Math.random() * 9000),
      nom: emp.nom || 'Nouveau',
      prenom: emp.prenom || 'Employé',
      email: emp.email || '',
      telephone: emp.telephone || '',
      siteId: emp.siteId || 'site-1',
      siteNom: site ? site.nom : (emp.siteNom || 'Siège Plateau'),
      departement: emp.departement || 'Général',
      type: emp.type || (emp.tauxSubvention === 0 ? 'AUTONOME' : 'SUBVENTIONNE'),
      tauxSubvention: emp.tauxSubvention !== undefined ? emp.tauxSubvention : 100,
      actif: emp.actif !== undefined ? emp.actif : true,
      repasConsommesMois: emp.repasConsommesMois || 0,
      montantPrisEnChargeMois: emp.montantPrisEnChargeMois || 0
    };
    this.listeEmployes.update(list => [nouvelEmploye, ...list]);
  }

  // Méthode pour créer une invitation administrateur
  creerInvitationAdmin(email: string, nomComplet: string, role: 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI', entreprise: EntrepriseB2B): InvitationAdminB2B {
    const roleLibelle = role === 'RESPONSABLE_ENTREPRISE' ? 'Admin Entreprise (RH)' : 'Responsable de Site Kiki';
    const prefix = role === 'RESPONSABLE_ENTREPRISE' ? 'RH' : 'KIKI';
    const token = `ACT-${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const dateEnvoi = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const invitation: InvitationAdminB2B = {
      id: 'inv-' + Date.now(),
      email,
      nomComplet,
      role,
      roleLibelle,
      entrepriseId: entreprise.id,
      entrepriseNom: entreprise.nom,
      dateEnvoi,
      tokenActivation: token,
      statut: 'EN_ATTENTE'
    };

    this.listeInvitationsAdmins.update(list => [invitation, ...list]);
    return invitation;
  }

  // Scanner une commande (QR code cantine)
  scannerCommandeSite(cmdId: string) {
    const now = new Date();
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.listeCommandesSite.update(list => list.map(c => {
      if (c.id === cmdId) {
        return { ...c, statut: 'SCANNE' as StatutCommandeSite, scanneAt: heure };
      }
      return c;
    }));
  }

  // Marquer une commande comme livrée
  marquerCommandeLivree(cmdId: string) {
    const now = new Date();
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.listeCommandesSite.update(list => list.map(c => {
      if (c.id === cmdId) {
        return { ...c, statut: 'LIVRE' as StatutCommandeSite, livreAt: heure };
      }
      return c;
    }));
  }

  // Mettre à jour la quantité d'un plat dans un jour planifié
  updateQuantitePlatMenu(menuJourId: string, ligneId: string, quantite: number, subventionnesCount: number) {
    this.menusPlanifiesEntreprises.update(list => list.map(m => {
      if (m.id === menuJourId) {
        const newLignes = m.lignes.map(l => l.id === ligneId ? { ...l, quantitePrevue: Math.max(0, quantite) } : l);
        // Calcul conformité par catégorie : pour chaque catégorie présente, la somme des quantités doit être >= subventionnesCount
        const categories = Array.from(new Set(newLignes.map(l => l.categorie)));
        let isConforme = true;
        let aDesQuantites = false;
        for (const cat of categories) {
          const sommeCat = newLignes.filter(l => l.categorie === cat).reduce((s, l) => s + (l.quantitePrevue || 0), 0);
          if (sommeCat > 0) aDesQuantites = true;
          if (sommeCat < subventionnesCount) {
            isConforme = false;
          }
        }
        return {
          ...m,
          lignes: newLignes,
          quantitesSaisies: aDesQuantites,
          statutConformite: (!aDesQuantites) ? 'NON_SAISI' : (isConforme ? 'CONFORME' : 'NON_CONFORME')
        };
      }
      return m;
    }));
  }

  // Dupliquer un jour de menu vers un autre jour
  dupliquerMenuJour(sourceJourId: string, cibleJourNom: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche', entrepriseId: string) {
    const source = this.menusPlanifiesEntreprises().find(m => m.id === sourceJourId);
    if (!source) return;

    this.menusPlanifiesEntreprises.update(list => list.map(m => {
      if (m.entrepriseId === entrepriseId && m.jourNom === cibleJourNom) {
        return {
          ...m,
          theme: source.theme ? `${source.theme} (Copié)` : m.theme,
          lignes: source.lignes.map(l => ({ ...l, id: 'l-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4) })),
          quantitesSaisies: source.quantitesSaisies,
          statutConformite: source.statutConformite
        };
      }
      return m;
    }));
  }

  // PROGRAMMATION GLOBALE & DÉPLOIEMENT VERS TOUTES LES ENTREPRISES
  // Déploie le programme global préparé par le Super Admin vers les sites/entreprises
  // en adaptant automatiquement selon les catégories autorisées de chaque entreprise.
  deployerProgrammationGlobaleVersEntreprises() {
    const programmeGlobal = this.menusPlanifiesEntreprises().filter(m => m.entrepriseId === 'ent-001' || m.entrepriseId === 'GLOBAL');
    const entreprises = this.listeEntreprises();

    this.menusPlanifiesEntreprises.update(listeActuelle => {
      let nouvelleListe = [...listeActuelle];

      entreprises.forEach(ent => {
        const categoriesAutorisees = ent.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];

        ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].forEach(jour => {
          const modeleJour = programmeGlobal.find(p => p.jourNom === jour);
          if (!modeleJour) return;

          // Filtrer les lignes selon les catégories autorisées du contrat de l'entreprise
          const lignesFiltrees = modeleJour.lignes
            .filter(l => categoriesAutorisees.includes(l.categorie))
            .map(l => ({
              ...l,
              id: 'l-' + ent.id + '-' + jour + '-' + l.platId,
              quantitePrevue: 0 // Au gestionnaire de site de renseigner ses quantités !
            }));

          const existantIdx = nouvelleListe.findIndex(m => m.entrepriseId === ent.id && m.jourNom === jour);
          const menuDeploye: MenuPlanifieJourEntreprise = {
            id: `plan-${ent.id}-${jour.toLowerCase().slice(0, 3)}`,
            entrepriseId: ent.id,
            jourNom: jour as any,
            dateStr: modeleJour.dateStr,
            theme: modeleJour.theme,
            lignes: lignesFiltrees,
            quantitesSaisies: false,
            statutConformite: 'NON_SAISI'
          };

          if (existantIdx >= 0) {
            // Conserver si déjà des quantités ou écraser avec le nouveau programme
            nouvelleListe[existantIdx] = menuDeploye;
          } else {
            nouvelleListe.push(menuDeploye);
          }
        });
      });

      return nouvelleListe;
    });
  }

  // Annuaire des employés RH de l'entreprise
  listeEmployes = signal<EmployeB2B[]>([
    { id: 'emp-101', matricule: 'TOT-9842', nom: 'Ndiaye', prenom: 'Babacar', email: 'b.ndiaye@totalenergies.sn', telephone: '+221 77 123 45 67', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Finance & Comptabilité', type: 'SUBVENTIONNE', tauxSubvention: 100, actif: true, repasConsommesMois: 19, montantPrisEnChargeMois: 95000 },
    { id: 'emp-102', matricule: 'TOT-9843', nom: 'Fall', prenom: 'Fatou', email: 'f.fall@totalenergies.sn', telephone: '+221 78 456 78 90', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Ressources Humaines', type: 'SUBVENTIONNE', tauxSubvention: 100, actif: true, repasConsommesMois: 21, montantPrisEnChargeMois: 105000 },
    { id: 'emp-103', matricule: 'TOT-9844', nom: 'Diallo', prenom: 'Mamadou', email: 'm.diallo@totalenergies.sn', telephone: '+221 76 567 89 01', siteId: 'site-2', siteNom: 'Dépôt Bel-Air', departement: 'Opérations Maritimes', type: 'SUBVENTIONNE', tauxSubvention: 70, actif: true, repasConsommesMois: 22, montantPrisEnChargeMois: 77000 },
    { id: 'emp-104', matricule: 'TOT-9845', nom: 'Sow', prenom: 'Aminata', email: 'a.sow@totalenergies.sn', telephone: '+221 77 678 90 12', siteId: 'site-2', siteNom: 'Dépôt Bel-Air', departement: 'Maintenance & Sécurité', type: 'SUBVENTIONNE', tauxSubvention: 50, actif: true, repasConsommesMois: 17, montantPrisEnChargeMois: 42500 },
    { id: 'emp-105', matricule: 'TOT-9846', nom: 'Diop', prenom: 'Cheikh', email: 'c.diop@totalenergies.sn', telephone: '+221 78 789 01 23', siteId: 'site-3', siteNom: 'Plateforme Diamniadio', departement: 'Logistique & Transit', type: 'SUBVENTIONNE', tauxSubvention: 100, actif: true, repasConsommesMois: 20, montantPrisEnChargeMois: 100000 },
    { id: 'emp-106', matricule: 'TOT-EXT-01', nom: 'Ba', prenom: 'Ousmane (Consultant)', email: 'o.ba@consultant.sn', telephone: '+221 76 890 12 34', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Direction Projet IT', type: 'AUTONOME', tauxSubvention: 0, actif: true, repasConsommesMois: 14, montantPrisEnChargeMois: 0 },
    { id: 'emp-107', matricule: 'TOT-9847', nom: 'Sarr', prenom: 'Khady', email: 'k.sarr@totalenergies.sn', telephone: '+221 77 901 23 45', siteId: 'site-1', siteNom: 'Siège Plateau', departement: 'Juridique & Conformité', type: 'SUBVENTIONNE', tauxSubvention: 100, actif: true, repasConsommesMois: 18, montantPrisEnChargeMois: 90000 }
  ]);

  // Historique unifié des commandes individuelles pour rapprochement RH par site et par date
  historiqueCommandes = signal<CommandeHistoriqueB2B[]>([
    { id: 'CMD-101', date: '2026-11-06', heure: '10:14', matricule: 'TOT-9842', employeNom: 'Babacar Ndiaye', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-102', date: '2026-11-06', heure: '10:22', matricule: 'TOT-9843', employeNom: 'Fatou Fall', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Capitaine Braisé & Riz Jasmin', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-103', date: '2026-11-06', heure: '09:35', matricule: 'TOT-9844', employeNom: 'Mamadou Diallo', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Thiéboudienne Penda Mbaye', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-104', date: '2026-11-06', heure: '09:40', matricule: 'TOT-9845', employeNom: 'Aminata Sow', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Pavé de Bœuf aux Herbes', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-105', date: '2026-11-06', heure: '09:55', matricule: 'TOT-9846', employeNom: 'Cheikh Diop', siteId: 'site-3', siteNom: 'Plateforme Diamniadio', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-106', date: '2026-11-05', heure: '10:12', matricule: 'TOT-9847', employeNom: 'Khady Sarr', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Capitaine Braisé & Riz Jasmin', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-107', date: '2026-11-05', heure: '10:28', matricule: 'TOT-9842', employeNom: 'Babacar Ndiaye', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Pavé de Bœuf aux Herbes', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-108', date: '2026-11-05', heure: '09:30', matricule: 'TOT-9844', employeNom: 'Mamadou Diallo', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-109', date: '2026-11-04', heure: '10:15', matricule: 'TOT-9843', employeNom: 'Fatou Fall', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Thiéboudienne Penda Mbaye', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-110', date: '2026-11-04', heure: '09:42', matricule: 'TOT-9846', employeNom: 'Cheikh Diop', siteId: 'site-3', siteNom: 'Plateforme Diamniadio', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Capitaine Braisé & Riz Jasmin', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-111', date: '2026-10-30', heure: '10:20', matricule: 'TOT-9842', employeNom: 'Babacar Ndiaye', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Poulet Yassa Braisé Kiki', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' },
    { id: 'CMD-112', date: '2026-10-30', heure: '09:38', matricule: 'TOT-9845', employeNom: 'Aminata Sow', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', formuleNom: 'Formule Déjeuner 4 comp.', platNom: 'Pavé de Bœuf aux Herbes', prixTotal: 5000, partEntreprise: 5000, partEmploye: 0, statut: 'LIVRE' }
  ]);

  // Formule repas active
  formuleActuelle = signal<FormuleRegle>({
    id: 'formule-midi-complete',
    nom: 'Formule Déjeuner Équilibré B2B',
    description: '1 Entrée fraîche + 1 Plat Chaud du Chef + 1 Dessert + 1 Boisson rafraîchissante',
    prixForfait: 5000,
    quotas: {
      ENTREE: 1,
      PLAT: 1,
      DESSERT: 1,
      BOISSON: 1
    }
  });

  // Date de commande
  dateCommande = signal<Date>(new Date());

  // Catalogue du jour (avec drapeau disponible modifiable par le Responsable Site Kiki)
  catalogueJour = signal<PlatB2B[]>([
    { id: 'e1', nom: 'Salade Niçoise au Thon Frais', description: 'Haricots verts, œufs durs, tomates, vinaigrette maison', categorie: 'ENTREE', prixUnitaire: 1200, image: '/assets/images/plats/e1.jpg', calories: 240, disponible: true },
    { id: 'e2', nom: 'Pastels Dorés au Thon (x3)', description: 'Beignets croustillants servis avec sauce tomate piment doux', categorie: 'ENTREE', prixUnitaire: 1200, image: '/assets/images/plats/e2.jpg', calories: 310, disponible: true },
    { id: 'e3', nom: 'Velouté de Légumes & Croûtons d\'Ail', description: 'Courgettes, carottes, pointe de crème fraîche', categorie: 'ENTREE', prixUnitaire: 1200, image: '/assets/images/plats/e3.jpg', calories: 180, disponible: true },
    { id: 'p1', nom: 'Poulet Yassa Braisé Kiki & Riz Parfumé', description: 'Cuisse de poulet fermier marinée aux oignons caramélisés, citron vert et moutarde, riz parfumé', categorie: 'PLAT', prixUnitaire: 2800, image: '/assets/images/plats/p1.jpg', calories: 650, disponible: true },
    { id: 'p2', nom: 'Capitaine Braisé & Riz Parfumé au Jasmin', description: 'Filet de poisson frais braisé au feu de bois, sauce moutarde oignon & piment', categorie: 'PLAT', prixUnitaire: 3200, image: '/assets/images/plats/p2.jpg', calories: 580, disponible: true },
    { id: 'p3', nom: 'Plat Équilibré : Pavé de Bœuf aux Herbes & Légumes Vapeur', description: 'Bœuf tendre du boucher, purée de patates douces et haricots persillés', categorie: 'PLAT', prixUnitaire: 3000, image: '/assets/images/plats/p3.jpg', calories: 520, disponible: true },
    { id: 'p4', nom: 'Thiéboudienne Penda Mbaye Royal (Riz Rouge)', description: 'Riz rouge traditionnel sénégalais mijoté aux légumes du terroir et poisson noble', categorie: 'PLAT', prixUnitaire: 2600, image: '/assets/images/plats/p4.jpg', calories: 610, disponible: true },
    { id: 'd1', nom: 'Coupe de Fruits Exotiques Frais', description: 'Mangue kent, ananas pain de sucre, papaye arrosée de citron vert', categorie: 'DESSERT', prixUnitaire: 800, image: '/assets/images/plats/d1.jpg', calories: 120, disponible: true },
    { id: 'd2', nom: 'Fondant au Chocolat Noir Intense & Cœur Coulant', description: 'Cacao noir pur d\'Afrique, crème anglaise vanillée', categorie: 'DESSERT', prixUnitaire: 1000, image: '/assets/images/plats/d2.jpg', calories: 340, disponible: true },
    { id: 'd3', nom: 'Yaourt Onctueux Fait Maison au Miel', description: 'Lait entier local et miel de fleurs de savane', categorie: 'DESSERT', prixUnitaire: 800, image: '/assets/images/plats/d3.jpg', calories: 160, disponible: true },
    { id: 'b1', nom: 'Jus Naturel de Bissap Frais Menthe', description: 'Infusion de fleurs d\'hibiscus, menthe sauvage, sans conservateur', categorie: 'BOISSON', prixUnitaire: 600, image: '/assets/images/plats/b1.jpg', calories: 90, disponible: true },
    { id: 'b2', nom: 'Jus de Bouye Artisanal (Pain de Singe)', description: 'Pulpe naturelle de fruit de baobab onctueuse et vanillée', categorie: 'BOISSON', prixUnitaire: 600, image: '/assets/images/plats/b2.jpg', calories: 110, disponible: true },
    { id: 'b3', nom: 'Eau Minérale Naturelle Kirène (50cl)', description: 'Bouteille individuelle capsule scellée', categorie: 'BOISSON', prixUnitaire: 400, image: '/assets/images/plats/b3.jpg', calories: 0, disponible: true }
  ]);

  // Méthode pour activer / désactiver la proposition d'un plat sur le site
  toggleDisponibilitePlat(platId: string) {
    this.catalogueJour.update(list => list.map(p => {
      if (p.id === platId) {
        return { ...p, disponible: p.disponible !== false ? false : true };
      }
      return p;
    }));
  }

  // Panier
  selection = signal<SelectionRepas>({
    entree: undefined,
    plat: undefined,
    dessert: undefined,
    boisson: undefined,
    supplements: []
  });

  creneauLivraison = signal<string>('12h00 - 12h30');

  // CALCULS COMPUTÉS
  siteActuel = computed(() => {
    const id = this.selectedSiteId();
    return this.currentEntreprise().sites.find(s => s.id === id) || this.currentEntreprise().sites[0];
  });

  creneauxSiteActuel = computed(() => {
    const site = this.siteActuel();
    if (site && site.creneauxDisponibles && site.creneauxDisponibles.length > 0) {
      return site.creneauxDisponibles;
    }
    return [
      '11h30 - 12h00 (Service Anticipé)',
      '12h00 - 12h30 (Premier Service)',
      '12h30 - 13h00 (Deuxième Service)',
      '13h00 - 13h30 (Troisième Service)',
      '13h30 - 14h00 (Service Tardif)',
      '14h00 - 14h30 (Dernier Service)',
      '19h00 - 20h00 (Dîner Équipe de Nuit)'
    ];
  });

  isFormuleComplete = computed(() => {
    const s = this.selection();
    return !!(s.entree && s.plat && s.dessert && s.boisson);
  });

  totalSupplements = computed(() => {
    return this.selection().supplements.reduce((sum, item) => sum + item.prixUnitaire, 0);
  });

  totalCommandeBrut = computed(() => {
    return this.formuleActuelle().prixForfait + this.totalSupplements();
  });

  partPriseEnChargeEntreprise = computed(() => {
    const emp = this.currentEmploye();
    if (emp.type === 'AUTONOME') return 0;
    // Taux spécifique au salarié s'il est défini, sinon taux par défaut entreprise (ou 100%)
    const taux = emp.tauxSubvention !== undefined ? emp.tauxSubvention : (this.currentEntreprise().tauxPriseEnCharge ?? 100);
    return Math.round((this.formuleActuelle().prixForfait * taux) / 100);
  });

  resteAPayerEmploye = computed(() => {
    const brut = this.totalCommandeBrut();
    const subvention = this.partPriseEnChargeEntreprise();
    return Math.max(0, brut - subvention);
  });

  // COMPUTEDS PANIER AUTONOME (Frais personnels)
  totalPanierAutonome = computed(() => {
    return this.panierAutonome().reduce((sum, item) => sum + (item.plat.prixUnitaire * item.quantite), 0);
  });

  nbArticlesPanierAutonome = computed(() => {
    return this.panierAutonome().reduce((sum, item) => sum + item.quantite, 0);
  });

  // STATS DASHBOARD RH
  historiqueFacturationMois = signal([
    { id: 'sem-1', date: 'Semaine 44 (01 - 07 Nov)', siteNom: 'Siège Plateau - Dakar', nbRepasSubventionnes: 60, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 300000 },
    { id: 'sem-2', date: 'Semaine 44 (01 - 07 Nov)', siteNom: 'Dépôt Bel-Air / Port', nbRepasSubventionnes: 45, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 225000 },
    { id: 'sem-3', date: 'Semaine 44 (01 - 07 Nov)', siteNom: 'Plateforme Diamniadio', nbRepasSubventionnes: 30, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 150000 },
    { id: 'sem-4', date: 'Semaine 45 (08 - 14 Nov)', siteNom: 'Siège Plateau - Dakar', nbRepasSubventionnes: 75, prixUnitaire: 5000, tauxSubvention: 100, partEntreprise: 375000 }
  ]);

  totalRepasMois = computed(() => {
    return this.historiqueCommandes().length * 15 + 180;
  });

  totalFactureMois = computed(() => {
    return this.totalRepasMois() * 5000;
  });

  tauxUtilisationBudget = computed(() => {
    const budget = this.currentEntreprise().budgetMensuelAlloue;
    if (!budget) return 0;
    return Math.round((this.totalFactureMois() / budget) * 100);
  });

  // ACTIONS RH
  ajouterNouvelEmploye(nouvelEmp: Partial<EmployeB2B>) {
    const site = this.currentEntreprise().sites.find(s => s.id === nouvelEmp.siteId);
    const emp: EmployeB2B = {
      id: 'emp-' + Date.now(),
      matricule: nouvelEmp.matricule || 'TOT-' + Math.floor(1000 + Math.random() * 9000),
      nom: nouvelEmp.nom || 'Nouveau',
      prenom: nouvelEmp.prenom || 'Employé',
      email: nouvelEmp.email || '',
      telephone: nouvelEmp.telephone || '',
      siteId: nouvelEmp.siteId || 'site-1',
      siteNom: site ? site.nom : 'Siège Plateau',
      departement: nouvelEmp.departement || 'Général',
      type: nouvelEmp.type || 'SUBVENTIONNE',
      tauxSubvention: nouvelEmp.tauxSubvention !== undefined ? nouvelEmp.tauxSubvention : 100,
      actif: true,
      repasConsommesMois: 0,
      montantPrisEnChargeMois: 0
    };
    this.listeEmployes.update(list => [emp, ...list]);
  }

  toggleStatutEmploye(empId: string) {
    this.listeEmployes.update(list => list.map(emp => {
      if (emp.id === empId) {
        return { ...emp, actif: !emp.actif };
      }
      return emp;
    }));
  }

  // ACTIONS EMPLOYÉ
  selectSite(siteId: string) {
    this.selectedSiteId.set(siteId);
  }

  choisirPlat(plat: PlatB2B) {
    const sel = { ...this.selection() };
    switch (plat.categorie) {
      case 'ENTREE': sel.entree = plat; break;
      case 'PLAT': sel.plat = plat; break;
      case 'DESSERT': sel.dessert = plat; break;
      case 'BOISSON': sel.boisson = plat; break;
    }
    this.selection.set(sel);
  }

  retirerPlat(plat: PlatB2B) {
    const sel = { ...this.selection() };
    switch (plat.categorie) {
      case 'ENTREE': if (sel.entree?.id === plat.id) sel.entree = undefined; break;
      case 'PLAT': if (sel.plat?.id === plat.id) sel.plat = undefined; break;
      case 'DESSERT': if (sel.dessert?.id === plat.id) sel.dessert = undefined; break;
      case 'BOISSON': if (sel.boisson?.id === plat.id) sel.boisson = undefined; break;
    }
    this.selection.set(sel);
  }

  toggleSupplement(plat: PlatB2B) {
    const sel = { ...this.selection() };
    const index = sel.supplements.findIndex(p => p.id === plat.id);
    if (index >= 0) {
      sel.supplements = sel.supplements.filter(p => p.id !== plat.id);
    } else {
      sel.supplements = [...sel.supplements, plat];
    }
    this.selection.set(sel);
  }

  isSupplementSelected(platId: string): boolean {
    return this.selection().supplements.some(p => p.id === platId);
  }

  changerTypeEmploye(type: 'SUBVENTIONNE' | 'AUTONOME') {
    const emp = { ...this.currentEmploye(), type };
    this.currentEmploye.set(emp);
  }

  reinitialiserSelection() {
    this.selection.set({
      entree: undefined,
      plat: undefined,
      dessert: undefined,
      boisson: undefined,
      supplements: []
    });
  }

  // Mutation de la session de rôle actif
  setSessionRole(session: UserSessionB2B) {
    this.currentSession.set(session);
    if (session.role === 'SALARIE_CONVENTIONNE') {
      this.setModeProfil('SUBVENTIONNE');
    } else if (session.role === 'SALARIE_AUTONOME') {
      this.setModeProfil('AUTONOME');
    }
  }

  // ACTIONS PANIER AUTONOME (Employé non pris en charge / Wave direct)
  setModeProfil(mode: 'SUBVENTIONNE' | 'AUTONOME') {
    this.modeProfil.set(mode);
    if (mode === 'AUTONOME') {
      const consultant = this.listeEmployes().find(e => e.id === 'emp-106') || {
        id: 'emp-106',
        matricule: 'TOT-EXT-01',
        nom: 'Ba',
        prenom: 'Ousmane (Consultant)',
        email: 'o.ba@consultant.sn',
        telephone: '+221 76 890 12 34',
        siteId: 'site-1',
        siteNom: 'Siège Plateau',
        departement: 'Direction Projet IT',
        type: 'AUTONOME' as const,
        tauxSubvention: 0,
        actif: true,
        repasConsommesMois: 14,
        montantPrisEnChargeMois: 0
      };
      this.currentEmploye.set(consultant);
    } else {
      const subventionne = this.listeEmployes().find(e => e.id === 'emp-101') || {
        id: 'emp-101',
        matricule: 'TOT-9842',
        nom: 'Ndiaye',
        prenom: 'Babacar',
        email: 'b.ndiaye@totalenergies.sn',
        telephone: '+221 77 123 45 67',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        departement: 'Finance & Comptabilité',
        type: 'SUBVENTIONNE' as const,
        tauxSubvention: 100,
        actif: true,
        repasConsommesMois: 19,
        montantPrisEnChargeMois: 95000
      };
      this.currentEmploye.set(subventionne);
    }
  }

  // Mettre à jour le taux de subvention d'un collaborateur
  setTauxSubventionEmploye(empId: string, nouveauTaux: number) {
    this.listeEmployes.update(list => list.map(emp => {
      if (emp.id === empId) {
        const type = nouveauTaux === 0 ? 'AUTONOME' : 'SUBVENTIONNE';
        return { ...emp, tauxSubvention: nouveauTaux, type };
      }
      return emp;
    }));
    // Si c'est l'employé actif, on met à jour le signal courant
    if (this.currentEmploye().id === empId) {
      this.currentEmploye.update(emp => ({
        ...emp,
        tauxSubvention: nouveauTaux,
        type: nouveauTaux === 0 ? 'AUTONOME' : 'SUBVENTIONNE'
      }));
    }
  }

  ajouterAuPanierAutonome(plat: PlatB2B) {
    this.panierAutonome.update(items => {
      const existing = items.find(i => i.plat.id === plat.id);
      if (existing) {
        return items.map(i => i.plat.id === plat.id ? { ...i, quantite: i.quantite + 1 } : i);
      }
      return [...items, { plat, quantite: 1 }];
    });
  }

  retirerDuPanierAutonome(platId: string) {
    this.panierAutonome.update(items => {
      const existing = items.find(i => i.plat.id === platId);
      if (!existing) return items;
      if (existing.quantite > 1) {
        return items.map(i => i.plat.id === platId ? { ...i, quantite: i.quantite - 1 } : i);
      }
      return items.filter(i => i.plat.id !== platId);
    });
  }

  supprimerDuPanierAutonome(platId: string) {
    this.panierAutonome.update(items => items.filter(i => i.plat.id !== platId));
  }

  quantitePlatAutonome(platId: string): number {
    const item = this.panierAutonome().find(i => i.plat.id === platId);
    return item ? item.quantite : 0;
  }

  viderPanierAutonome() {
    this.panierAutonome.set([]);
  }
}
