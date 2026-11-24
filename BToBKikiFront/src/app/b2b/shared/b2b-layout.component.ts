import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { B2bNavComponent } from './b2b-nav.component';
import { B2bStateService } from './b2b-state.service';

@Component({
  selector: 'app-b2b-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, B2bNavComponent],
  template: `
    @if (b2b.isLoading()) {
      <div style="position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 999999; background: rgba(114, 21, 19, 0.12); overflow: hidden;">
        <div style="width: 45%; height: 100%; background: linear-gradient(90deg, #721513, #E51D24, #C5A880); animation: kikiLoadSlide 1.1s infinite ease-in-out;"></div>
      </div>
    }

    @if (b2b.toastMessage(); as toast) {
      <div
        role="status"
        style="position: fixed; bottom: 1.25rem; right: 1.25rem; z-index: 999999; display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1.15rem; border-radius: 14px; font-size: 0.84rem; font-weight: 800; box-shadow: 0 10px 30px rgba(0,0,0,0.18); max-width: min(92vw, 380px);"
        [style.background]="toast.type === 'success' ? '#606C38' : '#DC2626'"
        [style.color]="'#FFFFFF'">
        <i class="fa-solid" [class.fa-circle-check]="toast.type === 'success'" [class.fa-circle-exclamation]="toast.type === 'error'"></i>
        <span>{{ toast.text }}</span>
      </div>
    }

    <app-b2b-nav></app-b2b-nav>
    <router-outlet></router-outlet>
  `,
  styles: [`
    @keyframes kikiLoadSlide {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(320%); }
    }
  `]
})
export class B2bLayoutComponent {
  b2b = inject(B2bStateService);
}
