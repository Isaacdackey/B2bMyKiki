import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bPeriodFilterComponent, PeriodeFilterChange } from '../../../b2b/shared/b2b-period-filter.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { EmployeB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-rh-employes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bPeriodFilterComponent],
  templateUrl: './rh-employes.component.html',
  styleUrls: ['../rh-shared.css']
})
export class RhEmployesComponent {
  b2b = inject(B2bStateService);
  constructor() {
  }

  tauxSubventionError = signal<string>('');
  searchQuery = signal<string>('');
  selectedSiteFilter = signal<string>('TOUS');
  employeDateDebut = signal<string>('2026-11-01');
  employeDateFin = signal<string>('2026-11-12');

  onPeriodeEmployesChange(ev: PeriodeFilterChange) {
    this.employeDateDebut.set(ev.dateDebut);
    this.employeDateFin.set(ev.dateFin);
    this.pageEmployes.set(1);
  }

  // Filtres Facturation
  factureDateDebut = signal<string>('2026-11-01');
  factureDateFin = signal<string>('2026-11-12');

  // Modal nouvel employé & modal détails employé
  showAddEmployeeModal = signal<boolean>(false);
  employeSelectionne = signal<EmployeB2B | null>(null);
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
  employesPrisEnChargeCount = computed(() => {
    return this.b2b.listeEmployes().filter(e => e.tauxSubvention > 0).length;
  });

  // Consommation journalière calculée pour la journée
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
      this.b2b.showToast('Veuillez renseigner le nom, prénom et email du collaborateur.', 'error');
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
}

