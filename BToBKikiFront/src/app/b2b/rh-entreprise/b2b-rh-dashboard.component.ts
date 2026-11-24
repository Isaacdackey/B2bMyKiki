import { B2bNavComponent } from '../shared/b2b-nav.component';
import { B2bPeriodFilterComponent, PeriodeFilterChange, PeriodeFilterType } from '../shared/b2b-period-filter.component';
import { CountUpDirective } from '../shared/count-up.directive';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { EmployeB2B, CommandeHistoriqueB2B } from '../shared/b2b.models';

@Component({
  selector: 'app-b2b-rh-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent, B2bPeriodFilterComponent, CountUpDirective],
  templateUrl: './b2b-rh-dashboard.component.html',
  styleUrls: ['./b2b-rh-dashboard.component.css']
})
export class B2bRhDashboardComponent {
  b2b = inject(B2bStateService);

  constructor() {
    if (this.b2b.currentSession().role !== 'RESPONSABLE_ENTREPRISE') {
      this.b2b.setSessionRole({
        role: 'RESPONSABLE_ENTREPRISE',
        nomComplet: 'Mme Fatou Fall',
        titrePoste: 'Responsable RH & Moyens Généraux',
        entite: 'TotalEnergies Sénégal',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        badge: 'Responsable Entreprise',
        badgeColor: '#721513'
      });
    }
  }

  // Utilisation de la section persistée dans le service partagé pour synchronisation avec la navbar latérale
  get activeSection() {
    return this.b2b.rhActiveSection;
  }

  // FILTRES CLÉS EXIGÉS PAR LE MENTOR : DATE DÉBUT + DATE FIN (par défaut sur la journée courante)
  selectedSiteId = signal<string>('TOUS');
  dateDebut = signal<string>('2026-11-12');
  dateFin = signal<string>('2026-11-12');

  // Période active sélectionnée via composant réutilisable
  periodeActive = signal<PeriodeFilterType>('JOUR');
  tauxSubventionError = signal<string>('');

  onPeriodeRhChange(ev: PeriodeFilterChange) {
    this.periodeActive.set(ev.periode);
    this.dateDebut.set(ev.dateDebut);
    this.dateFin.set(ev.dateFin);
  }

  onPeriodeFactureRhChange(ev: PeriodeFilterChange) {
    this.factureDateDebut.set(ev.dateDebut);
    this.factureDateFin.set(ev.dateFin);
  }

  // Répartition des statuts des commandes du site sur la période (pour les graphes RH)
  rhStatsStatuts = computed(() => {
    const cmds = this.commandesSiteFiltrees();
    const total = Math.max(1, cmds.length);
    const enCours = cmds.filter(c => c.statut === 'EN_COURS').length;
    const scanne = cmds.filter(c => c.statut === 'SCANNE').length;
    const livre = cmds.filter(c => c.statut === 'LIVRE').length;
    return [
      { label: 'En cours', count: enCours, pct: Math.round((enCours / total) * 100), color: '#721513' },
      { label: 'Scannés', count: scanne, pct: Math.round((scanne / total) * 100), color: '#C05621' },
      { label: 'Livrés', count: livre, pct: Math.round((livre / total) * 100), color: '#606C38' }
    ];
  });

