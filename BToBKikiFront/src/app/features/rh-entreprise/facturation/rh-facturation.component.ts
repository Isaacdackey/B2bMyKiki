import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bPeriodFilterComponent, PeriodeFilterChange, PeriodeFilterType } from '../../../b2b/shared/b2b-period-filter.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-rh-facturation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bPeriodFilterComponent],
  templateUrl: './rh-facturation.component.html',
  styleUrls: ['../rh-shared.css']
})
export class RhFacturationComponent {
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
  showFactureModal = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  exportSuccess = signal<boolean>(false);

  // Site sélectionné
  siteActif = computed(() => {
    return this.b2b.currentEntreprise().sites.find(s => s.id === this.selectedSiteId()) || this.b2b.currentEntreprise().sites[0];
  });

  // Commandes filtrées pour l'entreprise selon les 3 statuts stricts : EN_COURS -> SCANNE -> LIVRE
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

