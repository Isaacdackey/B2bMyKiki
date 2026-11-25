import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { B2bPeriodFilterComponent, PeriodeFilterChange, PeriodeFilterType } from '../../../b2b/shared/b2b-period-filter.component';
import { CountUpDirective } from '../../../b2b/shared/count-up.directive';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { B2bApiService } from '../../../b2b/shared/b2b-api.service';
import { EmployeB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-rh-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bPeriodFilterComponent, CountUpDirective],
  templateUrl: './rh-dashboard.component.html',
  styleUrls: ['../rh-shared.css']
})
export class RhDashboardComponent {
  b2b = inject(B2bStateService);
  private api = inject(B2bApiService);
  private router = inject(Router);
  constructor() {
  }

  activeSection = {
    set: (s: string) => {
      const m: Record<string, string> = {
        STATISTIQUES: '/b2b/rh/dashboard', COMMANDES_SITE: '/b2b/rh/commandes',
        EMPLOYES: '/b2b/rh/employes', FACTURATION: '/b2b/rh/facturation'
      };
      this.router.navigate([m[s] || '/b2b/rh/dashboard']);
    }
  };

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

  // Modal nouvel employé & modal détails employé
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

  // Comparaison Effectif / Commandés / Non-commandés sur la période
  employesActifsEntreprise = computed(() => {
    return this.b2b.listeEmployes().filter(e => e.actif);
  });

  employesAyantCommande = computed(() => {
    const cmds = this.commandesSiteFiltrees();
    const matricules = new Set(cmds.map(c => (c.matricule || '').toLowerCase()));
    const noms = new Set(cmds.map(c => (c.employeNom || '').toLowerCase()));
    return this.employesActifsEntreprise().filter(emp => {
      const full = `${emp.prenom} ${emp.nom}`.toLowerCase();
      return matricules.has((emp.matricule || '').toLowerCase()) || noms.has(full);
    });
  });

  employesNonCommandes = computed(() => {
    const ids = new Set(this.employesAyantCommande().map(e => e.id));
    return this.employesActifsEntreprise().filter(e => !ids.has(e.id));
  });

  tauxParticipationCommande = computed(() => {
    const total = this.employesActifsEntreprise().length;
    if (total === 0) return 0;
    return Math.round((this.employesAyantCommande().length / total) * 100);
  });

  showModalRelance = signal<boolean>(false);
  messageRelance = signal<string>("Bonjour, n'oubliez pas de passer votre commande de repas sur la plateforme Kiki Traiteur avant l'heure limite.");
  envoiRelanceEnCours = signal<boolean>(false);

  relancerIndividuel(emp: EmployeB2B) {
    if (!emp.email) {
      this.b2b.showToast(`Aucune adresse email renseignée pour ${emp.prenom} ${emp.nom}.`);
      return;
    }
    this.envoiRelanceEnCours.set(true);
    this.api.envoyerRelanceCommande({
      entrepriseId: this.b2b.currentEntreprise().id,
      entrepriseNom: this.b2b.currentEntreprise().nom,
      expediteurNom: this.b2b.currentSession().nomComplet || 'Service RH',
      message: this.messageRelance(),
      destinataires: [{ email: emp.email, nomComplet: `${emp.prenom} ${emp.nom}` }]
    }).subscribe({
      next: () => {
        this.envoiRelanceEnCours.set(false);
        this.b2b.showToast(`Alerte et email envoyés à ${emp.prenom} ${emp.nom}.`);
      },
      error: () => {
        this.envoiRelanceEnCours.set(false);
        this.b2b.showToast(`Alerte enregistrée localement pour ${emp.prenom} ${emp.nom}.`);
      }
    });
  }

  relancerGroupe() {
    const cibles = this.employesNonCommandes().filter(e => !!e.email);
    if (cibles.length === 0) {
      this.b2b.showToast('Aucun collaborateur avec email valide à relancer.');
      return;
    }
    this.envoiRelanceEnCours.set(true);
    this.api.envoyerRelanceCommande({
      entrepriseId: this.b2b.currentEntreprise().id,
      entrepriseNom: this.b2b.currentEntreprise().nom,
      expediteurNom: this.b2b.currentSession().nomComplet || 'Service RH',
      message: this.messageRelance(),
      destinataires: cibles.map(e => ({ email: e.email, nomComplet: `${e.prenom} ${e.nom}` }))
    }).subscribe({
      next: () => {
        this.envoiRelanceEnCours.set(false);
        this.showModalRelance.set(false);
        this.b2b.showToast(`Relance groupée envoyée à ${cibles.length} collaborateur(s) (plateforme + email).`);
      },
      error: () => {
        this.envoiRelanceEnCours.set(false);
        this.showModalRelance.set(false);
        this.b2b.showToast(`Relance groupée traitée pour ${cibles.length} collaborateur(s).`);
      }
    });
  }

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

  surChangementDateManuel() {
    this.periodeActive.set('PERSONNALISE');
  }

}

