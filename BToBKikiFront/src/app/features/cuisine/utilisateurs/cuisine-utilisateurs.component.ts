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
    const ent = this.entreprise();
    const siteIds = new Set((ent.sites || []).map(s => s.id));
    const list = this.b2b.listeEmployes();
    const matched = list.filter(e => siteIds.has(e.siteId) || (e as any).entrepriseId === ent.id);
    return matched.length > 0 ? matched : list;
  });

  employesSubventionnesCount = computed(() => {
    return this.employesSite().filter(e => e.type === 'SUBVENTIONNE' && e.actif).length;
  });

  getLibellePrestation(type: string): string {
    return this.b2b.typesPrestationConfigurables().find(t => t.code === type)?.libelle || type || 'Standard';
  }

  getLibelleCutOff(ent: any): string {
    return this.b2b.formatCutOffLibelle(ent);
  }

  getCategoriesLibelles(cats?: string[]): string {
    if (!cats || cats.length === 0) return 'Toutes les catégories';
    return cats.map(c => this.b2b.categoriesConfigurables().find(cfg => cfg.code === c)?.libelle || c).join(', ');
  }
}

