import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-b2b-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './b2b-nav.component.html',
  styleUrls: ['./b2b-nav.component.css']
})
export class B2bNavComponent {}

