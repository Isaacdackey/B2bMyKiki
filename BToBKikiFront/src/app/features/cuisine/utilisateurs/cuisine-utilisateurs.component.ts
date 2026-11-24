import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-cuisine-utilisateurs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cuisine-utilisateurs.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineUtilisateursComponent {
  b2b = inject(B2bStateService);
  constructor() {
    if (this.b2b.currentSession().role !== 'RESPONSABLE_SITE_KIKI') {
      this.b2b.setSessionRole({
        role: 'RESPONSABLE_SITE_KIKI',
        nomComplet: 'Moussa Kane (Gérant Cantine)',
        titrePoste: 'Responsable de Site Kiki Traiteur',
        entite: 'TotalEnergies Sénégal',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        badge: 'Gérant Exploitation Site',
        badgeColor: '#3D5A80'
      });
    }
  }

  entreprise = computed(() => this.b2b.currentEntreprise());
  employesSite = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeEmployes().filter(e => {
      return (e.siteNom && e.siteNom.toLowerCase().includes('plateau')) || e.siteId === 'site-1';
    });
  });

  employesSubventionnesCount = computed(() => {
    return this.employesSite().filter(e => e.type === 'SUBVENTIONNE' && e.actif).length;
  });

  // Plats du Catalogue Global pour ajout/remplacement
}

