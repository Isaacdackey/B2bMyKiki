import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bPeriodFilterComponent, PeriodeFilterChange } from '../../../b2b/shared/b2b-period-filter.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { FacturationLigneJournaliere } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-cuisine-facturation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bPeriodFilterComponent],
  templateUrl: './cuisine-facturation.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineFacturationComponent {
  b2b = inject(B2bStateService);
  constructor() {
  }

  factureDateDebut = signal<string>('2026-11-01');
  factureDateFin = signal<string>('2026-11-30');

  onPeriodeFactureCuisineChange(ev: PeriodeFilterChange) {
    this.factureDateDebut.set(ev.dateDebut);
    this.factureDateFin.set(ev.dateFin);
  }

  facturationJournaliere = computed<FacturationLigneJournaliere[]>(() => {
    const d1 = this.factureDateDebut();
    const d2 = this.factureDateFin();
    return this.b2b.lignesFacturationEntreprise().filter(
      l => (!d1 || l.date >= d1) && (!d2 || l.date <= d2)
    );
  });

  totalFactureMoisSite = computed<number>(() => {
    return this.facturationJournaliere().reduce((sum: number, l: FacturationLigneJournaliere) => sum + (l.montantPartEntreprise || 0), 0);
  });

  totalPlatsLivresMoisSite = computed<number>(() => {
    return this.facturationJournaliere().reduce((sum: number, l: FacturationLigneJournaliere) => sum + (l.nbPlatsLivres || 0), 0);
  });

  facturationJourSelectionne = signal<FacturationLigneJournaliere | null>(null);

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

  exporterExcelFacturationSite() {
    const lignes = this.facturationJournaliere();
    const header = 'Date;Libellé;Plats livrés;Montant Total (FCFA);Part Entreprise (FCFA);Statut';
    const rows = lignes.map(l =>
      `${l.date};"${l.dateAffichee}";${l.nbPlatsLivres};${l.montantTotal};${l.montantPartEntreprise};${l.statut}`
    );
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Facturation_Site_Kiki_Traiteur.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

}
