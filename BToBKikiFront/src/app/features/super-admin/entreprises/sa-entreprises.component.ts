import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SaTopbarComponent } from '../sa-topbar.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { EntrepriseB2B, SiteB2B, TypePrestationB2B, CategoriePlatB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-sa-entreprises',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SaTopbarComponent],
  templateUrl: './sa-entreprises.component.html',
  styleUrls: ['../super-admin-shared.css']
})
export class SaEntreprisesComponent {
  b2b = inject(B2bStateService);

  constructor() {
    if (this.b2b.currentSession().role !== 'SUPER_ADMIN') {
      this.b2b.setSessionRole({
        role: 'SUPER_ADMIN', nomComplet: 'Direction Kiki Traiteur', titrePoste: 'Super Admin Kiki (Global)',
        entite: 'Kiki Traiteur B2B', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar',
        badge: 'Direction Générale', badgeColor: '#721513'
      });
    }
  }

  entreprisesSubTab = signal<'ENTREPRISES' | 'PRESTATIONS'>('ENTREPRISES');
  showModalAjoutPrestation = signal<boolean>(false);
  showModalAjoutCategorie = signal<boolean>(false);
  searchEntreprise = signal<string>('');
  filtreArchiveEntreprise = signal<'TOUTES' | 'ACTIVES' | 'ARCHIVEES'>('ACTIVES');
  pageEntreprises = signal<number>(1);
  pageSizeEntreprises = signal<number>(3);

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

  // Modal Nouvelle / Modification Entreprise
  showModalEntreprise = signal<boolean>(false);
  etapeEntreprise = signal<1 | 2 | 3>(1);
  entrepriseEnEdition = signal<Partial<EntrepriseB2B>>({
    nom: '',
    codeEntreprise: '',
    ninea: '',
    rccm: '',
    adresse: '',
    emailContact: '',
    telephone: '+221 ',
    contactReferent: '',
    montantPriseEnChargeRepas: 5000,
    cutOffType: 'J_MOINS_1',
    cutOffHeure: '18:00',
    cadenceFacturation: 'MENSUELLE',
    typePrestation: 'CUISINE_SUR_PLACE',
    categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
  });
  isEditModeEntreprise = signal<boolean>(false);

  // Modal Paramètres (Types de prestation et Catégories personnalisables)
  showModalParametres = signal<boolean>(false);
  nouveauTypePrestation = signal<{ code: string; libelle: string; desc: string }>({
    code: '',
    libelle: '',
    desc: ''
  });
  nouvelleCategorie = signal<{ code: string; libelle: string; icone: string; couleur: string }>({
    code: '',
    libelle: '',
    icone: 'fa-utensils',
    couleur: '#721513'
  });

  // Modal Nouveau Site (maintenu si besoin pour rétrocompatibilité)
  showModalSite = signal<boolean>(false);
  entrepriseCibleSiteId = signal<string>('');
  siteEnEdition = signal<Partial<SiteB2B>>({
    nom: '',
    adresse: '',
    heureCutOff: '10:30',
    contactReferent: '',
    telephoneReferent: '+221 ',
    typePrestation: 'CUISINE_SUR_PLACE',
    categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
  });
  isEditModeSite = signal<boolean>(false);
  siteIdEnEdition = signal<string>('');

  // Modal Catalogue (Plat)
  onTypePrestationEntrepriseChange(type: string) {
    const trouv = this.b2b.typesPrestationConfigurables().find(t => t.code === type);
    if (trouv) {
      this.entrepriseEnEdition.update(e => ({
        ...e,
        typePrestation: type,
        categoriesAutorisees: [...trouv.categoriesDefaut]
      }));
    } else {
      this.entrepriseEnEdition.update(e => ({ ...e, typePrestation: type }));
    }
  }

