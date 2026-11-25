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

  getLibellePrestation(type: string): string {
    return this.b2b.typesPrestationConfigurables().find(t => t.code === type)?.libelle || type || 'Standard';
  }

  getLibelleCutOff(ent: any): string {
    if (!ent) return '18:00 (J-1)';
    if (ent.cutOffType === 'SANS_CUTOFF') return 'Libre (Sans Cut-Off)';
    const label = ent.cutOffType === 'JOUR_J' ? 'Le jour même (Jour J)' : ent.cutOffType === 'J_MOINS_2' ? '48h avant (J-2)' : 'La veille (J-1)';
    return `${ent.cutOffHeure || '18:00'} (${label})`;
  }

  getCategoriesLibelles(cats?: string[]): string {
    if (!cats || cats.length === 0) return 'Toutes les catégories';
    return cats.map(c => this.b2b.categoriesConfigurables().find(cfg => cfg.code === c)?.libelle || c).join(', ');
  }
}

