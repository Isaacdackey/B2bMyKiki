import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bNavComponent } from '../shared/b2b-nav.component';
import { B2bStateService } from '../shared/b2b-state.service';
import { EntrepriseB2B, SiteB2B, PlatB2B, TypePrestationB2B, CategoriePlatB2B, PlanningMenuSiteB2B } from '../shared/b2b.models';

@Component({
  selector: 'app-b2b-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bNavComponent],
  templateUrl: './b2b-super-admin.component.html',
  styleUrls: ['./b2b-super-admin.component.css']
})
export class B2bSuperAdminComponent {
  b2b = inject(B2bStateService);

  get activeSection() {
    return this.b2b.superAdminActiveSection;
  }

  // Filtres Entreprises & Pagination
  searchEntreprise = signal<string>('');
  filtreArchiveEntreprise = signal<'TOUTES' | 'ACTIVES' | 'ARCHIVEES'>('ACTIVES');
  pageEntreprises = signal<number>(1);
  pageSizeEntreprises = signal<number>(3);

  // Filtre Date du Tableau de Bord (style inspiré de la capture)
  dateDebutDashboard = signal<string>('2026-11-12');
  dateFinDashboard = signal<string>('2026-11-12');
  dateAfficheeDashboard = 'jeudi 12 novembre 2026';

  nbEntreprisesActives = computed(() => {
    return this.b2b.listeEntreprises().filter(e => !e.isArchivee).length;
  });

  nbEntreprisesArchivees = computed(() => {
    return this.b2b.listeEntreprises().filter(e => !!e.isArchivee).length;
  });

  entreprisesFiltrees = computed(() => {
    const q = this.searchEntreprise().toLowerCase().trim();
    const filtre = this.filtreArchiveEntreprise();

    return this.b2b.listeEntreprises().filter(ent => {
      const matchQ = !q || ent.nom.toLowerCase().includes(q) || ent.codeEntreprise.toLowerCase().includes(q);
      const matchArchive = filtre === 'TOUTES' ? true : filtre === 'ACTIVES' ? !ent.isArchivee : ent.isArchivee;
      return matchQ && matchArchive;
    });
  });

  totalPagesEntreprises = computed(() => {
    return Math.max(1, Math.ceil(this.entreprisesFiltrees().length / this.pageSizeEntreprises()));
  });

