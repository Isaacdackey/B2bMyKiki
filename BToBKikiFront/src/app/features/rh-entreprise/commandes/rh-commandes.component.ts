import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bPeriodFilterComponent, PeriodeFilterChange, PeriodeFilterType } from '../../../b2b/shared/b2b-period-filter.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-rh-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bPeriodFilterComponent],
  templateUrl: './rh-commandes.component.html',
  styleUrls: ['../rh-shared.css']
})
export class RhCommandesComponent {
  b2b = inject(B2bStateService);
  constructor() {
    if (this.b2b.currentSession().role !== 'RESPONSABLE_ENTREPRISE') {
      this.b2b.setSessionRole({
        role: 'RESPONSABLE_ENTREPRISE',
        nomComplet: 'Aminata Diop (DRH)',
        titrePoste: 'Directrice des Ressources Humaines',
        entite: 'TotalEnergies Sénégal',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        badge: 'Direction RH',
        badgeColor: '#606C38'
      });
    }
  }

  // Utilisation de la section persistée dans le service partagé pour synchronisation avec la navbar latérale
  get activeSection() {
    return this.b2b.rhActiveSection;
  }


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

  surChangementDateManuel() {
    this.periodeActive.set('PERSONNALISE');
  }

  mathMin(a: number, b: number): number {
    return Math.min(a, b);
  }
}

