import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-sa-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="sa-topbar-header">
      <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 0; flex-wrap: wrap;">
        <button type="button" class="b2b-mobile-hamburger-btn" (click)="b2b.toggleMobileDrawer()" aria-label="Ouvrir le menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="sa-topbar-entity-pill">
          <i class="fa-solid fa-crown" style="color: #721513;"></i>
          <strong>Direction Kiki Traiteur</strong>
          <span style="color: #CBD5E1;">|</span>
          <span><i class="fa-solid fa-location-dot" style="color: #E51D24;"></i> Hann Maristes, Dakar</span>
        </div>
      </div>

      @if (showSearch) {
        <div class="sa-topbar-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            [ngModel]="searchValue"
            (ngModelChange)="searchValueChange.emit($event)"
            placeholder="Rechercher une entreprise, un code contrat...">
        </div>
      }

      <div class="sa-topbar-actions">
        <div class="sa-topbar-entity-pill" style="font-weight: 700; color: #721513;">
          <i class="fa-solid fa-user-shield"></i> Super Administrateur
        </div>
      </div>
    </header>
  `,
  styleUrls: ['./super-admin-shared.css']
})
export class SaTopbarComponent {
  b2b = inject(B2bStateService);
  @Input() showSearch = false;
  @Input() searchValue = '';
  @Output() searchValueChange = new EventEmitter<string>();
}
