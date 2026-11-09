import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bNavComponent } from '../shared/b2b-nav.component';
import { B2bStateService } from '../shared/b2b-state.service';
import { EntrepriseB2B, SiteB2B, PlatB2B } from '../shared/b2b.models';

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

  // Filtres Entreprises
  searchEntreprise = signal<string>('');
  filtreArchiveEntreprise = signal<'TOUTES' | 'ACTIVES' | 'ARCHIVEES'>('ACTIVES');

  entreprisesFiltrees = computed(() => {
    const q = this.searchEntreprise().toLowerCase().trim();
    const filtre = this.filtreArchiveEntreprise();

    return this.b2b.listeEntreprises().filter(ent => {
      const matchQ = !q || ent.nom.toLowerCase().includes(q) || ent.codeEntreprise.toLowerCase().includes(q);
      const matchArchive = filtre === 'TOUTES' ? true : filtre === 'ACTIVES' ? !ent.isArchivee : ent.isArchivee;
      return matchQ && matchArchive;
    });
  });

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
    cadenceFacturation: 'MENSUELLE'
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
    telephoneReferent: '+221 '
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

  // Filtre Catalogue
  filtreCategorieCatalogue = signal<'TOUS' | 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON'>('TOUS');
  filtreArchivePlat = signal<'TOUS' | 'ACTIFS' | 'ARCHIVES'>('ACTIFS');

  platsFiltres = computed(() => {
    const cat = this.filtreCategorieCatalogue();
    const arch = this.filtreArchivePlat();

    return this.b2b.catalogueJour().filter(p => {
      const matchCat = cat === 'TOUS' || p.categorie === cat;
      const matchArch = arch === 'TOUS' ? true : arch === 'ACTIFS' ? !p.isArchive : p.isArchive;
      return matchCat && matchArch;
    });
  });

  // Planning Global de Supervision
  planningSemaineGlobal = signal([
    { id: 'sem-1', jour: 'Lundi', date: '03 Nov', cadence: 'HEBDO', theme: 'Tradition Sénégalaise', platVedette: 'Thiéboudienne Penda Mbaye / Poulet Yassa Braisé', sitesCouverts: 6, totalPrevu: 410, statut: 'CLOTURE' },
    { id: 'sem-2', jour: 'Mardi (Aujourd\'hui)', date: '04 Nov', cadence: 'HEBDO', theme: 'Grillades & Fraîcheur Dakaroise', platVedette: 'Poulet Yassa Braisé / Capitaine au Feu de Bois', sitesCouverts: 6, totalPrevu: 440, statut: 'EN_PRODUCTION' },
    { id: 'sem-3', jour: 'Mercredi', date: '05 Nov', cadence: 'HEBDO', theme: 'Saveurs de l\'Atlantique', platVedette: 'Filet de Mérou Sauce Tomate Épicée / Riz Jasmin', sitesCouverts: 6, totalPrevu: 390, statut: 'VALIDE' },
    { id: 'sem-4', jour: 'Jeudi', date: '06 Nov', cadence: 'HEBDO', theme: 'Spécial Teranga & Rôtisserie', platVedette: 'Mafé de Bœuf Mijoté / Cuisse de Pintade', sitesCouverts: 6, totalPrevu: 430, statut: 'PROGRAMME' },
    { id: 'sem-5', jour: 'Vendredi', date: '07 Nov', cadence: 'HEBDO', theme: 'Street Food Gourmet Sénégalais', platVedette: 'Dibi d\'Agneau Kiki & Frites de Patate Douce', sitesCouverts: 6, totalPrevu: 470, statut: 'PROGRAMME' }
  ]);

  // Modal Planning Supervision
  showModalPlanning = signal<boolean>(false);
  planningEnEdition = signal<any>(null);

  // Stats Globales Super Admin
  totalSitesActifs = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.sites ? e.sites.length : 0), 0);
  });

  totalPlatsCatalogue = computed(() => this.b2b.catalogueJour().length);

  totalVolumeMensuelPrevu = computed(() => {
    return this.b2b.listeEntreprises().reduce((acc, e) => acc + (e.budgetMensuelAlloue || 0), 0);
  });

  // ACTIONS ENTREPRISE
  ouvrirModalNouvelleEntreprise() {
    this.isEditModeEntreprise.set(false);
    this.entrepriseEnEdition.set({
      nom: '',
      codeEntreprise: 'ENT-' + Math.floor(100 + Math.random() * 900),
      ninea: '',
      emailContact: '',
      telephone: '+221 ',
      tauxPriseEnCharge: 100,
      plafondJournalier: 5000,
      budgetMensuelAlloue: 12000000,
      tarifNegocieHtva: 4500,
      cadenceFacturation: 'MENSUELLE'
    });
    this.showModalEntreprise.set(true);
  }

  ouvrirModalModifierEntreprise(ent: EntrepriseB2B) {
    this.isEditModeEntreprise.set(true);
    this.entrepriseEnEdition.set({ ...ent });
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
        isArchivee: false
      });
    }
    this.showModalEntreprise.set(false);
  }

  // ACTIONS SITES
  ouvrirModalAjoutSite(entrepriseId: string) {
    this.entrepriseCibleSiteId.set(entrepriseId);
    this.isEditModeSite.set(false);
    this.siteEnEdition.set({
      nom: '',
      adresse: '',
      heureCutOff: '10:30',
      contactReferent: '',
      telephoneReferent: '+221 '
    });
    this.showModalSite.set(true);
  }

  ouvrirModalModifierSite(entrepriseId: string, site: SiteB2B) {
    this.entrepriseCibleSiteId.set(entrepriseId);
    this.isEditModeSite.set(true);
    this.siteIdEnEdition.set(site.id);
    this.siteEnEdition.set({ ...site });
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
  ouvrirModalEditPlanningGlobal(item: any) {
    this.planningEnEdition.set({ ...item });
    this.showModalPlanning.set(true);
  }

  enregistrerPlanningGlobal() {
    const edit = this.planningEnEdition();
    if (edit) {
      this.planningSemaineGlobal.update(list => list.map(item => item.id === edit.id ? { ...item, ...edit } : item));
      this.showModalPlanning.set(false);
    }
  }
}

