import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { EntrepriseB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-cuisine-infos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cuisine-infos.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineInfosComponent {
  b2b = inject(B2bStateService);
  constructor() {
  }

  entreprise = computed(() => this.b2b.currentEntreprise());

  // Utilisateurs du site géré
  getLibellePrestation(type: string): string {
    const found = this.b2b.typesPrestationConfigurables().find(p => p.code === type);
    return found ? found.libelle : type;
  }

  getLibelleCutOff(e: EntrepriseB2B): string {
    const moment = e.cutOffType === 'J_MOINS_1' ? 'La veille (J-1)' : 'Le jour même (Jour J)';
    return `${e.cutOffHeure} (${moment})`;
  }
}
