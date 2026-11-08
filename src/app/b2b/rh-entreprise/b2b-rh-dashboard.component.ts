import { B2bNavComponent } from '../shared/b2b-nav.component';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { EmployeB2B, CommandeHistoriqueB2B } from '../shared/b2b.models';

@Component({
  selector: 'app-b2b-rh-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent],
  templateUrl: './b2b-rh-dashboard.component.html',
  styleUrls: ['./b2b-rh-dashboard.component.css']
})
export class B2bRhDashboardComponent {
  b2b = inject(B2bStateService);

  // Onglet actif : 'COMMANDES_SITE' | 'EMPLOYES' | 'FACTURATION' | 'STATISTIQUES' | 'SITES'
  activeSection = signal<'COMMANDES_SITE' | 'EMPLOYES' | 'FACTURATION' | 'STATISTIQUES' | 'SITES'>('COMMANDES_SITE');

  // FILTRES CLÉS EXIGÉS PAR LE MENTOR : PAR SITE + DATE DÉBUT + DATE FIN
  selectedSiteId = signal<string>('site-1');
  dateDebut = signal<string>('2026-11-01');
  dateFin = signal<string>('2026-11-30');

  // Période active sélectionnée
  periodeActive = signal<'AUJOURDHUI' | 'MOIS_EN_COURS' | 'MOIS_PRECEDENT' | 'PERSONNALISE'>('MOIS_EN_COURS');

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

  // Modal Facture PDF Générée
  showFactureModal = signal<boolean>(false);
  isExporting = signal<boolean>(false);
  exportSuccess = signal<boolean>(false);

  // Site sélectionné
  siteActif = computed(() => {
    return this.b2b.currentEntreprise().sites.find(s => s.id === this.selectedSiteId()) || this.b2b.currentEntreprise().sites[0];
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

  // Raccourcis de dates
  definirPeriode(type: 'AUJOURDHUI' | 'MOIS_EN_COURS' | 'MOIS_PRECEDENT') {
    this.periodeActive.set(type);
    if (type === 'AUJOURDHUI') {
      this.dateDebut.set('2026-11-06');
      this.dateFin.set('2026-11-06');
    } else if (type === 'MOIS_EN_COURS') {
      this.dateDebut.set('2026-11-01');
      this.dateFin.set('2026-11-30');
    } else if (type === 'MOIS_PRECEDENT') {
      this.dateDebut.set('2026-10-01');
      this.dateFin.set('2026-10-31');
    }
  }

  surChangementDateManuel() {
    this.periodeActive.set('PERSONNALISE');
  }

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