  toggleCategorieEntreprise(cat: string) {
    this.entrepriseEnEdition.update(e => {
      const actuelles: string[] = e.categoriesAutorisees ? [...e.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];
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

  isCategorieEntrepriseActive(cat: string): boolean {
    const cats = this.entrepriseEnEdition().categoriesAutorisees;
    return !!cats?.includes(cat);
  }

  getLibellePrestation(code?: string): string {
    const trouv = this.b2b.typesPrestationConfigurables().find(t => t.code === code);
    return trouv ? trouv.libelle : (code || 'Service de Restauration B2B');
  }

  getLibelleCutOff(ent: Partial<EntrepriseB2B>): string {
    if (!ent.cutOffType) return ent.cutOffHeure || '18:00 (J-1)';
    const prefix = ent.cutOffType === 'J_MOINS_1' ? 'J - 1 (Veille)' : 'Jour J (Jour même)';
    return `${prefix} à ${ent.cutOffHeure || '18:00'}`;
  }

  // PARAMÈTRES PERSONNALISABLES
  ouvrirModalParametres() {
    this.nouveauTypePrestation.set({ code: '', libelle: '', desc: '' });
    this.nouvelleCategorie.set({ code: '', libelle: '', icone: 'fa-utensils', couleur: '#721513' });
    this.showModalParametres.set(true);
  }

  creerNouveauTypePrestation() {
    const tp = this.nouveauTypePrestation();
    if (!tp.libelle) {
      alert('Veuillez renseigner un libellé pour la prestation.');
      return;
    }
    const code = tp.code || tp.libelle.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    this.b2b.ajouterTypePrestation({
      code,
      libelle: tp.libelle,
      desc: tp.desc || 'Prestation sur mesure Kiki Traiteur',
      categoriesDefaut: ['PLAT', 'BOISSON']
    });
    this.nouveauTypePrestation.set({ code: '', libelle: '', desc: '' });
    this.showModalAjoutPrestation.set(false);
  }

  private deduireIconeCategorie(libelle: string): string {
    const l = libelle
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (/(boisson|jus|eau|soda|bissap|bouye|gingembre|cocktails?)/.test(l)) return 'fa-wine-glass';
    if (/(cafe|the|infusion|chocolat chaud|petit.?dejeuner)/.test(l)) return 'fa-mug-hot';
    if (/(dessert|gateau|tarte|glace|mousse|douceur|sucre)/.test(l)) return 'fa-cake-candles';
    if (/(gouter|snack|patisser|croissant|viennoiser|cookie|biscuit|beignet|pastel)/.test(l)) return 'fa-cookie-bite';
    if (/(entree|salade|crudite|legume|vegan|vegetarien)/.test(l)) return 'fa-leaf';
    if (/(soupe|potage|veloute|bouillon)/.test(l)) return 'fa-bowl-food';
    if (/(fruit|mangue|ananas|pasteque|pomme|banane)/.test(l)) return 'fa-apple-whole';
    if (/(poisson|thieb|merou|capitaine|crevette|fruit.?de.?mer)/.test(l)) return 'fa-fish';
    if (/(poulet|volaille|yassa|rotisserie|dibi|viande|boeuf|agneau|grill)/.test(l)) return 'fa-drumstick-bite';
    if (/(sandwich|burger|tacos|wrap|panini)/.test(l)) return 'fa-burger';
    if (/(pizza|tarte salee|quiche)/.test(l)) return 'fa-pizza-slice';
    if (/(fromage|yaourt|laitier)/.test(l)) return 'fa-cheese';
    if (/(garniture|accompagnement|riz|frite|alloco|attieke|couscous)/.test(l)) return 'fa-bowl-rice';
    return 'fa-utensils';
  }

  creerNouvelleCategorie() {
    const cat = this.nouvelleCategorie();
    if (!cat.libelle) {
      alert('Veuillez renseigner un libellé pour la catégorie.');
      return;
    }
    const code = cat.code || cat.libelle.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const icone = this.deduireIconeCategorie(cat.libelle);
    this.b2b.ajouterCategorie({
      code,
      libelle: cat.libelle,
      icone,
      couleur: cat.couleur || '#721513'
    });
    this.nouvelleCategorie.set({ code: '', libelle: '', icone: 'fa-utensils', couleur: '#721513' });
    this.showModalAjoutCategorie.set(false);
  }

  // ACTIONS ENTREPRISE (1 Site = 1 Entreprise)
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
      rccm: '',
      adresse: '',
      emailContact: '',
      telephone: '+221 ',
      contactReferent: '',
      montantPriseEnChargeRepas: 5000,
      cutOffType: 'J_MOINS_1',
      cutOffHeure: '18:00',
      cadenceFacturation: 'MENSUELLE',
      typePrestation: 'CUISINE_SUR_PLACE',
      categoriesAutorisees: ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.etapeEntreprise.set(1);
    this.adminsCreation.set({ rhNomComplet: '', rhEmail: '', siteNomComplet: '', siteEmail: '' });
    this.showModalEntreprise.set(true);
  }

  ouvrirModalModifierEntreprise(ent: EntrepriseB2B) {
    this.isEditModeEntreprise.set(true);
    this.entrepriseEnEdition.set({
      ...ent,
      rccm: ent.rccm || '',
      adresse: ent.adresse || (ent.sites && ent.sites[0] ? ent.sites[0].adresse : ''),
      contactReferent: ent.contactReferent || (ent.sites && ent.sites[0] ? ent.sites[0].contactReferent : ''),
      montantPriseEnChargeRepas: ent.montantPriseEnChargeRepas || 5000,
      cutOffType: ent.cutOffType || 'J_MOINS_1',
      cutOffHeure: ent.cutOffHeure || '18:00',
      typePrestation: ent.typePrestation || 'CUISINE_SUR_PLACE',
      categoriesAutorisees: ent.categoriesAutorisees ? [...ent.categoriesAutorisees] : ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
    });
    this.etapeEntreprise.set(1);
    this.adminsCreation.set({ rhNomComplet: '', rhEmail: '', siteNomComplet: '', siteEmail: '' });
    this.showModalEntreprise.set(true);
  }

  readonly REGEX_TEL_SN = /^(?:\+221|00221)?[\s.-]?(?:7[05678]|3[03])(?:[\s.-]?\d){7}$/;
  readonly REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  readonly REGEX_NINEA = /^[0-9]{7,10}(?:\s?[0-9A-Z]{2,3})?$/i;
  readonly REGEX_RCCM = /^SN[-.\s]?[A-Z]{2,4}[-.\s]?(?:\d{4}[-.\s]?[A-Z][-.\s]?)?\d{2,6}$/i;

  adminsCreation = signal({
    rhNomComplet: '',
    rhEmail: '',
    siteNomComplet: '',
    siteEmail: ''
  });

  erreursEtape1 = signal<{ nom?: string; ninea?: string; rccm?: string; email?: string; telephone?: string }>({});

  validerEtape1(): boolean {
    const val = this.entrepriseEnEdition();
    const errs: { nom?: string; ninea?: string; rccm?: string; email?: string; telephone?: string } = {};

    if (!val.nom || !val.nom.trim()) {
      errs.nom = 'La raison sociale est obligatoire.';
    }
    if (val.ninea && val.ninea.trim() && !this.REGEX_NINEA.test(val.ninea.trim())) {
      errs.ninea = 'Format NINEA invalide (ex: 001294829 2V1).';
    }
    if (val.rccm && val.rccm.trim() && !this.REGEX_RCCM.test(val.rccm.trim())) {
      errs.rccm = 'Format RCCM sénégalais invalide (ex: SN-DKR-2012-B-1428).';
    }
    if (val.emailContact && val.emailContact.trim() && !this.REGEX_EMAIL.test(val.emailContact.trim())) {
      errs.email = 'Adresse email invalide (ex: rh@entreprise.sn).';
    }
    if (val.telephone && val.telephone.trim() && val.telephone.trim() !== '+221' && !this.REGEX_TEL_SN.test(val.telephone.trim())) {
      errs.telephone = 'Numéro sénégalais invalide (ex: +221 77 123 45 67).';
    }

    this.erreursEtape1.set(errs);
    return Object.keys(errs).length === 0;
  }

  onTelephoneChange(value: string) {
    let digits = (value || '').replace(/\D/g, '');
    if (digits.startsWith('00221')) digits = digits.slice(5);
    else if (digits.startsWith('221')) digits = digits.slice(3);
    digits = digits.slice(0, 9);

    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 7));
    if (digits.length > 7) parts.push(digits.slice(7, 9));

    const formatted = parts.length > 0 ? `+221 ${parts.join(' ')}` : '+221 ';
    this.entrepriseEnEdition.update(e => ({ ...e, telephone: formatted }));
  }

