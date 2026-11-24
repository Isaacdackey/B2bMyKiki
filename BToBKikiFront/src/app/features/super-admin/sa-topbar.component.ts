import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-sa-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <header class="sa-topbar">
      <div class="sa-topbar-left">
        <button type="button" class="b2b-mobile-hamburger-btn" (click)="b2b.toggleMobileDrawer()" aria-label="Ouvrir le menu">
          <i class="fa-solid fa-bars"></i>
        </button>
        <div class="sa-context-pill">
          <i class="fa-solid fa-crown" style="color: #721513;"></i>
          <strong>Direction Kiki Traiteur</strong>
          <span class="sa-sep">|</span>
          <span><i class="fa-solid fa-location-dot" style="color: #E51D24;"></i> Hann Maristes, Dakar</span>
        </div>
      </div>

      <div class="sa-topbar-right">
        @if (showSearch) {
          <div class="sa-search-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              [ngModel]="searchValue"
              (ngModelChange)="searchValueChange.emit($event)"
              placeholder="Rechercher une entreprise, un code contrat...">
          </div>
        }
        <div class="sa-badge-role">
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