  rhTopPlatsEntreprise = computed(() => {
    const cmds = this.commandesSiteFiltrees();
    const counts = new Map<string, { nom: string; count: number; montant: number }>();
    for (const c of cmds) {
      const cur = counts.get(c.platNom) || { nom: c.platNom, count: 0, montant: 0 };
      cur.count += 1;
      cur.montant += c.partEntreprise || 0;
      counts.set(c.platNom, cur);
    }
    const sorted = Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 4);
    const maxCount = Math.max(1, sorted[0]?.count || 1);
    return sorted.map(item => ({ ...item, pct: Math.round((item.count / maxCount) * 100) }));
  });

  // Filtre recherche employé & filtre période récapitulatif employés
  searchQuery = signal<string>('');
  selectedSiteFilter = signal<string>('TOUS');
  employeDateDebut = signal<string>('2026-11-01');
  employeDateFin = signal<string>('2026-11-12');

  // Filtres Facturation
  factureDateDebut = signal<string>('2026-11-01');
  factureDateFin = signal<string>('2026-11-12');

  // Modal nouvel employé
  showAddEmployeeModal = signal<boolean>(false);
  newEmp = signal<Partial<EmployeB2B>>({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    siteId: 'site-1',
    departement: 'Opérations',
    type: 'SUBVENTIONNE',
    tauxSubvention: 100
  });

  // Modal Facture PDF Générée
  showFactureModal = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  exportSuccess = signal<boolean>(false);

  // Site sélectionné
  siteActif = computed(() => {
    return this.b2b.currentEntreprise().sites.find(s => s.id === this.selectedSiteId()) || this.b2b.currentEntreprise().sites[0];
  });

  // Commandes filtrées pour l'entreprise selon les 3 statuts stricts : EN_COURS -> SCANNE -> LIVRE
  commandesSiteFiltrees = computed(() => {
    const debut = this.dateDebut();
    const fin = this.dateFin();

    return this.b2b.listeCommandesSite().filter(cmd => {
      const matchDate = (!debut || cmd.date >= debut) && (!fin || cmd.date <= fin);
      return matchDate;
    });
  });

  // Facturation consolidée filtrée
  lignesFacturationFiltrees = computed(() => {
    const debut = this.factureDateDebut();
    const fin = this.factureDateFin();

    return this.b2b.lignesFacturationEntreprise().filter(ligne => {
      const matchDate = (!debut || ligne.date >= debut) && (!fin || ligne.date <= fin);
      return matchDate;
    });
  });

  totalPlatsLivresMoisEnCours = computed(() => {
    return this.b2b.lignesFacturationEntreprise().reduce((acc, l) => acc + l.nbPlatsLivres, 0);
  });

  totalMontantFactureMoisEnCours = computed(() => {
    return this.b2b.lignesFacturationEntreprise().reduce((acc, l) => acc + l.montantTotal, 0);
  });

  totalMontantEntrepriseMoisEnCours = computed(() => {
    return this.b2b.lignesFacturationEntreprise().reduce((acc, l) => acc + l.montantPartEntreprise, 0);
  });

  // Employés pris en charge (taux subvention > 0)
  employesPrisEnChargeCount = computed(() => {
    return this.b2b.listeEmployes().filter(e => e.tauxSubvention > 0).length;
  });

  // Consommation journalière calculée pour la journée
  consommationJournaliereRepas = computed(() => {
    const today = this.dateDebut();
    return this.b2b.listeCommandesSite().filter(c => c.date === today).length;
  });

  consommationJournaliereMontant = computed(() => {
    const today = this.dateDebut();
    return this.b2b.listeCommandesSite().filter(c => c.date === today).reduce((acc, c) => acc + c.partEntreprise, 0);
  });

  // Commandes filtrées pour le site et la période choisie (Cœur de la demande du Mentor)
  commandesFiltrees = computed(() => {
    const siteId = this.selectedSiteId();
    const debut = this.dateDebut();
    const fin = this.dateFin();

    return this.b2b.historiqueCommandes().filter(cmd => {
      const matchSite = siteId === 'TOUS' || cmd.siteId === siteId;
      const matchDate = (!debut || cmd.date >= debut) && (!fin || cmd.date <= fin);
      return matchSite && matchDate;
    });
  });

  // Statistiques calculées en temps réel sur la période
  totalRepasPeriode = computed(() => this.commandesFiltrees().length);
  totalMontantBrutPeriode = computed(() => this.commandesFiltrees().reduce((acc, c) => acc + c.prixTotal, 0));
  totalPriseEnChargePeriode = computed(() => this.commandesFiltrees().reduce((acc, c) => acc + c.partEntreprise, 0));
  totalResteAChargePeriode = computed(() => this.commandesFiltrees().reduce((acc, c) => acc + c.partEmploye, 0));

  // Pagination Commandes Déjeuner Rapprochement
  pageCommandes = signal<number>(1);
  pageSizeCommandes = signal<number>(5);

  totalCommandesPages = computed(() => Math.max(1, Math.ceil(this.totalRepasPeriode() / this.pageSizeCommandes())));

  pagesCommandesArray = computed(() => {
    const total = this.totalCommandesPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  paginatedCommandes = computed(() => {
    const page = this.pageCommandes();
    const size = this.pageSizeCommandes();
    const start = (page - 1) * size;
    return this.commandesFiltrees().slice(start, start + size);
  });

  changerPageCommandes(nouvellePage: number) {
    if (nouvellePage >= 1 && nouvellePage <= this.totalCommandesPages()) {
      this.pageCommandes.set(nouvellePage);
    }
  }

  // Raccourcis de dates : Aujourd'hui, Semaine, Mois, Année, Personnalisé
  definirPeriode(type: PeriodeFilterType | 'AUJOURDHUI') {
    const normalized: PeriodeFilterType = type === 'AUJOURDHUI' ? 'JOUR' : type;
    this.periodeActive.set(normalized);
    if (normalized === 'JOUR') {
      this.dateDebut.set('2026-11-12');
      this.dateFin.set('2026-11-12');
    } else if (normalized === 'SEMAINE') {
      this.dateDebut.set('2026-11-09');
      this.dateFin.set('2026-11-15');
    } else if (normalized === 'MOIS') {
      this.dateDebut.set('2026-11-01');
      this.dateFin.set('2026-11-30');
    } else if (normalized === 'ANNEE') {
      this.dateDebut.set('2026-01-01');
      this.dateFin.set('2026-12-31');
    }
  }

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

  exporterExcelFacturation() {
    const lignes = this.lignesFacturationFiltrees();
    const header = 'Date;Libellé;Plats livrés;Montant Total (FCFA);Part Entreprise (FCFA);Statut';
    const rows = lignes.map(l =>
      `${l.date};"${l.dateAffichee}";${l.nbPlatsLivres};${l.montantTotal};${l.montantPartEntreprise};${l.statut}`
    );
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facturation_Kiki_Traiteur_${this.factureDateDebut()}_au_${this.factureDateFin()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  surChangementDateManuel() {
    this.periodeActive.set('PERSONNALISE');
  }

  // Pagination Annuaire Employés
  pageEmployes = signal<number>(1);
  pageSizeEmployes = signal<number>(5);

  // Employés filtrés
  filteredEmployes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const siteFilter = this.selectedSiteFilter();

    return this.b2b.listeEmployes().filter(emp => {
      const matchQuery = !query || 
        emp.nom.toLowerCase().includes(query) || 
        emp.prenom.toLowerCase().includes(query) || 
        emp.matricule.toLowerCase().includes(query) ||
        emp.departement.toLowerCase().includes(query);

      const matchSite = siteFilter === 'TOUS' || emp.siteId === siteFilter;
      return matchQuery && matchSite;
    });
  });

  totalEmployes = computed(() => this.filteredEmployes().length);
  totalEmployesPages = computed(() => Math.max(1, Math.ceil(this.totalEmployes() / this.pageSizeEmployes())));

  pagesArray = computed(() => {
    const total = this.totalEmployesPages();
    return Array.from({ length: total }, (_, i) => i + 1);
  });

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  paginatedEmployes = computed(() => {
    const page = this.pageEmployes();
    const size = this.pageSizeEmployes();
    const start = (page - 1) * size;
    return this.filteredEmployes().slice(start, start + size);
  });

  changerPageEmployes(nouvellePage: number) {
    if (nouvellePage >= 1 && nouvellePage <= this.totalEmployesPages()) {
      this.pageEmployes.set(nouvellePage);
    }
  }

  ouvrirModalAjout() {
    this.tauxSubventionError.set('');
    this.newEmp.set({
      matricule: 'TOT-' + Math.floor(1000 + Math.random() * 9000),
      nom: '',
      prenom: '',
      email: '',
      telephone: '+221 ',
      siteId: 'site-1',
      departement: 'Ressources Humaines',
      type: 'SUBVENTIONNE',
      tauxSubvention: 100
    });
    this.showAddEmployeeModal.set(true);
  }

  enregistrerEmploye() {
    const val = this.newEmp();
    if (!val.nom || !val.prenom || !val.email) {
      alert('Veuillez renseigner le nom, prénom et email du collaborateur.');
      return;
    }
    const taux = Number(val.tauxSubvention);
    if (isNaN(taux) || taux <= 0 || taux > 100) {
      this.tauxSubventionError.set('Le taux de subvention doit être strictement supérieur à 0 et inférieur ou égal à 100.');
      return;
    }
    this.tauxSubventionError.set('');
    this.b2b.ajouterEmploye({
      ...val,
      tauxSubvention: taux,
      type: 'SUBVENTIONNE'
    });
    this.showAddEmployeeModal.set(false);
  }

  genererFacturePDF() {
    this.isExporting.set(true);
    setTimeout(() => {
      this.isExporting.set(false);
      this.showFactureModal.set(true);
    }, 800);
  }

  exporterFactureMensuelle() {
    this.genererFacturePDF();
  }

  imprimerFacture() {
    window.print();
  }
}