  entreprisesPaginees = computed(() => {
    const list = this.entreprisesFiltrees();
    const size = this.pageSizeEntreprises();
    const page = Math.min(this.pageEntreprises(), Math.max(1, Math.ceil(list.length / size)));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  pagesEntreprisesArray = computed(() => {
    return Array.from({ length: this.totalPagesEntreprises() }, (_, i) => i + 1);
  });

  changerPageEntreprises(page: number) {
    if (page >= 1 && page <= this.totalPagesEntreprises()) {
      this.pageEntreprises.set(page);
    }
  }

  // Types de prestation disponibles
  typesPrestationDisponibles: { code: TypePrestationB2B; libelle: string; desc: string; categoriesDefaut: CategoriePlatB2B[] }[] = [
    { code: 'COMPLETE', libelle: 'Formule Complète (4 composantes)', desc: 'Entrée + Plat chaud + Dessert + Boisson', categoriesDefaut: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'] },
    { code: 'ENTREE_PLAT_DESSERT', libelle: 'Entrée + Plat + Dessert', desc: 'Sans boisson incluse', categoriesDefaut: ['ENTREE', 'PLAT', 'DESSERT'] },
    { code: 'PLAT_DESSERT_BOISSON', libelle: 'Plat + Dessert + Boisson', desc: 'Sans entrée', categoriesDefaut: ['PLAT', 'DESSERT', 'BOISSON'] },
    { code: 'ENTREE_PLAT', libelle: 'Entrée + Plat chaud', desc: 'Déjeuner express 2 composantes', categoriesDefaut: ['ENTREE', 'PLAT'] },
    { code: 'PLAT_DESSERT', libelle: 'Plat + Dessert', desc: 'Formule gourmande 2 composantes', categoriesDefaut: ['PLAT', 'DESSERT'] },
    { code: 'PLAT_BOISSON', libelle: 'Plat + Boisson', desc: 'Formule équilibrée la plus populaire', categoriesDefaut: ['PLAT', 'BOISSON'] },
    { code: 'PLAT_SEUL', libelle: 'Plat chaud Seul', desc: 'Plat de résistance uniquement', categoriesDefaut: ['PLAT'] },
    { code: 'BUFFET_SUR_MESURE', libelle: 'Buffet & Cocktail sur mesure', desc: 'Prestation événementielle ou convention spéciale', categoriesDefaut: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'] }
  ];

  // Modal Nouvelle Entreprise
  showModalEntreprise = signal<boolean>(false);
  entrepriseEnEdition = signal<Partial<EntrepriseB2B>>({
    nom: '',
    codeEntreprise: '',
    ninea: '',
    emailContact: '',
    telephone: '+221 ',
    tauxPriseEnCharge: 100,
    plafondJournalier: 5000,
    budgetMensuelAlloue: 10000000,
    tarifNegocieHtva: 4500,
    cadenceFacturation: 'MENSUELLE',
    typePrestation: 'COMPLETE',
    categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
  });
  isEditModeEntreprise = signal<boolean>(false);

  // Modal Nouveau Site
  showModalSite = signal<boolean>(false);
  entrepriseCibleSiteId = signal<string>('');
  siteEnEdition = signal<Partial<SiteB2B>>({
    nom: '',
    adresse: '',
    heureCutOff: '10:30',
    contactReferent: '',
    telephoneReferent: '+221 ',
    typePrestation: 'COMPLETE',
    categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
  });
  isEditModeSite = signal<boolean>(false);
  siteIdEnEdition = signal<string>('');

  // Modal Catalogue (Plat)
  showModalPlat = signal<boolean>(false);
  platEnEdition = signal<Partial<PlatB2B>>({
    nom: '',
    description: '',
    categorie: 'PLAT',
    prixUnitaire: 2800,
    image: '/assets/images/plats/p1.jpg',
    calories: 550
  });
  isEditModePlat = signal<boolean>(false);
  platIdEnEdition = signal<string>('');

  // Filtre Catalogue & Pagination
  filtreCategorieCatalogue = signal<'TOUS' | 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON'>('TOUS');
  filtreArchivePlat = signal<'TOUS' | 'ACTIFS' | 'ARCHIVES'>('ACTIFS');
  pageCatalogue = signal<number>(1);
  pageSizeCatalogue = signal<number>(6);

  platsFiltres = computed(() => {
    const cat = this.filtreCategorieCatalogue();
    const arch = this.filtreArchivePlat();

    return this.b2b.catalogueJour().filter(p => {
      const matchCat = cat === 'TOUS' || p.categorie === cat;
      const matchArch = arch === 'TOUS' ? true : arch === 'ACTIFS' ? !p.isArchive : p.isArchive;
      return matchCat && matchArch;
    });
  });

  totalPagesCatalogue = computed(() => {
    return Math.max(1, Math.ceil(this.platsFiltres().length / this.pageSizeCatalogue()));
  });

  platsPagines = computed(() => {
    const list = this.platsFiltres();
    const size = this.pageSizeCatalogue();
    const page = Math.min(this.pageCatalogue(), Math.max(1, Math.ceil(list.length / size)));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  pagesCatalogueArray = computed(() => {
    return Array.from({ length: this.totalPagesCatalogue() }, (_, i) => i + 1);
  });

  changerPageCatalogue(page: number) {
    if (page >= 1 && page <= this.totalPagesCatalogue()) {
      this.pageCatalogue.set(page);
    }
  }

  // Planning Multi-Sites Super Admin
  filtreSitePlanning = signal<string>('TOUS'); // 'TOUS' ou id spécifique (ex: 'site-1')

  tousLesSites = computed(() => {
    const list: { id: string; nom: string; entrepriseNom: string; codeEntreprise: string }[] = [];
    for (const ent of this.b2b.listeEntreprises()) {
      if (ent.sites && ent.sites.length > 0) {
        for (const s of ent.sites) {
          list.push({
            id: s.id,
            nom: s.nom,
            entrepriseNom: ent.nom,
            codeEntreprise: ent.codeEntreprise
          });
        }
      }
    }
    return list;
  });

  planningSemaineGlobal = signal<PlanningMenuSiteB2B[]>([
    // Menus Généraux / Tous les sites
    { id: 'sem-1', jour: 'Lundi', date: '03 Nov', cadence: 'HEBDO', theme: 'Tradition Sénégalaise', platVedette: 'Thiéboudienne Penda Mbaye', entreeProposee: 'Pastels au Poisson & Crevettes', dessertPropose: 'Thiagree Onctueux à la Vanille', boissonProposee: 'Bissap Frais Menthe', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 410, statut: 'CLOTURE' },
    { id: 'sem-2', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'Grillades & Fraîcheur Dakaroise', platVedette: 'Poulet Yassa Braisé au Feu de Bois', entreeProposee: 'Salade Niçoise au Thon Frais', dessertPropose: 'Salade de Fruits Exotiques', boissonProposee: 'Bouye & Pain de Singe', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 440, statut: 'EN_PRODUCTION' },
    { id: 'sem-3', jour: 'Mercredi', date: '05 Nov', cadence: 'HEBDO', theme: 'Saveurs de l\'Atlantique', platVedette: 'Filet de Mérou Sauce Tomate Épicée', entreeProposee: 'Accras de Morue Dakaroise', dessertPropose: 'Fondant Chocolat Intense', boissonProposee: 'Jus de Gingembre & Ananas', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 390, statut: 'VALIDE' },
    { id: 'sem-4', jour: 'Jeudi', date: '06 Nov', cadence: 'HEBDO', theme: 'Spécial Teranga & Rôtisserie', platVedette: 'Mafé de Bœuf Mijoté aux Légumes', entreeProposee: 'Velouté de Potiron & Coriandre', dessertPropose: 'Tartelette Mangue Caramélisée', boissonProposee: 'Cocktail Kiki Vitalité', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 430, statut: 'PROGRAMME' },
    { id: 'sem-5', jour: 'Vendredi', date: '07 Nov', cadence: 'HEBDO', theme: 'Street Food Gourmet Sénégalais', platVedette: 'Dibi d\'Agneau Kiki & Alloco', entreeProposee: 'Fatayas Croustillants à la Viande', dessertPropose: 'Crème Brûlée Vanille Bourbon', boissonProposee: 'Nectar de Corossol', siteId: 'TOUS', siteNom: 'Tous les sites (Menu Standard)', totalPrevu: 470, statut: 'PROGRAMME' },

    // Menus Exclusifs / Spécifiques par Site
    { id: 'sem-tot-1', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'VIP Total Plateau', platVedette: 'Capitaine Braisé & Riz Jasmin Parfumé', entreeProposee: 'Carpaccio de Saumon & Citron Vert', dessertPropose: 'Éclair Café Gourmand', boissonProposee: 'Jus de Passion Frais', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', entrepriseNom: 'TotalEnergies Sénégal', totalPrevu: 140, statut: 'EN_PRODUCTION' },
    { id: 'sem-tot-2', jour: 'Mercredi', date: '05 Nov', cadence: 'HEBDO', theme: 'Executive Dining', platVedette: 'Sombé de Lotte & Crevettes Géantes', entreeProposee: 'Salade Gourmet Chèvre Chaud', dessertPropose: 'Fondant Baobab', boissonProposee: 'Cocktail Agrumes', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar', entrepriseNom: 'TotalEnergies Sénégal', totalPrevu: 135, statut: 'VALIDE' },
    { id: 'sem-depot-1', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'Menu Express Portuaire', platVedette: 'Riz au Poisson Rouge Épicé', entreeProposee: 'Beignets Salés', dessertPropose: 'Yaourt Maison', boissonProposee: 'Bissap Glacé', siteId: 'site-2', siteNom: 'Dépôt Bel-Air / Port', entrepriseNom: 'TotalEnergies Sénégal', totalPrevu: 95, statut: 'EN_PRODUCTION' },
    { id: 'sem-sona-1', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'High-Tech Lunch Pikine', platVedette: 'Cordon Bleu Maison & Riz Parfumé', entreeProposee: 'Salade Croquante au Poulet', dessertPropose: 'Tarte Citron Meringuée', boissonProposee: 'Bissap Blanc & Menthe', siteId: 'site-sona-1', siteNom: 'Siège Technopole Pikine', entrepriseNom: 'Sonatel Orange', totalPrevu: 180, statut: 'EN_PRODUCTION' }
  ]);

  planningFiltreParSite = computed(() => {
    const siteId = this.filtreSitePlanning();
    if (siteId === 'TOUS') {
      return this.planningSemaineGlobal();
    }
    return this.planningSemaineGlobal().filter(item => item.siteId === siteId || item.siteId === 'TOUS');
  });

  // Modal Planning Supervision
  showModalPlanning = signal<boolean>(false);
  isNouveauMenuPlanning = signal<boolean>(false);
  planningEnEdition = signal<Partial<PlanningMenuSiteB2B>>({
    jour: 'Lundi',
    date: '10 Nov',
    cadence: 'HEBDO',
    theme: '',
    platVedette: '',
    entreeProposee: '',
    dessertPropose: '',
    boissonProposee: '',
    siteId: 'TOUS',
    siteNom: 'Tous les sites (Global)',
    totalPrevu: 150,
    statut: 'PROGRAMME'
  });

  // Stats Globales Super Admin
  totalSitesActifs = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.sites ? e.sites.length : 0), 0);
  });

  totalPlatsCatalogue = computed(() => this.b2b.catalogueJour().length);

  totalVolumeMensuelPrevu = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.budgetMensuelAlloue || 0), 0);
  });

