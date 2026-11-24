import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { B2bNavComponent } from './b2b-nav.component';

@Component({
  selector: 'app-b2b-layout',
  standalone: true,
  imports: [RouterOutlet, B2bNavComponent],
  template: `
    <app-b2b-nav></app-b2b-nav>
    <router-outlet></router-outlet>
  `
})
export class B2bLayoutComponent {}
