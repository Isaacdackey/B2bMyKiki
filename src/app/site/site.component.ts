import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-site',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './site.component.html',
  styleUrl: './site.component.css'
})
export class SiteComponent implements OnInit {
  isMenuOpen = false;
  isDark = false;
  isAnimating = false;

  constructor() {}

  ngOnInit(): void {
    const saved = localStorage.getItem('kiki-theme') as 'light' | 'dark' | null;
    this.applyTheme(saved === 'dark' ? 'dark' : 'light');
  }

  toggleTheme(): void {
    // Déclenche l'animation de rotation
    this.isAnimating = true;
    setTimeout(() => { this.isAnimating = false; }, 450);
    this.applyTheme(this.isDark ? 'light' : 'dark');
  }

  applyTheme(theme: 'light' | 'dark'): void {
    this.isDark = theme === 'dark';
    localStorage.setItem('kiki-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    this.updateBodyScroll();
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.updateBodyScroll();
  }

  private updateBodyScroll(): void {
    if (typeof document !== 'undefined') {
      if (this.isMenuOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth > 1180 && this.isMenuOpen) {
      this.closeMenu();
    }
  }
}