  // GESTION DU TYPE DE PRESTATION & DES CATÉGORIES
  onTypePrestationEntrepriseChange(type: TypePrestationB2B) {
    const trouv = this.typesPrestationDisponibles.find(t => t.code === type);
    if (trouv) {
      this.entrepriseEnEdition.update(e => ({
        ...e,
        typePrestation: type,
        categoriesAutorisees: [...trouv.categoriesDefaut]
      }));
    }
  }

  toggleCategorieEntreprise(cat: CategoriePlatB2B) {
    this.entrepriseEnEdition.update(e => {
      const actuelles: CategoriePlatB2B[] = e.categoriesAutorisees ? [...e.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];
      const idx = actuelles.indexOf(cat);
      if (idx > -1) {
        if (actuelles.length === 1) return e; // Toujours garder au moins 1 catégorie
        actuelles.splice(idx, 1);
      } else {
        actuelles.push(cat);
      }
      return { ...e, categoriesAutorisees: actuelles };
    });
  }

  isCategorieEntrepriseActive(cat: CategoriePlatB2B): boolean {
    const cats = this.entrepriseEnEdition().categoriesAutorisees;
    return !!cats?.includes(cat);
  }

  onTypePrestationSiteChange(type: TypePrestationB2B) {
    const trouv = this.typesPrestationDisponibles.find(t => t.code === type);
    if (trouv) {
      this.siteEnEdition.update(s => ({
        ...s,
        typePrestation: type,
        categoriesAutorisees: [...trouv.categoriesDefaut]
      }));
    }
  }

