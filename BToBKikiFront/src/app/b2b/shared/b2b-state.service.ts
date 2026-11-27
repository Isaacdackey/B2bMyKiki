import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { EntrepriseB2B, SiteB2B, PlatB2B, FormuleRegle, EmployeB2B, SelectionRepas, CommandeHistoriqueB2B, LignePanierAutonome, UserRoleB2B, UserSessionB2B, CommandeEntrepriseSite, FacturationLigneJournaliere, MenuPlanifieJourEntreprise, InvitationAdminB2B, StatutCommandeSite, ReclamationCutOffB2B } from './b2b.models';
import { B2bApiService } from './b2b-api.service';

@Injectable({
  providedIn: 'root'
})
export class B2bStateService {
  private api = inject(B2bApiService);
  private loadInitialSession(): UserSessionB2B {
    const emptySession: UserSessionB2B = {
      role: 'SALARIE_CONVENTIONNE',
      nomComplet: '',
      titrePoste: '',
      entite: '',
      siteId: '',
      siteNom: '',
      badge: '',
      badgeColor: '#721513'
    };

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      const hasToken = !!localStorage.getItem('b2b_jwt_token');
      const raw = localStorage.getItem('b2b_current_session');
      if (hasToken && raw) {
        try {
          const parsed = JSON.parse(raw) as UserSessionB2B;
          if (parsed && parsed.role) {
            return parsed;
          }
        } catch {}
      }
    }
    return emptySession;
  }

  // États asynchrones globaux (Loading & Toast succès/erreur)
  isLoading = signal<boolean>(false);
  toastMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  showToast(text: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set({ type, text });
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 3500);
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

  resolveCutOffJoursAvant(obj?: { cutOffJoursAvant?: number | null; cutOffType?: string | null }): number {
    if (obj && typeof obj.cutOffJoursAvant === 'number' && !isNaN(obj.cutOffJoursAvant) && obj.cutOffJoursAvant >= 0) {
      return Math.floor(obj.cutOffJoursAvant);
    }
    const t = (obj?.cutOffType || '').trim().toUpperCase();
    if (t === 'JOUR_J' || t === '0') return 0;
    if (t.startsWith('J_MOINS_')) {
      const n = parseInt(t.replace('J_MOINS_', ''), 10);
      return !isNaN(n) && n >= 0 ? n : 1;
    }
    const parsed = parseInt(t, 10);
    return !isNaN(parsed) && parsed >= 0 ? parsed : 1;
  }

  formatCutOffLibelle(obj?: { cutOffJoursAvant?: number | null; cutOffType?: string | null; cutOffHeure?: string | null }): string {
    if (!obj) return 'J-1 à 18:00';
    if (obj.cutOffType === 'SANS_CUTOFF') return 'Sans Cut-Off (Libre)';
    const j = this.resolveCutOffJoursAvant(obj);
    const h = obj.cutOffHeure || '18:00';
    const prefix = j === 0 ? 'Jour J' : `J-${j}`;
    return `${prefix} à ${h}`;
  }

  // Types de prestation configurables
  typesPrestationConfigurables = signal<{ code: string; libelle: string; desc: string; categoriesDefaut: string[]; cutOffType?: string; cutOffJoursAvant?: number; cutOffHeure?: string; reglesCutOff?: string; joursDisponibles?: string[]; isArchive?: boolean }[]>([
    { 
      code: 'CUISINE_SUR_PLACE', 
      libelle: 'Cuisine et service sur place', 
      desc: 'Préparation et dressage en restaurant d’entreprise sur place', 
      categoriesDefaut: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
      cutOffType: 'JOUR_J',
      cutOffJoursAvant: 0,
      cutOffHeure: '10:30',
      reglesCutOff: 'Clôture le matin même avant lancement en cuisine sur site',
      joursDisponibles: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    { 
      code: 'SERVICE_SUR_PLACE', 
      libelle: 'Service sur place (Réfectoire)', 
      desc: 'Plats cuisinés acheminés chauds et servis à l’assiette au réfectoire', 
      categoriesDefaut: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
      cutOffType: 'J_MOINS_1',
      cutOffJoursAvant: 1,
      cutOffHeure: '18:00',
      reglesCutOff: 'Préparation centrale, clôture la veille au soir',
      joursDisponibles: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    { 
      code: 'LIVRAISON_BARQUETTES', 
      libelle: 'Livraison en barquettes', 
      desc: 'Conditionnement individuel hermétique scellé et étiqueté', 
      categoriesDefaut: ['PLAT', 'BOISSON'],
      cutOffType: 'J_MOINS_1',
      cutOffJoursAvant: 1,
      cutOffHeure: '16:00',
      reglesCutOff: 'Conditionnement et étiquetage individuel J-1',
      joursDisponibles: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    }
  ]);

  // Catégories alimentaires configurables
  categoriesConfigurables = signal<{ code: string; libelle: string; icone: string; couleur: string }[]>([
    { code: 'ENTREE', libelle: 'Entrée', icone: 'fa-leaf', couleur: '#606C38' },
    { code: 'PLAT', libelle: 'Plat chaud', icone: 'fa-bowl-food', couleur: '#721513' },
    { code: 'DESSERT', libelle: 'Dessert', icone: 'fa-cake-candles', couleur: '#C5A880' },
    { code: 'BOISSON', libelle: 'Boisson', icone: 'fa-wine-glass', couleur: '#332724' }
  ]);

  // Archiver / Désarchiver un type de prestation
  toggleArchiverTypePrestation(code: string) {
    this.lastMutationAt = Date.now();
    this.typesPrestationConfigurables.update(list => {
      const next = list.map((t: any) => t.code === code ? { ...t, isArchive: !t.isArchive } : t);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_types_prestation', JSON.stringify(next));
      }
      return next;
    });
    this.api.toggleArchivePrestation(code).subscribe({ error: () => {} });
  }

  // Archiver / Désarchiver une catégorie alimentaire
  toggleArchiverCategorie(code: string) {
    this.lastMutationAt = Date.now();
    this.categoriesConfigurables.update(list => {
      const next = list.map((c: any) => c.code === code ? { ...c, isArchive: !c.isArchive } : c);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_categories_config', JSON.stringify(next));
      }
      return next;
    });
    this.api.toggleArchiveCategorie(code).subscribe({ error: () => {} });
  }

  // Ajouter un nouveau type de prestation
  ajouterTypePrestation(item: { code: string; libelle: string; desc: string; categoriesDefaut: string[]; cutOffType?: string; cutOffJoursAvant?: number; cutOffHeure?: string; reglesCutOff?: string; joursDisponibles?: string[] }) {
    this.lastMutationAt = Date.now();
    this.typesPrestationConfigurables.update(list => {
      const next = [...list, item];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_types_prestation', JSON.stringify(next));
      }
      return next;
    });
    this.api.createPrestation({ ...item, isArchive: false }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.typesPrestationConfigurables.update(list =>
            list.map(t => t.code === item.code ? { ...t, ...res.data, desc: res.data.description || res.data.desc || t.desc } : t)
          );
        }
      },
      error: () => {}
    });
  }

  // Ajouter une nouvelle catégorie alimentaire
  ajouterCategorie(item: { code: string; libelle: string; icone: string; couleur: string }) {
    this.lastMutationAt = Date.now();
    this.categoriesConfigurables.update(list => {
      const next = [...list, item];
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('b2b_categories_config', JSON.stringify(next));
      }
      return next;
    });
    this.api.createCategorie({ ...item, isArchive: false }).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.categoriesConfigurables.update(list =>
            list.map(c => c.code === item.code ? { ...c, ...res.data } : c)
          );
        }
      },
      error: () => {}
    });
  }

  // Méthode pour ajouter une entreprise cliente
  ajouterEntreprise(
    nouvelle: Omit<EntrepriseB2B, 'id' | 'sites'>,
    adminsToInvite: Array<{ email: string; nomComplet: string; role: 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI' }> = []
  ) {
    this.lastMutationAt = Date.now();
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
          const savedEnt = res.data;
          this.listeEntreprises.update(list => list.map(e => e.id === id ? savedEnt : e));
          adminsToInvite.forEach(adm => {
            if (adm.email && adm.nomComplet) {
              this.creerInvitationAdmin(adm.email, adm.nomComplet, adm.role, savedEnt);
            }
          });
        }
      },
      error: () => {
        adminsToInvite.forEach(adm => {
          if (adm.email && adm.nomComplet) {
            this.creerInvitationAdmin(adm.email, adm.nomComplet, adm.role, ent);
          }
        });
      }
    });
    return ent;
  }

  // Méthode pour modifier une entreprise cliente
  modifierEntreprise(id: string, updates: Partial<EntrepriseB2B>) {
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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

    if (typeof window !== 'undefined') {
      setInterval(() => {
        if ((typeof document === 'undefined' || document.visibilityState === 'visible')
            && Date.now() - this.lastMutationAt > 10000) {
          this.syncFromBackend();
        }
      }, 8000);
    }
  }

  private lastMutationAt = 0;

  private resolveActiveEntreprise(entreprises: EntrepriseB2B[]) {
    if (!entreprises.length) return;
    const activeEntreprises = entreprises.filter(e => !e.isArchivee);
    const pool = activeEntreprises.length > 0 ? activeEntreprises : entreprises;
    const session = this.currentSession();
    const emp = this.currentEmploye();
    const curId = this.currentEntreprise()?.id;
    let match: EntrepriseB2B | undefined;

    // Priorité : l'entreprise réelle de l'employé connecté (fiche employé en base)
    if (emp?.id && emp.email) {
      const empEntId = (emp as any).entrepriseId || emp.siteId;
      if (empEntId) {
        match = pool.find(e => e.id === empEntId || e.sites?.some(s => s.id === empEntId));
      }
    }
    if (!match && session?.entrepriseId) {
      match = pool.find(e => e.id === session.entrepriseId);
    }
    if (!match && session?.entite) {
      const entiteLower = session.entite.trim().toLowerCase();
      match = pool.find(e => e.nom.trim().toLowerCase() === entiteLower || entiteLower.includes(e.nom.trim().toLowerCase()));
    }
    if (!match && session?.siteId) {
      match = pool.find(e => e.id === session.siteId || e.sites?.some(s => s.id === session.siteId));
    }
    if (!match && emp?.id) {
      const empEntId = (emp as any).entrepriseId || emp.siteId;
      if (empEntId) {
        match = pool.find(e => e.id === empEntId || e.sites?.some(s => s.id === empEntId));
      }
      if (!match && emp.matricule) {
        const matUpper = emp.matricule.trim().toUpperCase();
        match = pool.find(e => e.codeEntreprise && matUpper.startsWith(e.codeEntreprise.trim().toUpperCase()));
      }
      if (!match && emp.siteNom) {
        const siteNomLower = emp.siteNom.trim().toLowerCase();
        match = pool.find(e => e.nom.trim().toLowerCase() === siteNomLower || e.sites?.some(s => s.nom.trim().toLowerCase() === siteNomLower));
      }
    }
    if (!match && curId) {
      match = pool.find(e => e.id === curId);
    }
    const resolved = match || pool[0];
    this.currentEntreprise.set(resolved);
    if (resolved?.montantPriseEnChargeRepas) {
      this.formuleActuelle.update(f => ({ ...f, prixForfait: resolved.montantPriseEnChargeRepas }));
    }
    if (session?.siteId && resolved.sites?.some(s => s.id === session.siteId)) {
      this.selectedSiteId.set(session.siteId);
    } else if (resolved.sites?.length) {
      this.selectedSiteId.set(resolved.sites[0].id);
    }
  }

  private resolveCurrentEmployeFromSession() {
    const session = this.currentSession();
    const list = this.listeEmployes();
    const isSub = this.modeProfil() === 'SUBVENTIONNE';

    if (session?.nomComplet || session?.matricule || session?.email) {
      const sEmail = (session.email || '').trim().toLowerCase();
      const sMat = (session.matricule || '').trim().toLowerCase();
      const sNom = (session.nomComplet || '').trim().toLowerCase();

      const found = list.find(e =>
        (sEmail && (e.email || '').trim().toLowerCase() === sEmail) ||
        (sMat && (e.matricule || '').trim().toLowerCase() === sMat) ||
        (sNom && `${e.prenom || ''} ${e.nom || ''}`.trim().toLowerCase() === sNom)
      );

      if (found) {
        const realType: 'SUBVENTIONNE' | 'AUTONOME' = (found.tauxSubvention ?? 0) > 0 ? 'SUBVENTIONNE' : 'AUTONOME';
        this.currentEmploye.set({ ...found, type: realType });
        if (this.modeProfil() !== realType) {
          this.modeProfil.set(realType);
        }
        this.resolveActiveEntreprise(this.listeEntreprises());
        return;
      }

      const parts = (session.nomComplet || 'Collaborateur Kiki').trim().split(/\s+/);
      const prenom = parts[0] || 'Collaborateur';
      const nom = parts.slice(1).join(' ') || '';
      const ent = this.currentEntreprise();
      const site = this.siteActuel();
      const mode: 'SUBVENTIONNE' | 'AUTONOME' =
        session.role === 'SALARIE_AUTONOME'
          ? 'AUTONOME'
          : session.role === 'SALARIE_CONVENTIONNE'
            ? 'SUBVENTIONNE'
            : (isSub ? 'SUBVENTIONNE' : 'AUTONOME');
      if (this.modeProfil() !== mode) {
        this.modeProfil.set(mode);
      }
      this.currentEmploye.set({
        id: session.matricule || session.email || 'emp-session',
        matricule: session.matricule || 'EMP-B2B',
        nom,
        prenom,
        email: session.email || '',
        telephone: '',
        siteId: session.siteId || ent?.id || site.id || 'site-1',
        siteNom: session.siteNom || (ent?.nom && ent.nom !== 'Chargement...' ? ent.nom : site.nom) || 'Dakar',
        departement: session.titrePoste || 'Collaborateur',
        type: mode,
        tauxSubvention: mode === 'SUBVENTIONNE' ? 100 : 0,
        actif: true,
        repasConsommesMois: 0,
        montantPrisEnChargeMois: 0
      });
      return;
    }

    if (list.length > 0) {
      const fallback = list.find(e => (isSub ? e.type === 'SUBVENTIONNE' : e.type === 'AUTONOME')) || list[0];
      this.currentEmploye.set(fallback);
    }
  }

  private syncHistoriqueFromCommandesSite(commandes: CommandeEntrepriseSite[]) {
    const site = this.siteActuel();
    const mapped: CommandeHistoriqueB2B[] = commandes.map(c => ({
      id: c.codeCommande || c.id,
      date: c.date,
      heure: c.heure || '12:00',
      matricule: c.matricule,
      employeNom: c.employeNom,
      siteId: site?.id || 'site-1',
      siteNom: c.entrepriseNom || site?.nom || 'Siège Plateau - Dakar',
      formuleNom: this.formuleActuelle().nom,
      platNom: c.platNom,
      prixTotal: c.montantTotal ?? ((c.partEntreprise ?? 0) + (c.partEmploye ?? 0)),
      partEntreprise: c.partEntreprise ?? 0,
      partEmploye: c.partEmploye ?? 0,
      tauxSubventionApplique: (c.montantTotal && c.montantTotal > 0)
        ? Math.round(((c.partEntreprise ?? 0) / c.montantTotal) * 100)
        : 100,
      statut: c.statut === 'LIVRE'
        ? 'LIVRE'
        : c.statut === 'SCANNE'
          ? 'EN_PREPARATION'
          : 'VALIDE'
    }));
    this.historiqueCommandes.set(mapped);
  }

  syncFromBackend() {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('b2b_jwt_token')) {
      return;
    }
    this.api.getEntreprises().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          const normalized = res.data.map(e => ({
            ...e,
            categoriesAutorisees: Array.from(new Set(e.categoriesAutorisees || []))
          }));
          this.listeEntreprises.set(normalized);
          this.resolveActiveEntreprise(normalized);
        }
      },
      error: () => {}
    });

    this.api.getEmployes().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.listeEmployes.set(res.data);
          this.resolveCurrentEmployeFromSession();
        }
      },
      error: () => {}
    });

    this.api.getCatalogue(true).subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
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

    this.api.getCommandes('ALL').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.listeCommandesSite.set(res.data);
          this.syncHistoriqueFromCommandesSite(res.data);
        }
      },
      error: () => {}
    });

    this.api.getReclamations('ALL').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.listeReclamations.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getPlanning().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
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

    this.api.getFacturation('ALL').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.lignesFacturationEntreprise.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getInvitations('ALL').subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data)) {
          this.listeInvitationsAdmins.set(res.data);
        }
      },
      error: () => {}
    });

    this.api.getPrestations().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((tp: any) => ({
            code: tp.code,
            libelle: tp.libelle,
            desc: tp.description || tp.desc || '',
            categoriesDefaut: Array.from(new Set<string>(tp.categoriesDefaut || ['PLAT', 'BOISSON'])),
            cutOffType: tp.cutOffType,
            cutOffJoursAvant: this.resolveCutOffJoursAvant(tp),
            cutOffHeure: tp.cutOffHeure,
            reglesCutOff: tp.reglesCutOff,
            joursDisponibles: tp.joursDisponibles,
            isArchive: tp.isArchive ?? tp.archive ?? false
          }));
          this.typesPrestationConfigurables.set(mapped);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('b2b_types_prestation', JSON.stringify(mapped));
          }
        }
      },
      error: () => {}
    });

    this.api.getCategories().subscribe({
      next: (res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
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
    id: '',
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    siteId: '',
    siteNom: '',
    departement: '',
    type: 'SUBVENTIONNE',
    tauxSubvention: 100,
    actif: true,
    repasConsommesMois: 0,
    montantPrisEnChargeMois: 0
  });

  // Liste des invitations administrateurs par email
  listeInvitationsAdmins = signal<InvitationAdminB2B[]>([]);

  // Menus planifiés par entreprise (Calendrier Semaine Lundi - Dimanche avec quantités & conformité)
  menusPlanifiesEntreprises = signal<MenuPlanifieJourEntreprise[]>([]);

  // Commandes de site avec statuts : EN_COURS -> SCANNE -> LIVRE
  listeCommandesSite = signal<CommandeEntrepriseSite[]>([]);

  // Lignes de facturation journalières pour l'entreprise
  lignesFacturationEntreprise = signal<FacturationLigneJournaliere[]>([]);

  // Méthode pour ajouter un employé
  ajouterEmploye(emp: Partial<EmployeB2B>) {
    this.lastMutationAt = Date.now();
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
    this.api.createEmploye(nouvelEmploye).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeEmployes.update(list => list.map(e => e.id === nouvelEmploye.id ? res.data : e));
        }
      },
      error: () => {}
    });
  }

  importerEmployesBatch(employes: Partial<EmployeB2B>[]) {
    if (!employes.length) return;
    this.api.importEmployesBatch(employes).subscribe({
      next: (res) => {
        const saved = res.data || [];
        if (saved.length > 0) {
          this.listeEmployes.update(list => [...saved, ...list]);
          this.showToast(`Importation réussie : ${saved.length} collaborateur(s) enregistré(s).`, 'success');
        }
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erreur lors de l\'importation CSV.', 'error');
      }
    });
  }

  // Méthode pour créer une invitation administrateur
  creerInvitationAdmin(
    email: string,
    nomComplet: string,
    role: 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI',
    entreprise: EntrepriseB2B,
    onCreated?: (inv: InvitationAdminB2B) => void
  ): InvitationAdminB2B {
    const roleLibelle = role === 'RESPONSABLE_ENTREPRISE' ? 'Admin Entreprise (RH)' : 'Responsable de Site Kiki';
    const prefix = role === 'RESPONSABLE_ENTREPRISE' ? 'RH' : 'KIKI';
    const token = `ACT-${prefix}-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date();
    const dateEnvoi = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const tempId = 'inv-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const invitation: InvitationAdminB2B = {
      id: tempId,
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
    this.api.createInvitation(entreprise.id, invitation).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeInvitationsAdmins.update(list => list.map(i => i.id === tempId ? res.data : i));
          this.showToast(`Invitation envoyée par email à ${res.data.email}`);
          if (onCreated) onCreated(res.data);
        } else if (onCreated) {
          onCreated(invitation);
        }
      },
      error: (err) => {
        this.showToast(err?.error?.message || `Impossible d'envoyer l'invitation par email à ${email}.`, 'error');
        if (onCreated) onCreated(invitation);
      }
    });
    return invitation;
  }

  renvoyerInvitationAdmin(entrepriseId: string, invitationId: string) {
    this.api.resendInvitation(entrepriseId, invitationId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeInvitationsAdmins.update(list => list.map(i => i.id === invitationId ? res.data : i));
          this.showToast(`Invitation renvoyée à ${res.data.email}`);
        }
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Impossible de renvoyer l’invitation.');
      }
    });
  }

  // Scanner une commande (QR code cantine)
  scannerCommandeSite(cmdId: string) {
    this.lastMutationAt = Date.now();
    const now = new Date();
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let codeCmd = '';
    let realId = cmdId;
    this.listeCommandesSite.update(list => list.map(c => {
      if (c.id === cmdId || c.codeCommande === cmdId) {
        codeCmd = c.codeCommande;
        realId = c.id;
        return { ...c, statut: 'SCANNE' as StatutCommandeSite, scanneAt: heure };
      }
      return c;
    }));
    this.historiqueCommandes.update(list => list.map(h =>
      (h.id === cmdId || (codeCmd && h.id === codeCmd))
        ? { ...h, statut: 'EN_PREPARATION' as const }
        : h
    ));
    this.api.scannerCommande(codeCmd || realId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeCommandesSite.update(list =>
            list.map(c => (c.id === realId || c.codeCommande === codeCmd || c.id === res.data.id) ? res.data : c)
          );
          this.syncHistoriqueFromCommandesSite(this.listeCommandesSite());
        }
      },
      error: () => {}
    });
  }

  scannerParQrOuCode(codeOrId: string): boolean {
    const clean = (codeOrId || '').trim().toLowerCase();
    if (!clean) return false;
    const match = this.listeCommandesSite().find(c =>
      c.id.toLowerCase() === clean ||
      c.codeCommande.toLowerCase() === clean ||
      (c.statut === 'EN_COURS' && clean.includes(c.matricule.toLowerCase()))
    );
    if (match) {
      this.scannerCommandeSite(match.id);
      return true;
    }
    this.historiqueCommandes.update(list => list.map(h =>
      h.id.toLowerCase() === clean ? { ...h, statut: 'EN_PREPARATION' as const } : h
    ));
    return false;
  }

  // Marquer une commande comme livrée
  marquerCommandeLivree(cmdId: string) {
    this.lastMutationAt = Date.now();
    const now = new Date();
    const heure = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    let codeCmd = '';
    let realId = cmdId;
    this.listeCommandesSite.update(list => list.map(c => {
      if (c.id === cmdId || c.codeCommande === cmdId) {
        codeCmd = c.codeCommande;
        realId = c.id;
        return { ...c, statut: 'LIVRE' as StatutCommandeSite, livreAt: heure };
      }
      return c;
    }));
    this.historiqueCommandes.update(list => list.map(h =>
      (h.id === cmdId || (codeCmd && h.id === codeCmd))
        ? { ...h, statut: 'LIVRE' as const }
        : h
    ));
    this.api.livrerCommande(codeCmd || realId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeCommandesSite.update(list =>
            list.map(c => (c.id === realId || c.codeCommande === codeCmd || c.id === res.data.id) ? res.data : c)
          );
          this.syncHistoriqueFromCommandesSite(this.listeCommandesSite());
        }
      },
      error: () => {}
    });
  }

  // Mettre à jour la quantité d'un plat dans un jour planifié
  updateQuantitePlatMenu(menuJourId: string, ligneId: string, quantite: number, subventionnesCount: number) {
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    const sessionNom = (this.currentSession()?.nomComplet || '').trim().toLowerCase();
    return this.listeReclamations().some(r => 
      (r.employeId === employeId || (!!sessionNom && (r.employeNom || '').trim().toLowerCase() === sessionNom)) && 
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

    // Date ISO correspondant au jour sélectionné dans la semaine courante
    const joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const now = new Date();
    const todayIdx = (now.getDay() + 6) % 7;
    const targetIdx = Math.max(0, joursOrdre.indexOf(jourNom));
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - todayIdx + targetIdx);
    const targetDateIso = targetDate.toISOString().slice(0, 10);

    // Commandes passées pour ce plat sur ce jour (en prenant en compte les commandes groupées "(xN)")
    const nomPlat = (ligne?.nomPlat || '').trim().toLowerCase();
    const commandesCount = nomPlat
      ? this.listeCommandesSite()
          .filter(c =>
            c.entrepriseId === entId &&
            (!c.date || c.date === targetDateIso || c.date === menuJour?.dateStr) &&
            (c.platNom || '').toLowerCase().includes(nomPlat)
          )
          .reduce((sum, c) => {
            const matchMult = (c.platNom || '').match(/\(x(\d+)\)/i);
            const qte = matchMult ? Math.max(1, parseInt(matchMult[1], 10) || 1) : 1;
            return sum + qte;
          }, 0)
      : 0;

    const dejaCommande = commandesCount;
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
    this.lastMutationAt = Date.now();
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
    this.lastMutationAt = Date.now();
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
    date?: string;
    matricule?: string;
    employeNom?: string;
    tauxSubvention?: number;
  }) {
    const emp = this.currentEmploye();
    const ent = this.currentEntreprise();
    const site = this.siteActuel();
    const now = new Date();
    const dateStr = payload.date || now.toISOString().slice(0, 10);
    const heureStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const matriculeFinal = payload.matricule || emp.matricule;
    const employeNomFinal = payload.employeNom || `${emp.prenom} ${emp.nom}`;
    const tauxFinal = payload.tauxSubvention ?? emp.tauxSubvention;
    const nouvelleCmd: CommandeEntrepriseSite = {
      id: 'cmd-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      codeCommande: payload.codeCommande,
      entrepriseId: ent.id || 'ent-001',
      entrepriseNom: ent.nom || 'TotalEnergies — Siège Plateau',
      matricule: matriculeFinal,
      employeNom: employeNomFinal,
      categorie: payload.categorie,
      platNom: payload.platNom,
      date: dateStr,
      heure: heureStr,
      montantTotal: payload.montantTotal,
      partEntreprise: payload.partEntreprise,
      partEmploye: payload.partEmploye,
      statut: 'EN_COURS'
    };

    this.listeCommandesSite.update(list => {
      const idx = list.findIndex(c => c.codeCommande === payload.codeCommande);
      if (idx >= 0) {
        return list.map((c, i) => i === idx ? { ...c, platNom: payload.platNom, montantTotal: payload.montantTotal, partEntreprise: payload.partEntreprise, partEmploye: payload.partEmploye } : c);
      }
      return [nouvelleCmd, ...list];
    });
    this.historiqueCommandes.update(list => {
      const entry = {
        id: payload.codeCommande,
        date: dateStr,
        heure: heureStr,
        matricule: matriculeFinal,
        employeNom: employeNomFinal,
        siteId: site?.id || 'site-1',
        siteNom: site?.nom || 'Siège Plateau - Dakar',
        formuleNom: this.modeProfil() === 'AUTONOME' ? 'Panier Libre Autonome' : this.formuleActuelle().nom,
        platNom: payload.platNom,
        prixTotal: payload.montantTotal,
        partEntreprise: payload.partEntreprise,
        partEmploye: payload.partEmploye,
        tauxSubventionApplique: tauxFinal,
        statut: 'VALIDE' as const
      };
      const idx = list.findIndex(h => h.id === payload.codeCommande);
      if (idx >= 0) {
        return list.map((h, i) => i === idx ? entry : h);
      }
      return [entry, ...list];
    });

    this.lastMutationAt = Date.now();
    this.api.createCommande({
      ...nouvelleCmd,
      ...(payload.qrCode ? { qrCode: payload.qrCode } : {})
    } as any).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.listeCommandesSite.update(list => list.map(c => c.id === nouvelleCmd.id ? res.data : c));
          this.syncHistoriqueFromCommandesSite(this.listeCommandesSite());
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
  historiqueCommandes = signal<CommandeHistoriqueB2B[]>([]);

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
    const fromFact = this.lignesFacturationEntreprise().reduce((sum, l) => sum + (l.nbPlatsLivres || 0), 0);
    if (fromFact > 0) return fromFact;
    return this.listeCommandesSite().length;
  });

  totalFactureMois = computed(() => {
    const fromFact = this.lignesFacturationEntreprise().reduce((sum, l) => sum + (l.montantPartEntreprise || l.montantTotal || 0), 0);
    if (fromFact > 0) return fromFact;
    return this.listeCommandesSite().reduce((sum, c) => sum + (c.partEntreprise || c.montantTotal || 0), 0);
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
    this.lastMutationAt = Date.now();
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
    this.resolveActiveEntreprise(this.listeEntreprises());
    if (session.role === 'SALARIE_CONVENTIONNE') {
      this.setModeProfil('SUBVENTIONNE');
    } else if (session.role === 'SALARIE_AUTONOME') {
      this.setModeProfil('AUTONOME');
    } else {
      this.resolveCurrentEmployeFromSession();
    }
  }

  // ACTIONS PANIER AUTONOME (Employé non pris en charge / Wave direct)
  setModeProfil(mode: 'SUBVENTIONNE' | 'AUTONOME') {
    this.modeProfil.set(mode);
    this.resolveCurrentEmployeFromSession();
  }

  // Mettre à jour le taux de subvention d'un collaborateur
  setTauxSubventionEmploye(empId: string, nouveauTaux: number) {
    this.lastMutationAt = Date.now();
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
