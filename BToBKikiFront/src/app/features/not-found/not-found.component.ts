import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100dvh; background: #FAF8F4; display: flex; align-items: center; justify-content: center; padding: 1.5rem; font-family: 'Plus Jakarta Sans', sans-serif;">
      <div style="max-width: 480px; width: 100%; background: #FFFFFF; border: 1.5px solid #EDE7DC; border-radius: 24px; padding: 2.5rem 2rem; text-align: center; box-shadow: 0 12px 35px rgba(114, 21, 19, 0.08);">
        <div style="width: 72px; height: 72px; border-radius: 50%; background: rgba(114, 21, 19, 0.08); color: #721513; display: inline-flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 1.25rem;">
          <i class="bi bi-compass"></i>
        </div>
        <div style="font-size: 3.25rem; font-weight: 900; color: #721513; line-height: 1; letter-spacing: -0.03em;">404</div>
        <h1 style="margin: 0.5rem 0 0.5rem; font-size: 1.35rem; font-weight: 900; color: #2C1810;">Page introuvable</h1>
        <p style="margin: 0 0 1.75rem; font-size: 0.88rem; color: #6E5A56; line-height: 1.55;">
          L'adresse demandée n'existe pas ou a été déplacée dans votre espace Kiki Traiteur B2B.
        </p>
        <a routerLink="/b2b/login" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background: #721513; color: #FFFFFF; border-radius: 9999px; padding: 0.7rem 1.5rem; font-size: 0.88rem; font-weight: 800; text-decoration: none; box-shadow: 0 6px 18px rgba(114, 21, 19, 0.25);">
          <i class="fa-solid fa-arrow-left"></i> Retour à l'accueil B2B
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
