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
