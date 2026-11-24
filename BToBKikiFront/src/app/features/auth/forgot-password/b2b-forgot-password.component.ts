import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bApiService } from '../../../b2b/shared/b2b-api.service';

@Component({
  selector: 'app-b2b-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="assets/images/logo.png" alt="Kiki Traiteur" onerror="this.src='assets/images/KIKI TRAITEUR Logo Picto Rouge bordeau.png'">
          <h1 class="font-serif-luxury">Mot de passe oublié</h1>
          <p>Recevez un lien sécurisé par email pour réinitialiser votre accès Kiki Traiteur B2B.</p>
        </div>

        @if (sent()) {
          <div class="state-box success-box">
            <i class="fa-solid fa-envelope-circle-check state-icon" style="color: #606C38;"></i>
            <p class="state-title" style="color: #3F4A22;">Demande envoyée !</p>
            <p class="state-desc">
              Si un compte existe pour <strong>{{ email() }}</strong>, vous allez recevoir un email contenant votre lien de réinitialisation (valable 30 minutes).
            </p>
            <a routerLink="/b2b/login" class="btn-primary" style="text-decoration: none; margin-top: 1rem;">
              <i class="fa-solid fa-arrow-left"></i> Retour à la connexion
            </a>
          </div>
        } @else {
          @if (errorMsg()) {
            <div class="alert-error">
              <i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg() }}
            </div>
          }

          <form (ngSubmit)="envoyerDemande()" class="auth-form">
            <div class="form-group">
              <label for="email">Adresse email professionnelle *</label>
              <input id="email" type="email" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email" placeholder="ex: prenom.nom@entreprise.sn" required>
            </div>

            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) {
                <i class="fa-solid fa-spinner fa-spin"></i> Envoi en cours...
              } @else {
                <i class="fa-solid fa-paper-plane"></i> Envoyer le lien de réinitialisation
              }
            </button>
          </form>

          <div class="footer-link">
            <a routerLink="/b2b/login">
              <i class="fa-solid fa-arrow-left"></i> Retour à la connexion
            </a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: 100dvh; background: linear-gradient(160deg, #FAF8F4 0%, #F4EDE2 100%); display: flex; align-items: center; justify-content: center; padding: 1.5rem 1rem; }
    .auth-card { width: 100%; max-width: 460px; background: #FFFFFF; border: 1.5px solid #EDE7DC; border-radius: 24px; padding: 2rem; box-shadow: 0 18px 42px rgba(114, 21, 19, 0.08); }
    .auth-brand { text-align: center; margin-bottom: 1.5rem; }
    .auth-brand img { height: 48px; width: auto; object-fit: contain; margin-bottom: 0.65rem; }
    .auth-brand h1 { margin: 0; font-size: 1.45rem; color: #721513; font-weight: 900; }
    .auth-brand p { margin: 0.45rem 0 0; font-size: 0.85rem; color: #6E5A56; line-height: 1.45; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.75rem; font-weight: 800; color: #332724; text-transform: uppercase; letter-spacing: 0.03em; }
    .form-group input { width: 100%; height: 44px; border: 1.5px solid #EDE7DC; border-radius: 12px; padding: 0 0.9rem; font-size: 0.9rem; box-sizing: border-box; background: #FAF8F4; }
    .form-group input:focus { outline: none; border-color: #721513; background: #FFFFFF; }
    .btn-primary { height: 46px; border: none; border-radius: 9999px; background: #721513; color: #FFFFFF; font-weight: 800; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .footer-link { text-align: center; margin-top: 1.25rem; }
    .footer-link a { font-size: 0.84rem; font-weight: 700; color: #721513; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; }
    .state-box { text-align: center; padding: 1.5rem 1rem; border-radius: 16px; border: 1.5px solid #606C38; background: rgba(96, 108, 56, 0.08); }
    .state-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .state-title { margin: 0 0 0.35rem; font-weight: 800; font-size: 1rem; }
    .state-desc { margin: 0; font-size: 0.84rem; color: #332724; line-height: 1.5; }
    .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  `]
})
export class B2bForgotPasswordComponent {
  private api = inject(B2bApiService);

  email = signal('');
  loading = signal(false);
  sent = signal(false);
  errorMsg = signal<string | null>(null);

  envoyerDemande() {
    this.errorMsg.set(null);
    const val = this.email().trim();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) {
      this.errorMsg.set('Veuillez saisir une adresse email valide.');
      return;
    }

    this.loading.set(true);
    this.api.forgotPassword(val).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err?.error?.message || "Impossible d'envoyer la demande pour le moment.");
      }
    });
  }
}
