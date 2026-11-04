import { B2bNavComponent } from '../shared/b2b-nav.component';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { EmployeB2B } from '../shared/b2b.models';

@Component({
  selector: 'app-b2b-rh-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent],
  templateUrl: './b2b-rh-dashboard.component.html',
  styleUrls: ['./b2b-rh-dashboard.component.css']
})
export class B2bRhDashboardComponent {
  b2b = inject(B2bStateService);

  // Onglet actif : 'STATISTIQUES' | 'EMPLOYES' | 'FACTURATION' | 'SITES'
  activeSection = signal<'STATISTIQUES' | 'EMPLOYES' | 'FACTURATION' | 'SITES'>('STATISTIQUES');

  // Filtre recherche employé
  searchQuery = signal<string>('');
  selectedSiteFilter = signal<string>('TOUS');

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
    type: 'SUBVENTIONNE'
  });

  // Exportation simulation facture PDF
  isExporting = signal<boolean>(false);
  exportSuccess = signal<boolean>(false);

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

  ouvrirModalAjout() {
    this.newEmp.set({
      matricule: 'TOT-' + Math.floor(1000 + Math.random() * 9000),
      nom: '',
      prenom: '',
      email: '',
      telephone: '+221 ',
      siteId: 'site-1',
      departement: 'Ressources Humaines',
      type: 'SUBVENTIONNE'
    });
    this.showAddEmployeeModal.set(true);
  }

  enregistrerEmploye() {
    const val = this.newEmp();
    if (!val.nom || !val.prenom || !val.email) {
      alert('Veuillez renseigner le nom, prénom et email du collaborateur.');
      return;
    }
    this.b2b.ajouterEmploye(val);
    this.showAddEmployeeModal.set(false);
  }

  exporterFactureMensuelle() {
    this.isExporting.set(true);
    setTimeout(() => {
      this.isExporting.set(false);
      this.exportSuccess.set(true);
      setTimeout(() => this.exportSuccess.set(false), 4000);
    }, 1500);
  }
}

