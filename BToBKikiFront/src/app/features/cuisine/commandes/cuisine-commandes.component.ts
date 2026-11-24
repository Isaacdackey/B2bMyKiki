import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

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

  commandesScanneesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'SCANNE').length;
  });

  commandesLivreesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'LIVRE').length;
  });

  commandesEnAttenteCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'EN_COURS').length;
  });

}
