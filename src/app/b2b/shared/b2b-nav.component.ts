import { Component, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { B2bStateService } from './b2b-state.service';

@Component({
  selector: 'app-b2b-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './b2b-nav.component.html',
  styleUrls: ['./b2b-nav.component.css']
})
export class B2bNavComponent {
  b2b = inject(B2bStateService);

  @HostListener('window:keydown.escape')
  onEscape() {
    if (this.b2b.isMobileDrawerOpen()) {
      this.b2b.closeMobileDrawer();
    }
  }
}

