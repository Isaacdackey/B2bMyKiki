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

  private readonly todayIso = new Date().toISOString().slice(0, 10);
  tauxSubventionError = signal<string>('');
  searchQuery = signal<string>('');
  selectedSiteFilter = signal<string>('TOUS');
  employeDateDebut = signal<string>(this.todayIso.slice(0, 8) + '01');
  employeDateFin = signal<string>(this.todayIso);

  onPeriodeEmployesChange(ev: PeriodeFilterChange) {
    this.employeDateDebut.set(ev.dateDebut);
    this.employeDateFin.set(ev.dateFin);
    this.pageEmployes.set(1);
  }

  // Filtres Facturation
  factureDateDebut = signal<string>(this.todayIso.slice(0, 8) + '01');
  factureDateFin = signal<string>(this.todayIso);

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

  private formatSenegalPhone(raw: string): string {
    let digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('00221')) digits = digits.slice(5);
    else if (digits.startsWith('221')) digits = digits.slice(3);
    digits = digits.slice(0, 9);

    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 7));
    if (digits.length > 7) parts.push(digits.slice(7, 9));

    return parts.length > 0 ? `+221 ${parts.join(' ')}` : '+221 ';
  }

  onTelephoneRhChange(value: string) {
    const formatted = this.formatSenegalPhone(value);
    this.newEmp.update(cur => ({ ...cur, telephone: formatted }));
  }

  onTelephoneRhInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatSenegalPhone(input.value);
    input.value = formatted;
    this.newEmp.update(cur => ({ ...cur, telephone: formatted }));
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
    if (!val.nom?.trim() || !val.prenom?.trim() || !val.email?.trim()) {
      this.b2b.showToast('Veuillez renseigner le nom, prénom et email du collaborateur.', 'error');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val.email.trim())) {
      this.b2b.showToast('Adresse email invalide.', 'error');
      return;
    }
    const telTrim = (val.telephone || '').trim();
    if (!telTrim || telTrim === '+221' || !/^(?:\+221|00221)?[\s.-]?(?:7[05678]|3[03])(?:[\s.-]?\d){7}$/.test(telTrim)) {
      this.b2b.showToast('Veuillez saisir un numéro de téléphone sénégalais valide (ex: +221 77 123 45 67).', 'error');
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
      telephone: telTrim,
      tauxSubvention: taux,
      type: 'SUBVENTIONNE'
    });
    this.showAddEmployeeModal.set(false);
  }
}

