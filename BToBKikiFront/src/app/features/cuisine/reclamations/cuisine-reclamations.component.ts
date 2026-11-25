import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-cuisine-reclamations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cuisine-reclamations.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineReclamationsComponent {
  b2b = inject(B2bStateService);
  constructor() {
  }

  entreprise = computed(() => this.b2b.currentEntreprise());

  // Utilisateurs du site géré
  reclamations = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeReclamations().filter(r => r.entrepriseId === entId);
  });

  reclamationsEnAttenteCount = computed(() => {
    return this.reclamations().filter(r => r.statut === 'EN_ATTENTE').length;
  });

  debloquerEmploye(reclamationId: string) {
    this.b2b.debloquerReclamation(reclamationId);
  }

}
