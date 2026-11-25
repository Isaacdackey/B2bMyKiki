import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { EmployeB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-cuisine-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cuisine-commandes.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineCommandesComponent {
  b2b = inject(B2bStateService);
  constructor() {
    if (this.b2b.currentSession().role !== 'RESPONSABLE_SITE_KIKI') {
      this.b2b.setSessionRole({
        role: 'RESPONSABLE_SITE_KIKI', nomComplet: 'Moussa Kane (Gérant Cantine)', titrePoste: 'Responsable de Site Kiki Traiteur',
        entite: 'TotalEnergies Sénégal', siteId: 'site-1', siteNom: 'Siège Plateau - Dakar',
        badge: 'Gérant Exploitation Site', badgeColor: '#3D5A80'
      });
    }
  }

  entreprise = computed(() => this.b2b.currentEntreprise());

  // Utilisateurs du site géré
  simulerScanEmploye(cmdId: string) {
    this.b2b.scannerCommandeSite(cmdId);
  }

  // MARQUER LIVRÉ (Autorisé uniquement si la commande est à l'état 'SCANNE')
  marquerLivre(cmdId: string) {
    this.b2b.marquerCommandeLivree(cmdId);
  }

  // COMMANDES DU JOUR POUR LE SITE
  commandesSite = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeCommandesSite().filter(c => c.entrepriseId === entId);
  });

  pageCommandes = signal<number>(1);
  readonly pageSizeCommandes = 10;

  totalPagesCommandes = computed(() => Math.max(1, Math.ceil(this.commandesSite().length / this.pageSizeCommandes)));

  pagesArrayCommandes = computed(() => Array.from({ length: this.totalPagesCommandes() }, (_, i) => i + 1));

  commandesSitePaginees = computed(() => {
    const page = Math.min(this.pageCommandes(), this.totalPagesCommandes());
    const start = (page - 1) * this.pageSizeCommandes;
    return this.commandesSite().slice(start, start + this.pageSizeCommandes);
  });

  allerAPageCommandes(p: number) {
    if (p >= 1 && p <= this.totalPagesCommandes()) {
      this.pageCommandes.set(p);
    }
  }

  commandesScanneesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'SCANNE').length;
  });

  commandesLivreesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'LIVRE').length;
  });

  commandesEnAttenteCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'EN_COURS').length;
  });

  // Commander pour un employé (avec ou sans compte)
  showModalCommandeEmploye = signal<boolean>(false);
  modeSansCompte = signal<boolean>(false);
  rechercheEmploye = signal<string>('');
  employeSelectionne = signal<EmployeB2B | null>(null);
  inviteNom = signal<string>('');
  inviteMatricule = signal<string>('');
  platSelectionneId = signal<string>('');
  quantiteProxy = signal<number>(1);

  platsDisponibles = computed(() => this.b2b.catalogueJour().filter(p => !p.isArchive));

  employesFiltres = computed(() => {
    const q = this.rechercheEmploye().trim().toLowerCase();
    const entId = this.entreprise().id;
    const list = this.b2b.listeEmployes().filter(e => !e.siteId || e.siteId === entId || true);
    if (!q) return list;
    return list.filter(e =>
      `${e.prenom} ${e.nom}`.toLowerCase().includes(q) ||
      e.matricule.toLowerCase().includes(q)
    );
  });

  ouvrirModalCommandeEmploye() {
    this.modeSansCompte.set(false);
    this.rechercheEmploye.set('');
    this.employeSelectionne.set(null);
    this.inviteNom.set('');
    this.inviteMatricule.set('');
    this.quantiteProxy.set(1);
    const firstPlat = this.platsDisponibles()[0];
    this.platSelectionneId.set(firstPlat?.id || '');
    this.showModalCommandeEmploye.set(true);
  }

  validerCommandePourEmploye() {
    const plat = this.platsDisponibles().find(p => p.id === this.platSelectionneId());
    if (!plat) {
      this.b2b.showToast('Veuillez sélectionner un plat.', 'error');
      return;
    }

    let matricule = '';
    let employeNom = '';
    let taux = 0;

    if (this.modeSansCompte()) {
      employeNom = this.inviteNom().trim();
      matricule = this.inviteMatricule().trim() || `INV-${Date.now().toString().slice(-4)}`;
      if (!employeNom) {
        this.b2b.showToast('Veuillez saisir le nom du collaborateur.', 'error');
        return;
      }
    } else {
      const emp = this.employeSelectionne();
      if (!emp) {
        this.b2b.showToast('Veuillez sélectionner un employé dans la liste ou passer en mode sans compte.', 'error');
        return;
      }
      matricule = emp.matricule;
      employeNom = `${emp.prenom} ${emp.nom}`;
      taux = emp.tauxSubvention;
    }

    const qte = Math.max(1, this.quantiteProxy());
    const montantTotal = (plat.prixUnitaire || 0) * qte;
    const partEntreprise = Math.round((montantTotal * taux) / 100);
    const partEmploye = Math.max(0, montantTotal - partEntreprise);
    const codeCommande = `CMD-SITE-${Date.now().toString().slice(-6)}`;

    this.b2b.enregistrerCommandeSite({
      codeCommande,
      platNom: qte > 1 ? `${plat.nom} (x${qte})` : plat.nom,
      categorie: plat.categorie,
      montantTotal,
      partEntreprise,
      partEmploye,
      matricule,
      employeNom,
      tauxSubvention: taux
    });

    this.showModalCommandeEmploye.set(false);
  }

}
