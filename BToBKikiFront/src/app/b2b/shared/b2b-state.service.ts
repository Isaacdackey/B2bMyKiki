import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { EntrepriseB2B, SiteB2B, PlatB2B, FormuleRegle, EmployeB2B, SelectionRepas, CommandeHistoriqueB2B, LignePanierAutonome, UserRoleB2B, UserSessionB2B, CommandeEntrepriseSite, FacturationLigneJournaliere, MenuPlanifieJourEntreprise, InvitationAdminB2B, StatutCommandeSite, ReclamationCutOffB2B } from './b2b.models';
import { B2bApiService } from './b2b-api.service';

@Injectable({
  providedIn: 'root'
})
export class B2bStateService {
  private api = inject(B2bApiService);
  private loadInitialSession(): UserSessionB2B {
    const defaultSession: UserSessionB2B = {
      role: 'RESPONSABLE_ENTREPRISE',
      nomComplet: 'Mme Fatou Fall',
      titrePoste: 'Responsable RH & Moyens Généraux',
      entite: 'TotalEnergies Sénégal',
      siteId: 'site-1',
      siteNom: 'Siège Plateau - Dakar',
      badge: 'Responsable Entreprise',
      badgeColor: '#721513'
    };

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const path = window.location?.pathname || '';
      const raw = localStorage.getItem('b2b_current_session');
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as UserSessionB2B;
          if (parsed && parsed.role) {
            return parsed;
          }
        } catch {}
      }

      if (path.includes('/b2b/super-admin')) {
        return {
          role: 'SUPER_ADMIN',
          nomComplet: 'Direction Kiki Traiteur',
          titrePoste: 'Super Admin Kiki (Global)',
          entite: 'Kiki Traiteur B2B',
          siteId: 'site-1',
          siteNom: 'Siège Plateau - Dakar',
          badge: 'Direction Générale',
          badgeColor: '#721513'
        };
      } else if (path.includes('/b2b/cuisine')) {
        return {
          role: 'RESPONSABLE_SITE_KIKI',
          nomComplet: 'Chef Moussa Ndiaye',
          titrePoste: 'Responsable de Site Kiki',
          entite: 'Kiki Traiteur Exploitation',
          siteId: 'site-1',
          siteNom: 'Siège Plateau - Dakar',
          badge: 'Exploitation Cantine',
          badgeColor: '#C05621'
        };
      } else if (path.includes('/b2b/commande') || path.includes('/b2b/panier')) {
        return {
          role: 'SALARIE_CONVENTIONNE',
          nomComplet: 'Babacar Ndiaye',
          titrePoste: 'Salarié Conventionné',
          entite: 'TotalEnergies Sénégal',
          siteId: 'site-1',
          siteNom: 'Siège Plateau - Dakar',
          badge: 'Subventionné 100% • 0 FCFA',
          badgeColor: '#2E7D32'
        };
      }
    }
    return defaultSession;
  }

  // Session utilisateur B2B active (persistée en localStorage pour survivre au rafraîchissement F5)
  currentSession = signal<UserSessionB2B>(this.loadInitialSession());

  // Section active dans l'Espace Super Admin Kiki Traiteur
  superAdminActiveSection = signal<'DASHBOARD' | 'ENTREPRISES' | 'SITES' | 'CATALOGUE' | 'PLANNING' | 'FACTURATION'>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('b2b_sa_active_section') as any)) || 'DASHBOARD'
  );

  // Section active dans l'Espace Responsable Entreprise (RH) : Dashboard Vue Globale par défaut
  rhActiveSection = signal<'STATISTIQUES' | 'COMMANDES_SITE' | 'EMPLOYES' | 'FACTURATION' | 'SITES'>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('b2b_rh_active_section') as any)) || 'STATISTIQUES'
  );

  // Helpers de réduction pour les calculs de totaux de facturation
  sommePlatsLivres(acc: number, l: FacturationLigneJournaliere) { return acc + (l.nbPlatsLivres || 0); }
  sommeMontantTotal(acc: number, l: FacturationLigneJournaliere) { return acc + (l.montantTotal || 0); }
  sommeMontantEntreprise(acc: number, l: FacturationLigneJournaliere) { return acc + (l.montantPartEntreprise || 0); }
  sommePartEntreprise(acc: number, c: CommandeEntrepriseSite) { return acc + (c.partEntreprise || 0); }

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
    this.typesPrestationConfigurables.update(list => {
      const next = [...list, item];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_types_prestation', JSON.stringify(next));
      }
      return next;
    });
    this.api.createPrestation(item).subscribe({ error: () => {} });
  }

  // Ajouter une nouvelle catégorie alimentaire
  ajouterCategorie(item: { code: string; libelle: string; icone: string; couleur: string }) {
    this.categoriesConfigurables.update(list => {
      const next = [...list, item];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_categories_config', JSON.stringify(next));
      }
      return next;
    });
    this.api.createCategorie(item).subscribe({ error: () => {} });
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
    this.api.createEntreprise(ent).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeEntreprises.update(list => list.map(e => e.id === id ? res.data : e));
        }
      },
      error: () => {}
    });
    return ent;
  }

  // Méthode pour modifier une entreprise cliente
  modifierEntreprise(id: string, updates: Partial<EntrepriseB2B>) {
    this.listeEntreprises.update(list => list.map(e => e.id === id ? { ...e, ...updates } : e));
    if (this.currentEntreprise().id === id) {
      this.currentEntreprise.update(e => ({ ...e, ...updates }));
    }
    this.api.updateEntreprise(id, updates).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeEntreprises.update(list => list.map(e => e.id === id ? { ...e, ...res.data } : e));
          if (this.currentEntreprise().id === id) {
            this.currentEntreprise.update(e => ({ ...e, ...res.data }));
          }
        }
      },
      error: () => {}
    });
  }

  // Méthode pour archiver / désarchiver une entreprise
  toggleArchiverEntreprise(id: string) {
    this.listeEntreprises.update(list => list.map(e => e.id === id ? { ...e, isArchivee: !e.isArchivee } : e));
    this.api.toggleArchiveEntreprise(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeEntreprises.update(list => list.map(e => e.id === id ? { ...e, isArchivee: res.data.isArchivee } : e));
        }
      },
      error: () => {}
    });
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
    this.api.addSite(entrepriseId, nouveauSite).subscribe({ error: () => {} });
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
    const tempId = 'plat-' + Date.now();
    const nouveauPlat: PlatB2B = { ...plat, id: tempId, disponible: true, isArchive: false };
    this.catalogueJour.update(list => [nouveauPlat, ...list]);
    this.api.createPlat(nouveauPlat).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.catalogueJour.update(list => list.map(p => p.id === tempId ? res.data : p));
        }
      },
      error: () => {}
    });
  }

  modifierPlatCatalogue(id: string, updates: Partial<PlatB2B>) {
    this.catalogueJour.update(list => list.map(p => p.id === id ? { ...p, ...updates } : p));
    this.api.updatePlat(id, updates).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.catalogueJour.update(list => list.map(p => p.id === id ? res.data : p));
        }
      },
      error: () => {}
    });
  }

  toggleArchiverPlat(id: string) {
    let devientArchive = false;
    this.catalogueJour.update(list => list.map(p => {
      if (p.id === id) {
        devientArchive = !p.isArchive;
        return { ...p, isArchive: devientArchive };
      }
      return p;
    }));
    if (devientArchive) {
      // Retirer immédiatement le plat archivé des menus planifiés pour que la synchro soit totale
      this.menusPlanifiesEntreprises.update(menus =>
        menus.map(m => ({
          ...m,
          lignes: m.lignes.filter(l => l.platId !== id)
        }))
      );
    }
    this.api.toggleArchivePlat(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.catalogueJour.update(list => list.map(p => p.id === id ? res.data : p));
        }
      },
      error: () => {}
    });
  }

  // Onglet actif dans l'Espace Responsable de Site Kiki (Dashboard + Gestion Site)
  cuisineActiveTab = signal<'DASHBOARD' | 'INFOS' | 'UTILISATEURS' | 'MENU' | 'COMMANDES' | 'FACTURATION' | 'RECLAMATIONS' | 'PROJECTION_QR'>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('b2b_cuisine_active_tab') as any)) || 'DASHBOARD'
  );

  // Mode profil employé simulé : SUBVENTIONNE (prise en charge RH 100%) ou AUTONOME (frais personnels, panier libre, Wave)
  modeProfil = signal<'SUBVENTIONNE' | 'AUTONOME'>(
    (typeof localStorage !== 'undefined' && (localStorage.getItem('b2b_mode_profil') as any)) || 'SUBVENTIONNE'
  );

  // État de la Sidebar rétractable (Collapsed / Expanded) persisté
  isSidebarCollapsed = signal<boolean>(typeof localStorage !== 'undefined' && localStorage.getItem('b2b_sidebar_collapsed') === 'true');

  // État du Drawer Mobile (< 1024px)
  isMobileDrawerOpen = signal<boolean>(false);

  constructor() {
    // Définition immédiate dès le premier rendu
    this.updateSidebarCssVar(this.isSidebarCollapsed());

    // Réaction réactive aux changements d'état et persistance dans localStorage (survit au F5)
    effect(() => {
      const collapsed = this.isSidebarCollapsed();
      this.updateSidebarCssVar(collapsed);
    });

    effect(() => {
      const s = this.currentSession();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_current_session', JSON.stringify(s));
      }
    });

    effect(() => {
      const sec = this.superAdminActiveSection();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_sa_active_section', sec);
      }
    });

    effect(() => {
      const sec = this.rhActiveSection();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_rh_active_section', sec);
      }
    });

    effect(() => {
      const tab = this.cuisineActiveTab();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_cuisine_active_tab', tab);
      }
    });

    effect(() => {
      const mode = this.modeProfil();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_mode_profil', mode);
      }
    });

    // Synchronisation initiale avec le backend Spring Boot (si démarré)
    if (typeof localStorage !== 'undefined') {
      try {
        const savedTypes = localStorage.getItem('b2b_types_prestation');
        if (savedTypes) {
          const parsed = JSON.parse(savedTypes);
          if (Array.isArray(parsed) && parsed.length) this.typesPrestationConfigurables.set(parsed);
        }
        const savedCats = localStorage.getItem('b2b_categories_config');
        if (savedCats) {
          const parsed = JSON.parse(savedCats);
          if (Array.isArray(parsed) && parsed.length) this.categoriesConfigurables.set(parsed);
        }
      } catch {}
    }
    this.syncFromBackend();
  }

  syncFromBackend() {
    this.api.getEntreprises().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.listeEntreprises.set(res.data);
          this.currentEntreprise.set(res.data[0]);
        }
      },
      error: () => {}
    });

    this.api.getEmployes().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.listeEmployes.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getCatalogue(true).subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.catalogueJour.set(res.data);
          const archivedIds = new Set(res.data.filter(p => !!p.isArchive).map(p => p.id));
          if (archivedIds.size > 0) {
            this.menusPlanifiesEntreprises.update(menus =>
              menus.map(m => ({
                ...m,
                lignes: (m.lignes || []).filter(l => !archivedIds.has(l.platId))
              }))
            );
          }
        }
      },
      error: () => {}
    });

    this.api.getCommandes().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.listeCommandesSite.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getReclamations().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.listeReclamations.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getPlanning().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          const archivedIds = new Set(this.catalogueJour().filter(p => !!p.isArchive).map(p => p.id));
          this.menusPlanifiesEntreprises.set(
            res.data.map(m => ({
              ...m,
              lignes: (m.lignes || []).filter(l => !archivedIds.has(l.platId))
            }))
          );
        }
      },
      error: () => {}
    });

    this.api.getFacturation().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.lignesFacturationEntreprise.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getInvitations('ent-001').subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.listeInvitationsAdmins.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getPrestations().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.typesPrestationConfigurables.set(res.data);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('b2b_types_prestation', JSON.stringify(res.data));
          }
        }
      },
      error: () => {}
    });

    this.api.getCategories().subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.categoriesConfigurables.set(res.data);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('b2b_categories_config', JSON.stringify(res.data));
          }
        }
      },
      error: () => {}
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
  listeEntreprises = signal<EntrepriseB2B[]>([]);

  // Entreprise active
  currentEntreprise = signal<EntrepriseB2B>({
    id: '',
    nom: 'Chargement...',
    codeEntreprise: '',
    montantPriseEnChargeRepas: 5000,
    cutOffType: 'J_MOINS_1',
    cutOffHeure: '18:00',
    typePrestation: 'CUISINE_SUR_PLACE',
    categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
    sites: []
  });

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
  listeCommandesSite = signal<CommandeEntrepriseSite[]>([]);

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
    this.api.createEmploye(nouvelEmploye).subscribe({ error: () => {} });
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
    this.api.createInvitation(entreprise.id, invitation).subscribe({ error: () => {} });
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
    this.api.scannerCommande(cmdId).subscribe({ error: () => {} });
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
    this.api.livrerCommande(cmdId).subscribe({ error: () => {} });
  }

  // Mettre à jour la quantité d'un plat dans un jour planifié
  updateQuantitePlatMenu(menuJourId: string, ligneId: string, quantite: number, subventionnesCount: number) {
    this.api.updateQuantitePlanning(ligneId, Math.max(0, quantite)).subscribe({ error: () => {} });
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

  // GESTION DES RÉCLAMATIONS RETARDATAIRES (Cut-off dépassé)
  listeReclamations = signal<ReclamationCutOffB2B[]>([]);

  // Ajouter une réclamation d'employé
  soumettreReclamation(employe: EmployeB2B, motif: string): ReclamationCutOffB2B {
    const now = new Date();
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const dateStr = now.toISOString().slice(0, 10);
    const nouvelle: ReclamationCutOffB2B = {
      id: 'rec-' + Date.now(),
      entrepriseId: this.currentEntreprise().id || 'ent-001',
      siteId: employe.siteId,
      employeId: employe.id,
      employeNom: `${employe.prenom} ${employe.nom}`,
      matricule: employe.matricule,
      departement: employe.departement,
      date: dateStr,
      heureDemande: heure,
      motif: motif || 'Retard imprévu après l\'heure limite de cut-off',
      statut: 'EN_ATTENTE'
    };
    this.listeReclamations.update(list => [nouvelle, ...list]);
    this.api.createReclamation(nouvelle).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeReclamations.update(list => list.map(r => r.id === nouvelle.id ? res.data : r));
        }
      },
      error: () => {}
    });
    return nouvelle;
  }

  // Débloquer un employé retardataire (Responsable de site)
  debloquerReclamation(reclamationId: string) {
    const now = new Date();
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    this.listeReclamations.update(list => list.map(r => {
      if (r.id === reclamationId) {
        return {
          ...r,
          statut: 'DEBLOQUE',
          debloquePar: this.currentSession().nomComplet || 'Responsable de Site Kiki',
          debloqueAt: heure
        };
      }
      return r;
    }));
    this.api.debloquerReclamation(reclamationId, this.currentSession().nomComplet || 'Responsable de Site Kiki').subscribe({ error: () => {} });
  }

  // Vérifier si un employé est débloqué pour aujourd'hui
  isEmployeDebloqueAujourdhui(employeId: string): boolean {
    const today = new Date().toISOString().slice(0, 10);
    return this.listeReclamations().some(r => 
      r.employeId === employeId && 
      (r.date === today || r.date === '2026-11-12') && 
      r.statut === 'DEBLOQUE'
    );
  }

  // Calculer les stocks en temps réel pour un plat un jour donné
  getStockInfoPlat(platId: string, jourNom: string = 'Jeudi') {
    const entId = this.currentEntreprise().id;
    const menuJour = this.menusPlanifiesEntreprises().find(m => m.entrepriseId === entId && m.jourNom === jourNom);
    const ligne = menuJour?.lignes.find(l => l.platId === platId);
    const quotaPrevu = ligne?.quantitePrevue || 30; // Quota prévu
    
    // Commandes passées pour ce plat
    const commandesCount = this.listeCommandesSite().filter(c => 
      c.entrepriseId === entId && 
      (c.platNom.includes(ligne?.nomPlat || '') || c.categorie === ligne?.categorie)
    ).length;

    // Déjà commandé ajusté
    const dejaCommande = Math.min(quotaPrevu, Math.max(1, (commandesCount * 7) % quotaPrevu));
    const resteDisponible = Math.max(0, quotaPrevu - dejaCommande);

    return {
      quotaPrevu,
      dejaCommande,
      resteDisponible
    };
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
    this.api.dupliquerPlanningJour(entrepriseId, source.jourNom, cibleJourNom).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.menusPlanifiesEntreprises.update(list =>
            list.map(m => (m.entrepriseId === entrepriseId && m.jourNom === cibleJourNom) ? res.data : m)
          );
        }
      },
      error: () => {}
    });
  }

  // Ajouter un plat à un jour planifié (et synchroniser avec le backend)
  ajouterPlatMenuJour(entrepriseId: string, jourNom: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche', plat: PlatB2B, quantitePrevue: number = 35) {
    const tempLigneId = 'l-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    this.menusPlanifiesEntreprises.update(list => list.map(m => {
      if ((m.entrepriseId === entrepriseId || (entrepriseId === 'ent-001' && m.entrepriseId === 'GLOBAL')) && m.jourNom === jourNom) {
        if (m.lignes.some(l => l.platId === plat.id)) {
          return m;
        }
        const nouvelleLigne = {
          id: tempLigneId,
          categorie: plat.categorie,
          platId: plat.id,
          nomPlat: plat.nom,
          image: plat.image,
          quantitePrevue,
          disponible: true
        };
        return {
          ...m,
          lignes: [...m.lignes, nouvelleLigne],
          quantitesSaisies: quantitePrevue > 0 ? true : m.quantitesSaisies
        };
      }
      return m;
    }));

    this.api.ajouterPlatPlanning(entrepriseId, jourNom, plat.id, quantitePrevue).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.menusPlanifiesEntreprises.update(list =>
            list.map(m => (m.entrepriseId === entrepriseId && m.jourNom === jourNom) ? res.data : m)
          );
        }
      },
      error: () => {}
    });
  }

  // Supprimer une ligne d'un jour planifié (et synchroniser avec le backend)
  supprimerLigneMenuJour(menuIdOrJourNom: string, ligneId: string) {
    this.menusPlanifiesEntreprises.update(list => list.map(m => {
      if (m.id === menuIdOrJourNom || m.jourNom === menuIdOrJourNom) {
        return {
          ...m,
          lignes: m.lignes.filter(l => l.id !== ligneId)
        };
      }
      return m;
    }));
    this.api.supprimerLignePlanning(ligneId).subscribe({ error: () => {} });
  }

  // Reconduire la semaine suivante (et synchroniser avec le backend)
  reconduireSemainePlanning(entrepriseId = 'ent-001') {
    this.deployerProgrammationGlobaleVersEntreprises();
    this.api.reconduireSemainePlanning(entrepriseId).subscribe({
      next: (res) => {
        if (res.success && res.data?.length) {
          this.syncFromBackend();
        }
      },
      error: () => {}
    });
  }

  // Enregistrer une nouvelle commande employé (et synchroniser avec le backend)
  enregistrerCommandeSite(payload: {
    codeCommande: string;
    platNom: string;
    categorie: 'ENTREE' | 'PLAT' | 'GARNITURE' | 'DESSERT' | 'BOISSON';
    montantTotal: number;
    partEntreprise: number;
    partEmploye: number;
    qrCode?: string;
  }) {
    const emp = this.currentEmploye();
    const ent = this.currentEntreprise();
    const site = this.siteActuel();
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nouvelleCmd: CommandeEntrepriseSite = {
      id: 'cmd-' + Date.now(),
      codeCommande: payload.codeCommande,
      entrepriseId: ent.id || 'ent-001',
      entrepriseNom: ent.nom || 'TotalEnergies — Siège Plateau',
      matricule: emp.matricule,
      employeNom: `${emp.prenom} ${emp.nom}`,
      categorie: payload.categorie,
      platNom: payload.platNom,
      date: dateStr,
      heure: heureStr,
      montantTotal: payload.montantTotal,
      partEntreprise: payload.partEntreprise,
      partEmploye: payload.partEmploye,
      statut: 'EN_COURS'
    };

    this.listeCommandesSite.update(list => [nouvelleCmd, ...list]);
    this.historiqueCommandes.update(list => [
      {
        id: payload.codeCommande,
        date: dateStr,
        heure: heureStr,
        matricule: emp.matricule,
        employeNom: `${emp.prenom} ${emp.nom}`,
        siteId: site?.id || 'site-1',
        siteNom: site?.nom || 'Siège Plateau - Dakar',
        formuleNom: this.modeProfil() === 'AUTONOME' ? 'Panier Libre Autonome' : this.formuleActuelle().nom,
        platNom: payload.platNom,
        prixTotal: payload.montantTotal,
        partEntreprise: payload.partEntreprise,
        partEmploye: payload.partEmploye,
        tauxSubventionApplique: emp.tauxSubvention,
        statut: 'VALIDE'
      },
      ...list
    ]);

    this.api.createCommande({
      ...nouvelleCmd,
      ...(payload.qrCode ? { qrCode: payload.qrCode } : {})
    } as any).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeCommandesSite.update(list => list.map(c => c.id === nouvelleCmd.id ? res.data : c));
        }
      },
      error: () => {}
    });
  }

  // PROGRAMMATION GLOBALE & DÉPLOIEMENT VERS TOUTES LES ENTREPRISES
  // Déploie le programme global préparé par le Super Admin vers les sites/entreprises
  // en adaptant automatiquement selon les catégories autorisées de chaque entreprise et en excluant les plats archivés.
  deployerProgrammationGlobaleVersEntreprises() {
    const archivedPlatIds = new Set(
      this.catalogueJour().filter(p => !!p.isArchive).map(p => p.id)
    );
    const programmeGlobal = this.menusPlanifiesEntreprises().filter(m => m.entrepriseId === 'ent-001' || m.entrepriseId === 'GLOBAL');
    const entreprises = this.listeEntreprises();

    this.menusPlanifiesEntreprises.update(listeActuelle => {
      // Nettoyer d'abord tout plat archivé de l'ensemble des menus existants
      let nouvelleListe = listeActuelle.map(m => ({
        ...m,
        lignes: m.lignes.filter(l => !archivedPlatIds.has(l.platId))
      }));

      entreprises.forEach(ent => {
        const categoriesAutorisees = ent.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];

        ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].forEach(jour => {
          const modeleJour = programmeGlobal.find(p => p.jourNom === jour);
          if (!modeleJour) return;

          // Filtrer les lignes selon les catégories autorisées du contrat de l'entreprise ET exclure les plats archivés
          const lignesFiltrees = modeleJour.lignes
            .filter(l => !archivedPlatIds.has(l.platId) && categoriesAutorisees.includes(l.categorie))
            .map(l => ({
              ...l,
              id: ent.id === 'ent-001' ? l.id : ('l-' + ent.id + '-' + jour + '-' + l.platId),
              quantitePrevue: ent.id === 'ent-001' ? (l.quantitePrevue || 35) : 0
            }));

          const existantIdx = nouvelleListe.findIndex(m => m.entrepriseId === ent.id && m.jourNom === jour);
          const menuDeploye: MenuPlanifieJourEntreprise = {
            id: existantIdx >= 0 ? nouvelleListe[existantIdx].id : `plan-${ent.id}-${jour.toLowerCase().slice(0, 3)}`,
            entrepriseId: ent.id,
            jourNom: jour as any,
            dateStr: modeleJour.dateStr,
            theme: modeleJour.theme,
            lignes: lignesFiltrees,
            quantitesSaisies: ent.id === 'ent-001' ? modeleJour.quantitesSaisies : false,
            statutConformite: ent.id === 'ent-001' ? modeleJour.statutConformite : 'NON_SAISI'
          };

          if (existantIdx >= 0) {
            nouvelleListe[existantIdx] = menuDeploye;
          } else {
            nouvelleListe.push(menuDeploye);
          }
        });
      });

      return nouvelleListe;
    });

    this.api.deployerPlanningGlobal('ent-001').subscribe({ error: () => {} });
  }

  // Annuaire des employés RH de l'entreprise
  listeEmployes = signal<EmployeB2B[]>([]);

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
  catalogueJour = signal<PlatB2B[]>([]);

  // Méthode pour activer / désactiver la proposition d'un plat sur le site
  toggleDisponibilitePlat(platId: string) {
    this.catalogueJour.update(list => list.map(p => {
      if (p.id === platId) {
        return { ...p, disponible: p.disponible !== false ? false : true };
      }
      return p;
    }));
    this.api.toggleDisponibilitePlat(platId).subscribe({ error: () => {} });
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
  siteActuel = computed<SiteB2B>(() => {
    const ent = this.currentEntreprise();
    const id = this.selectedSiteId();
    const found = ent?.sites?.find(s => s.id === id) || ent?.sites?.[0];
    if (found) return found;
    return {
      id: id || 'site-1',
      nom: ent?.nom && ent.nom !== 'Chargement...' ? ent.nom : 'Siège Plateau - Dakar',
      adresse: ent?.adresse || 'Dakar',
      heureCutOff: ent?.cutOffHeure || '18:00',
      contactReferent: ent?.contactReferent || '',
      telephoneReferent: ent?.telephone || ''
    };
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
    this.ajouterEmploye(nouvelEmp);
  }

  toggleStatutEmploye(empId: string) {
    this.api.toggleActifEmploye(empId).subscribe({ error: () => {} });
    let updatedEmp: EmployeB2B | null = null;
    this.listeEmployes.update(list => list.map(emp => {
      if (emp.id === empId) {
        const nextActif = !emp.actif;
        if (!nextActif) {
          const prevTaux = emp.tauxSubvention ?? 100;
          updatedEmp = {
            ...emp,
            actif: false,
            tauxSubvention: 0,
            type: 'AUTONOME',
            tauxSubventionPrecedent: prevTaux
          } as EmployeB2B;
        } else {
          const savedTaux = (emp as EmployeB2B & { tauxSubventionPrecedent?: number }).tauxSubventionPrecedent;
          const restoredTaux = savedTaux !== undefined ? savedTaux : (emp.tauxSubvention > 0 ? emp.tauxSubvention : 100);
          updatedEmp = {
            ...emp,
            actif: true,
            tauxSubvention: restoredTaux,
            type: restoredTaux === 0 ? 'AUTONOME' : 'SUBVENTIONNE'
          };
        }
        return updatedEmp;
      }
      return emp;
    }));

    if (updatedEmp && this.currentEmploye().id === empId) {
      this.currentEmploye.set(updatedEmp);
    }
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
      case 'GARNITURE': sel.garniture = plat; break;
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
      case 'GARNITURE': if (sel.garniture?.id === plat.id) sel.garniture = undefined; break;
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
    this.api.updateTauxSubvention(empId, nouveauTaux).subscribe({ error: () => {} });
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

  // Transition cinématique de changement de page (double rideau rouge)
  curtainPhase = signal<'idle' | 'covering' | 'revealing'>('idle');
  private curtainTimer?: ReturnType<typeof setTimeout>;
  private curtainEndTimer?: ReturnType<typeof setTimeout>;

  naviguerAvecRideau(url: string, navigateFn: (target: string) => Promise<boolean> | void) {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigateFn(url);
      return;
    }

    if (this.curtainTimer) clearTimeout(this.curtainTimer);
    if (this.curtainEndTimer) clearTimeout(this.curtainEndTimer);

    this.curtainPhase.set('covering');

    this.curtainTimer = setTimeout(() => {
      navigateFn(url);
      if (typeof window !== 'undefined') {
        window.scrollTo(0, 0);
      }
      this.curtainPhase.set('revealing');

      this.curtainEndTimer = setTimeout(() => {
        this.curtainPhase.set('idle');
      }, 640);
    }, 480);
  }

  viderPanierAutonome() {
    this.panierAutonome.set([]);
  }
}