  allerEtape2() {
    if (this.validerEtape1()) {
      this.etapeEntreprise.set(2);
    }
  }

  enregistrerEntreprise() {
    if (!this.validerEtape1()) return;
    const val = this.entrepriseEnEdition();

    if (this.isEditModeEntreprise() && val.id) {
      this.b2b.modifierEntreprise(val.id, {
        ...val,
        sites: [
          {
            id: 'site-' + val.id,
            nom: val.nom!,
            adresse: val.adresse || 'Dakar',
            heureCutOff: `${val.cutOffHeure || '18:00'} (${val.cutOffType === 'JOUR_J' ? 'Jour J' : 'J-1'})`,
            contactReferent: val.contactReferent || 'Contact RH',
            telephoneReferent: val.telephone || '+221',
            typePrestation: val.typePrestation || 'CUISINE_SUR_PLACE',
            categoriesAutorisees: val.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON']
          }
        ]
      });
    } else {
      const adm = this.adminsCreation();
      const adminsToInvite: Array<{ email: string; nomComplet: string; role: 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI' }> = [];

      if (adm.rhEmail.trim() || adm.rhNomComplet.trim()) {
        if (!this.REGEX_EMAIL.test(adm.rhEmail.trim())) {
          alert("Adresse email invalide pour l'Admin Entreprise (RH).");
          return;
        }
        adminsToInvite.push({
          email: adm.rhEmail.trim(),
          nomComplet: adm.rhNomComplet.trim() || val.contactReferent?.trim() || 'Admin Entreprise RH',
          role: 'RESPONSABLE_ENTREPRISE'
        });
      }

      if (adm.siteEmail.trim() || adm.siteNomComplet.trim()) {
        if (!this.REGEX_EMAIL.test(adm.siteEmail.trim())) {
          alert("Adresse email invalide pour l'Admin Site Kiki.");
          return;
        }
        adminsToInvite.push({
          email: adm.siteEmail.trim(),
          nomComplet: adm.siteNomComplet.trim() || 'Responsable de Site Kiki',
          role: 'RESPONSABLE_SITE_KIKI'
        });
      }

      this.b2b.ajouterEntreprise({
        nom: val.nom!,
        codeEntreprise: val.codeEntreprise!,
        ninea: val.ninea || '',
        rccm: val.rccm || '',
        adresse: val.adresse || '',
        emailContact: val.emailContact || '',
        telephone: val.telephone || '',
        contactReferent: val.contactReferent || '',
        montantPriseEnChargeRepas: val.montantPriseEnChargeRepas || 5000,
        tauxPriseEnCharge: 100,
        plafondJournalier: val.montantPriseEnChargeRepas || 5000,
        budgetMensuelAlloue: 15000000,
        tarifNegocieHtva: val.montantPriseEnChargeRepas || 5000,
        cadenceFacturation: val.cadenceFacturation || 'MENSUELLE',
        cutOffType: val.cutOffType || 'J_MOINS_1',
        cutOffHeure: val.cutOffHeure || '18:00',
        typePrestation: val.typePrestation || 'CUISINE_SUR_PLACE',
        categoriesAutorisees: val.categoriesAutorisees || ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'],
        isArchivee: false
      }, adminsToInvite);
      if (adminsToInvite.length > 0) {
        this.b2b.showToast(`Entreprise créée et ${adminsToInvite.length} invitation(s) en cours d'envoi par email.`);
      } else {
        this.b2b.showToast('Entreprise créée avec succès.');
      }
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
  private readonly joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
  private readonly todayIndexSa = (new Date().getDay() + 6) % 7;
  jourPlanningGlobalActif = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>(
    this.joursOrdre[this.todayIndexSa]
  );
  weekOffsetSa = signal<number>(0);

  changerSemaineSa(delta: number): void {
    this.weekOffsetSa.update(w => w + delta);
  }

  semaineLabelSa = computed(() => {
    const offset = this.weekOffsetSa();
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - this.todayIndexSa + offset * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const deb = `${String(monday.getDate()).padStart(2, '0')} ${moisCourts[monday.getMonth()]}`;
    const fin = `${String(sunday.getDate()).padStart(2, '0')} ${moisCourts[sunday.getMonth()]}`;
    return offset === 0 ? `Semaine en cours (${deb} - ${fin})` : `Semaine du ${deb} au ${fin}`;
  });

  datesSemaineMapSa = computed(() => {
    const offset = this.weekOffsetSa();
    const now = new Date();
    const monday = new Date(now);
    monday.setDate(now.getDate() - this.todayIndexSa + offset * 7);
    const moisCourts = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const map: Record<string, string> = {};
    this.joursOrdre.forEach((jour, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const label = `${String(d.getDate()).padStart(2, '0')} ${moisCourts[d.getMonth()]}`;
      map[jour] = offset === 0 && idx === this.todayIndexSa ? `${label} (Auj.)` : label;
    });
    return map;
  });
  facturationJourSelectionne = signal<{ date: string; dateAffichee: string; nbPlatsLivres: number; montantTotal: number; montantPartEntreprise: number } | null>(null);

  detailsCommandesJourSelectionne = computed(() => {
    const jour = this.facturationJourSelectionne();
    if (!jour) return [];
    return this.b2b.historiqueCommandes()
      .filter(c => c.date === jour.date)
      .map(c => ({
        ...c,
        tauxApplique: c.tauxSubventionApplique ?? Math.round((c.partEntreprise / (c.prixTotal || 1)) * 100)
      }));
  });
  entrepriseEnGestion = signal<EntrepriseB2B | null>(null);
  gererActiveTab = signal<'INFOS' | 'UTILISATEURS' | 'MENU' | 'COMMANDES' | 'FACTURATION'>('INFOS');

  // Onglet 2 : Utilisateurs
  modalNouvelEmploye = signal<boolean>(false);
  employeEnCreation = signal({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    departement: 'Opérations',
    tauxSubvention: 100
  });

  modalInvitationAdmin = signal<boolean>(false);
  invitationEnCreation = signal({
    nomComplet: '',
    email: '',
    role: 'RESPONSABLE_ENTREPRISE' as 'RESPONSABLE_ENTREPRISE' | 'RESPONSABLE_SITE_KIKI'
  });
  invitationGenereeLien = signal<string | null>(null);

  // Onglet 3 : Menu Planifié
  jourMenuActif = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>(
    this.joursOrdre[this.todayIndexSa]
  );
  modalDupliquerMenu = signal<boolean>(false);
  jourCibleDuplication = signal<'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche'>('Mercredi');

  // Onglet 4 : Commandes
  dateDebutCommandes = signal<string>((() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; })());
  dateFinCommandes = signal<string>(new Date().toISOString().split('T')[0]);
  filtreStatutCommande = signal<'TOUS' | 'EN_COURS' | 'SCANNE' | 'LIVRE'>('TOUS');
  filtreCategorieCommande = signal<string>('TOUTES');
  filtrePlatCommande = signal<string>('TOUS');

  // Onglet 5 : Facturation
  dateDebutFacturation = signal<string>('2026-11-01');
  dateFinFacturation = signal<string>('2026-11-30');

  // Méthodes pour ouvrir / fermer la gestion de l'entreprise
  ouvrirGestionEntreprise(ent: EntrepriseB2B) {
    this.entrepriseEnGestion.set(ent);
    this.gererActiveTab.set('INFOS');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  fermerGestionEntreprise() {
    this.entrepriseEnGestion.set(null);
  }

  // Effectif des employés subventionnés (taux > 0%) de l'entreprise en gestion
  nbEmployesSubventionnesEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return 0;
    return this.employesEntrepriseEnGestion().filter(e => e.tauxSubvention > 0).length;
  });

  // Employés de l'entreprise en gestion (filtrés strictement par entreprise)
  employesEntrepriseEnGestion = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return [];
    return this.b2b.listeEmployes().filter(e => {
      const empEntId = (e as any).entrepriseId;
      if (empEntId) return empEntId === ent.id;
      return ent.id === 'ent-001' ? (e.siteId === 'site-1' || !e.siteId) : e.siteId === ent.id;
    });
  });

  // Invitations pour l'entreprise en gestion
  invitationsEntrepriseEnGestion = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return [];
    return this.b2b.listeInvitationsAdmins().filter(inv => inv.entrepriseId === ent.id);
  });

  // Menu du jour actif pour l'entreprise en gestion
  menuJourActifEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    const jour = this.jourMenuActif();
    if (!ent) return null;
    const menu = this.b2b.menusPlanifiesEntreprises().find(m => m.entrepriseId === ent.id && m.jourNom === jour) || null;
    if (!menu) return null;
    const archivedIds = new Set(this.b2b.catalogueJour().filter(p => !!p.isArchive).map(p => p.id));
    return {
      ...menu,
      lignes: menu.lignes.filter(l => !archivedIds.has(l.platId))
    };
  });

  // Catégories autorisées pour l'entreprise en gestion
  categoriesAutoriseesEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent || !ent.categoriesAutorisees) return ['ENTREE', 'PLAT', 'DESSERT', 'BOISSON'];
    return ent.categoriesAutorisees;
  });

  // Lignes de menu filtrées par les catégories autorisées
  lignesMenuFiltreesParCategories = computed(() => {
    const menu = this.menuJourActifEntreprise();
    const catsAutorisees = this.categoriesAutoriseesEntreprise();
    if (!menu) return [];
    return menu.lignes.filter(l => catsAutorisees.includes(l.categorie));
  });

  // Statut de conformité du jour actif (Total prévu par catégorie >= nb employés subventionnés)
  statutConformiteJourActif = computed(() => {
    const lignes = this.lignesMenuFiltreesParCategories();
    const subventionnesCount = this.nbEmployesSubventionnesEntreprise();
    if (lignes.length === 0) return { statut: 'NON_SAISI', message: 'Aucun plat planifié pour ce jour' };

    const totalQuantites = lignes.reduce((s, l) => s + (l.quantitePrevue || 0), 0);
    if (totalQuantites === 0) {
      return { statut: 'NON_SAISI', message: 'Quantités non renseignées (menu non affiché aux collaborateurs)' };
    }

    const categories = Array.from(new Set(lignes.map(l => l.categorie)));
    for (const cat of categories) {
      const somme = lignes.filter(l => l.categorie === cat).reduce((s, l) => s + (l.quantitePrevue || 0), 0);
      if (somme < subventionnesCount) {
        return {
          statut: 'NON_CONFORME',
          message: `Non conforme : seulement ${somme} portions prévues en ${cat} pour ${subventionnesCount} employés subventionnés.`
        };
      }
    }

    return {
      statut: 'CONFORME',
      message: `Conforme : les quantités prévues (${totalQuantites} au total) couvrent l'effectif subventionné (${subventionnesCount} pers.).`
    };
  });

  // Modification quantité plat du jour
  onQuantitePlatChange(ligneId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const val = parseInt(input.value, 10) || 0;
    const menu = this.menuJourActifEntreprise();
    if (menu) {
      this.b2b.updateQuantitePlatMenu(menu.id, ligneId, val, this.nbEmployesSubventionnesEntreprise());
    }
  }

  // Duplication menu
  lancerDuplicationMenu() {
    const menu = this.menuJourActifEntreprise();
    const ent = this.entrepriseEnGestion();
    if (!menu || !ent) return;
    this.b2b.dupliquerMenuJour(menu.id, this.jourCibleDuplication(), ent.id);
    this.jourMenuActif.set(this.jourCibleDuplication());
    this.modalDupliquerMenu.set(false);
  }

  erreursEmploye = signal<{ prenom?: string; nom?: string; matricule?: string; email?: string; telephone?: string }>({});
  readonly REGEX_MATRICULE = /^[A-Z0-9-]{3,20}$/i;

  onTelephoneEmployeChange(value: string) {
    let digits = (value || '').replace(/\D/g, '');
    if (digits.startsWith('00221')) digits = digits.slice(5);
    else if (digits.startsWith('221')) digits = digits.slice(3);
    digits = digits.slice(0, 9);

    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 7));
    if (digits.length > 7) parts.push(digits.slice(7, 9));

    const formatted = parts.length > 0 ? `+221 ${parts.join(' ')}` : '+221 ';
    this.employeEnCreation.update(e => ({ ...e, telephone: formatted }));
  }

  // Création employé
  enregistrerNouvelEmploye() {
    const cur = this.employeEnCreation();
    const ent = this.entrepriseEnGestion();
    const errs: { prenom?: string; nom?: string; matricule?: string; email?: string; telephone?: string } = {};

    if (!cur.prenom || !cur.prenom.trim()) errs.prenom = 'Le prénom est obligatoire.';
    if (!cur.nom || !cur.nom.trim()) errs.nom = 'Le nom est obligatoire.';
    if (cur.matricule && cur.matricule.trim() && !this.REGEX_MATRICULE.test(cur.matricule.trim())) {
      errs.matricule = 'Format invalide (ex: TOT-1042).';
    }
    if (cur.email && cur.email.trim() && !this.REGEX_EMAIL.test(cur.email.trim())) {
      errs.email = 'Adresse email invalide.';
    }
    if (cur.telephone && cur.telephone.trim() && cur.telephone.trim() !== '+221' && !this.REGEX_TEL_SN.test(cur.telephone.trim())) {
      errs.telephone = 'Numéro sénégalais invalide (ex: +221 77 123 45 67).';
    }

    this.erreursEmploye.set(errs);
    if (Object.keys(errs).length > 0) return;

    const matricule = (cur.matricule || '').trim() || `${ent?.codeEntreprise || 'EMP'}-${Math.floor(1000 + Math.random() * 9000)}`;
    const email = (cur.email || '').trim() || `${cur.prenom!.trim().toLowerCase()}.${cur.nom!.trim().toLowerCase()}@client.sn`;
    this.b2b.ajouterEmploye({
      matricule,
      nom: cur.nom!.trim(),
      prenom: cur.prenom!.trim(),
      email,
      telephone: (cur.telephone && cur.telephone.trim() !== '+221') ? cur.telephone.trim() : '+221 77 000 00 00',
      entrepriseId: ent?.id || 'ent-001',
      siteId: ent?.id || 'site-1',
      siteNom: ent?.nom || 'Siège',
      departement: cur.departement || 'Général',
      type: cur.tauxSubvention === 0 ? 'AUTONOME' : 'SUBVENTIONNE',
      tauxSubvention: cur.tauxSubvention,
      actif: true,
      repasConsommesMois: 0,
      montantPrisEnChargeMois: 0
    } as any);
    this.erreursEmploye.set({});
    this.modalNouvelEmploye.set(false);
    this.employeEnCreation.set({ matricule: '', nom: '', prenom: '', email: '', telephone: '', departement: 'Opérations', tauxSubvention: 100 });
  }

  importerFichierEmployes() {
    const ent = this.entrepriseEnGestion();
    const code = ent?.codeEntreprise || 'TOT';
    const importes = [
      { matricule: `${code}-9850`, nom: 'Sene', prenom: 'Awa', email: `a.sene@${ent?.codeEntreprise.toLowerCase()}.sn`, telephone: '+221 77 810 20 30', departement: 'Comptabilité', tauxSubvention: 100 },
      { matricule: `${code}-9851`, nom: 'Thiam', prenom: 'Moussa', email: `m.thiam@${ent?.codeEntreprise.toLowerCase()}.sn`, telephone: '+221 78 920 30 40', departement: 'Logistique', tauxSubvention: 50 },
      { matricule: `${code}-9852`, nom: 'Gueye', prenom: 'Ndeye', email: `n.gueye@${ent?.codeEntreprise.toLowerCase()}.sn`, telephone: '+221 76 112 23 34', departement: 'Marketing', tauxSubvention: 100 },
      { matricule: `${code}-EXT-04`, nom: 'Cisse', prenom: 'Djibril (Prestataire)', email: `d.cisse@prestataire.sn`, telephone: '+221 77 444 55 66', departement: 'Sécurité Informatique', tauxSubvention: 0 }
    ];
    importes.forEach(imp => {
      this.b2b.ajouterEmploye({
        ...imp,
        siteId: ent?.id || 'site-1',
        siteNom: ent?.nom || 'Siège',
        type: imp.tauxSubvention === 0 ? 'AUTONOME' : 'SUBVENTIONNE',
        actif: true,
        repasConsommesMois: 0,
        montantPrisEnChargeMois: 0
      });
    });
    alert(`Importation réussie : ${importes.length} collaborateurs ont été ajoutés avec leurs taux de prise en charge respectifs.`);
  }

  // Création invitation admin
  lancerInvitationAdmin() {
    const cur = this.invitationEnCreation();
    const ent = this.entrepriseEnGestion();
    if (!cur.email || !cur.nomComplet) {
      alert('Veuillez renseigner le nom et l\'adresse email du gestionnaire.');
      return;
    }
    if (!ent) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';
    this.b2b.creerInvitationAdmin(cur.email, cur.nomComplet, cur.role, ent, (invSaved) => {
      const lien = `${origin}/b2b/activation?token=${encodeURIComponent(invSaved.tokenActivation)}&email=${encodeURIComponent(invSaved.email)}`;
      this.invitationGenereeLien.set(lien);
    });
  }

  fermerModalInvitation() {
    this.modalInvitationAdmin.set(false);
    this.invitationGenereeLien.set(null);
    this.invitationEnCreation.set({ nomComplet: '', email: '', role: 'RESPONSABLE_ENTREPRISE' });
  }

  copierLienActivation(lien: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(lien);
      alert('Lien d\'activation copié dans le presse-papier !');
    } else {
      prompt('Copiez ce lien d\'activation :', lien);
    }
  }

  // Commandes filtrées de l'entreprise
  commandesFiltreesEntreprise = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return [];
    let list = this.b2b.listeCommandesSite().filter(c => c.entrepriseId === ent.id);

    // Filtre période
    const debut = this.dateDebutCommandes();
    const fin = this.dateFinCommandes();
    if (debut && fin) {
      list = list.filter(c => c.date >= debut && c.date <= fin);
    }

    // Filtre statut
    const st = this.filtreStatutCommande();
    if (st !== 'TOUS') {
      list = list.filter(c => c.statut === st);
    }

    // Filtre catégorie
    const cat = this.filtreCategorieCommande();
    if (cat !== 'TOUTES') {
      list = list.filter(c => c.categorie === cat);
    }

    // Filtre plat
    const plat = this.filtrePlatCommande();
    if (plat !== 'TOUS') {
      list = list.filter(c => c.platNom === plat);
    }

    return list;
  });

  // Plats uniques dans les commandes
  platsUniquesCommandes = computed(() => {
    const cmds = this.b2b.listeCommandesSite();
    return Array.from(new Set(cmds.map(c => c.platNom)));
  });

  // Actions Statuts Commandes
  simulerScanCommande(cmdId: string) {
    this.b2b.scannerCommandeSite(cmdId);
  }

  marquerLivree(cmdId: string) {
    this.b2b.marquerCommandeLivree(cmdId);
  }

  // Facturation journalière filtrée
  lignesFacturationFiltrees = computed(() => {
    const ent = this.entrepriseEnGestion();
    if (!ent) return [];
    const debut = this.dateDebutFacturation();
    const fin = this.dateFinFacturation();
    return this.b2b.lignesFacturationEntreprise().filter(l => {
      const lEntId = (l as any).entrepriseId;
      const matchEnt = lEntId ? lEntId === ent.id : ent.id === 'ent-001';
      return matchEnt && l.date >= debut && l.date <= fin;
    });
  });

  totalFacturationPeriode = computed(() => {
    const lignes = this.lignesFacturationFiltrees();
    return lignes.reduce((acc, l) => ({
      repas: acc.repas + l.nbPlatsLivres,
      presents: acc.presents + l.nbPresents,
      montantTotal: acc.montantTotal + l.montantTotal,
      partEntreprise: acc.partEntreprise + l.montantPartEntreprise,
      partEmploye: acc.partEmploye + l.montantPartEmploye
    }), { repas: 0, presents: 0, montantTotal: 0, partEntreprise: 0, partEmploye: 0 });
  });
}


