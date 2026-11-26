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

  private readonly now = new Date();
  private readonly firstOfMonthIso = `${this.now.getFullYear()}-${String(this.now.getMonth() + 1).padStart(2, '0')}-01`;
  private readonly lastOfMonthIso = new Date(this.now.getFullYear(), this.now.getMonth() + 1, 0).toISOString().slice(0, 10);
  factureDateDebut = signal<string>(this.firstOfMonthIso);
  factureDateFin = signal<string>(this.lastOfMonthIso);

  onPeriodeFactureCuisineChange(ev: PeriodeFilterChange) {
    this.factureDateDebut.set(ev.dateDebut);
    this.factureDateFin.set(ev.dateFin);
  }

  facturationJournaliere = computed<FacturationLigneJournaliere[]>(() => {
    const d1 = this.factureDateDebut();
    const d2 = this.factureDateFin();
    const entId = this.b2b.currentEntreprise().id;
    return this.b2b.lignesFacturationEntreprise().filter(
      (l: any) => (!l.entrepriseId || !entId || l.entrepriseId === entId) && (!d1 || l.date >= d1) && (!d2 || l.date <= d2)
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