  toggleCategorieSite(cat: CategoriePlatB2B) {
    this.siteEnEdition.update(s => {
      const actuelles: CategoriePlatB2B[] = s.categoriesAutorisees ? [...s.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];
      const idx = actuelles.indexOf(cat);
      if (idx > -1) {
        if (actuelles.length === 1) return s;
        actuelles.splice(idx, 1);
      } else {
        actuelles.push(cat);
      }
      return { ...s, categoriesAutorisees: actuelles };
    });
  }

  isCategorieSiteActive(cat: CategoriePlatB2B): boolean {
    const cats = this.siteEnEdition().categoriesAutorisees;
    return !!cats?.includes(cat);
  }

  getLibellePrestation(code?: TypePrestationB2B): string {
    const trouv = this.typesPrestationDisponibles.find(t => t.code === code);
    return trouv ? trouv.libelle : 'Formule Complète (4 composantes)';
  }

  // ACTIONS ENTREPRISE
  genererCodeAuto(nomEntreprise?: string): string {
    const base = (nomEntreprise || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    const prefix = base.length >= 3 ? base.slice(0, 3) : 'ENT';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${randomSuffix}`;
  }

  onNomEntrepriseChange(nom: string) {
    if (!this.isEditModeEntreprise()) {
      const nouveauCode = this.genererCodeAuto(nom);
      this.entrepriseEnEdition.update(actuel => ({
        ...actuel,
        codeEntreprise: nouveauCode
      }));
    }
  }

  regenererCodeEntreprise() {
    const code = this.genererCodeAuto(this.entrepriseEnEdition().nom);
    this.entrepriseEnEdition.update(actuel => ({
      ...actuel,
      codeEntreprise: code
    }));
  }

  ouvrirModalNouvelleEntreprise() {
    this.isEditModeEntreprise.set(false);
    this.entrepriseEnEdition.set({
      nom: '',
      codeEntreprise: this.genererCodeAuto(''),
      ninea: '',
      emailContact: '',
      telephone: '+221 ',
      tauxPriseEnCharge: 100,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 12000000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'MENSUELLE',
      typePrestation: 'COMPLETE',
      categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.showModalEntreprise.set(true);
  }

  ouvrirModalModifierEntreprise(ent: EntrepriseB2B) {
    this.isEditModeEntreprise.set(true);
    this.entrepriseEnEdition.set({
      ...ent,
      typePrestation: ent.typePrestation || 'COMPLETE',
      categoriesAutorisees: ent.categoriesAutorisees ? [...ent.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.showModalEntreprise.set(true);
  }

  enregistrerEntreprise() {
    const val = this.entrepriseEnEdition();
    if (!val.nom || !val.codeEntreprise) {
      alert('Veuillez saisir au moins la raison sociale et le code entreprise.');
      return;
    }

    if (this.isEditModeEntreprise() && val.id) {
      this.b2b.modifierEntreprise(val.id, val);
    } else {
      this.b2b.ajouterEntreprise({
        nom: val.nom!,
        codeEntreprise: val.codeEntreprise!,
        ninea: val.ninea,
        emailContact: val.emailContact,
        telephone: val.telephone,
        tauxPriseEnCharge: val.tauxPriseEnCharge || 100,
        plafondJournalier: val.plafondJournalier || 5000,
        budgetMensuelAlloue: val.budgetMensuelAlloue || 10000000,
        tarifNegocieHtva: val.tarifNegocieHtva || 4500,
        cadenceFacturation: val.cadenceFacturation || 'MENSUELLE',
        typePrestation: val.typePrestation || 'COMPLETE',
        categoriesAutorisees: val.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
        isArchivee: false
      });
    }
    this.showModalEntreprise.set(false);
  }

  // ACTIONS SITES
  ouvrirModalAjoutSite(entrepriseId: string) {
    this.entrepriseCibleSiteId.set(entrepriseId);
    this.isEditModeSite.set(false);

    // Hériter par défaut du type de prestation de l'entreprise parente
    const entParente = this.b2b.listeEntreprises().find(e => e.id === entrepriseId);
    const typeDefaut: TypePrestationB2B = entParente?.typePrestation || 'COMPLETE';
    const catsDefaut: CategoriePlatB2B[] = entParente?.categoriesAutorisees ? [...entParente.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];

    this.siteEnEdition.set({
      nom: '',
      adresse: '',
      heureCutOff: '10:30',
      contactReferent: '',
      telephoneReferent: '+221 ',
      typePrestation: typeDefaut,
      categoriesAutorisees: catsDefaut
    });
    this.showModalSite.set(true);
  }

  ouvrirModalModifierSite(entrepriseId: string, site: SiteB2B) {
    this.entrepriseCibleSiteId.set(entrepriseId);
    this.isEditModeSite.set(true);
    this.siteIdEnEdition.set(site.id);
    this.siteEnEdition.set({
      ...site,
      typePrestation: site.typePrestation || 'COMPLETE',
      categoriesAutorisees: site.categoriesAutorisees ? [...site.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.showModalSite.set(true);
  }

  enregistrerSite() {
    const s = this.siteEnEdition();
    const entId = this.entrepriseCibleSiteId();
    if (!s.nom || !s.adresse) {
      alert('Veuillez renseigner le nom du site et son adresse.');
      return;
    }

    if (this.isEditModeSite()) {
      this.b2b.modifierSite(entId, this.siteIdEnEdition(), s);
    } else {
      this.b2b.ajouterSiteAEntreprise(entId, {
        nom: s.nom!,
        adresse: s.adresse!,
        heureCutOff: s.heureCutOff || '10:30',
        contactReferent: s.contactReferent || 'Responsable Site',
        telephoneReferent: s.telephoneReferent || '+221 77 000 00 00',
        typePrestation: s.typePrestation || 'COMPLETE',
        categoriesAutorisees: s.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
        creneauxDisponibles: ['12h00 - 12h45', '13h00 - 13h45']
      });
    }
    this.showModalSite.set(false);
  }

  // ACTIONS CATALOGUE
  ouvrirModalAjoutPlat() {
    this.isEditModePlat.set(false);
    this.platEnEdition.set({
      nom: '',
      description: '',
      categorie: 'PLAT',
      prixUnitaire: 2800,
      image: '/assets/images/plats/p1.jpg',
      calories: 550
    });
    this.showModalPlat.set(true);
  }

  ouvrirModalModifierPlat(plat: PlatB2B) {
    this.isEditModePlat.set(true);
    this.platIdEnEdition.set(plat.id);
    this.platEnEdition.set({ ...plat });
    this.showModalPlat.set(true);
  }

  enregistrerPlat() {
    const p = this.platEnEdition();
    if (!p.nom || !p.prixUnitaire) {
      alert('Veuillez renseigner le nom du met et son tarif.');
      return;
    }

    if (this.isEditModePlat()) {
      this.b2b.modifierPlatCatalogue(this.platIdEnEdition(), p);
    } else {
      this.b2b.ajouterPlatCatalogue({
        nom: p.nom!,
        description: p.description || '',
        categorie: p.categorie || 'PLAT',
        prixUnitaire: p.prixUnitaire || 2500,
        image: p.image || '/assets/images/plats/p1.jpg',
        calories: p.calories || 500
      });
    }
    this.showModalPlat.set(false);
  }

  // ACTIONS PLANNING SUPERVISION
  ouvrirModalNouveauMenuSite() {
    this.isNouveauMenuPlanning.set(true);
    const siteActif = this.filtreSitePlanning();
    const siteTrouve = this.tousLesSites().find(s => s.id === siteActif);

    this.planningEnEdition.set({
      jour: 'Lundi',
      date: '10 Nov',
      cadence: 'HEBDO',
      theme: 'Spécial Déjeuner Site',
      platVedette: '',
      entreeProposee: '',
      dessertPropose: '',
      boissonProposee: '',
      siteId: siteActif === 'TOUS' ? 'TOUS' : siteActif,
      siteNom: siteTrouve ? siteTrouve.nom : 'Tous les sites (Global)',
      entrepriseNom: siteTrouve ? siteTrouve.entrepriseNom : undefined,
      totalPrevu: 120,
      statut: 'PROGRAMME'
    });
    this.showModalPlanning.set(true);
  }

  ouvrirModalEditPlanningGlobal(item: PlanningMenuSiteB2B) {
    this.isNouveauMenuPlanning.set(false);
    this.planningEnEdition.set({ ...item });
    this.showModalPlanning.set(true);
  }

  onSitePlanningSelectChange(siteId: string) {
    if (siteId === 'TOUS') {
      this.planningEnEdition.update(p => ({
        ...p,
        siteId: 'TOUS',
        siteNom: 'Tous les sites (Global)',
        entrepriseNom: undefined
      }));
    } else {
      const siteTrouve = this.tousLesSites().find(s => s.id === siteId);
      if (siteTrouve) {
        this.planningEnEdition.update(p => ({
          ...p,
          siteId: siteTrouve.id,
          siteNom: siteTrouve.nom,
          entrepriseNom: siteTrouve.entrepriseNom
        }));
      }
    }
  }

  enregistrerPlanningGlobal() {
    const edit = this.planningEnEdition();
    if (!edit.theme || !edit.platVedette) {
      alert('Veuillez renseigner le thème et le plat vedette.');
      return;
    }

    if (this.isNouveauMenuPlanning()) {
      const nouveau: PlanningMenuSiteB2B = {
        id: 'menu-' + Date.now(),
        jour: edit.jour || 'Lundi',
        date: edit.date || '10 Nov',
        cadence: edit.cadence || 'HEBDO',
        theme: edit.theme,
        platVedette: edit.platVedette,
        entreeProposee: edit.entreeProposee,
        dessertPropose: edit.dessertPropose,
        boissonProposee: edit.boissonProposee,
        siteId: edit.siteId || 'TOUS',
        siteNom: edit.siteNom || 'Tous les sites',
        entrepriseNom: edit.entrepriseNom,
        totalPrevu: edit.totalPrevu || 100,
        statut: edit.statut || 'PROGRAMME'
      };
      this.planningSemaineGlobal.update(list => [nouveau, ...list]);
    } else if (edit.id) {
      this.planningSemaineGlobal.update(list => list.map(item => item.id === edit.id ? { ...item, ...(edit as PlanningMenuSiteB2B) } : item));
    }
    this.showModalPlanning.set(false);
  }

  supprimerMenuPlanning(id: string) {
    if (confirm('Voulez-vous supprimer ce menu planifié ?')) {
      this.planningSemaineGlobal.update(list => list.filter(item => item.id !== id));
    }
  }
}

