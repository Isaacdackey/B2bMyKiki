import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { B2bApiService } from '../../../b2b/shared/b2b-api.service';

@Component({
  selector: 'app-b2b-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="assets/images/logo.png" alt="Kiki Traiteur" onerror="this.src='assets/images/KIKI TRAITEUR Logo Picto Rouge bordeau.png'">
          <h1 class="font-serif-luxury">Nouveau mot de passe</h1>
          <p>Choisissez un nouveau mot de passe sécurisé pour votre compte B2B.</p>
        </div>

        @if (verifying()) {
          <div class="state-box">
            <i class="fa-solid fa-spinner fa-spin state-icon" style="color: #721513;"></i>
            <p class="state-title">Vérification du lien...</p>
            <p class="state-desc">Validation de votre jeton de sécurité en cours.</p>
          </div>
        } @else if (invalidToken()) {
          <div class="state-box error-box">
            <i class="fa-solid fa-clock-rotate-left state-icon" style="color: #DC2626;"></i>
            <p class="state-title" style="color: #991B1B;">Lien invalide ou expiré</p>
            <p class="state-desc">{{ errorMsg() }}</p>
            <a routerLink="/b2b/forgot-password" class="btn-primary" style="text-decoration: none; margin-top: 1rem;">
              <i class="fa-solid fa-paper-plane"></i> Demander un nouveau lien
            </a>
          </div>
        } @else if (done()) {
          <div class="state-box success-box">
            <i class="fa-solid fa-circle-check state-icon" style="color: #606C38;"></i>
            <p class="state-title" style="color: #3F4A22;">Mot de passe mis à jour !</p>
            <p class="state-desc">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            <a routerLink="/b2b/login" class="btn-primary" style="text-decoration: none; margin-top: 1rem;">
              <i class="fa-solid fa-arrow-right-to-bracket"></i> Se connecter
            </a>
          </div>
        } @else {
          @if (email()) {
            <div class="email-chip">
              <i class="fa-solid fa-user-check"></i> {{ email() }}
            </div>
          }

          @if (errorMsg()) {
            <div class="alert-error">
              <i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg() }}
            </div>
          }

          <form (ngSubmit)="validerNouveauMotDePasse()" class="auth-form">
            <div class="form-group">
              <label for="newPassword">Nouveau mot de passe *</label>
              <div class="pwd-wrap">
                <input id="newPassword" [type]="showPwd() ? 'text' : 'password'" [ngModel]="newPassword()" (ngModelChange)="newPassword.set($event)" name="newPassword" placeholder="Minimum 6 caractères" required minlength="6">
                <button type="button" class="toggle-btn" (click)="showPwd.set(!showPwd())" aria-label="Afficher le mot de passe">
                  <i class="fa-solid" [class.fa-eye]="!showPwd()" [class.fa-eye-slash]="showPwd()"></i>
                </button>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmer le mot de passe *</label>
              <div class="pwd-wrap">
                <input id="confirmPassword" [type]="showConfirm() ? 'text' : 'password'" [ngModel]="confirmPassword()" (ngModelChange)="confirmPassword.set($event)" name="confirmPassword" placeholder="Répétez le mot de passe" required>
                <button type="button" class="toggle-btn" (click)="showConfirm.set(!showConfirm())" aria-label="Afficher la confirmation">
                  <i class="fa-solid" [class.fa-eye]="!showConfirm()" [class.fa-eye-slash]="showConfirm()"></i>
                </button>
              </div>
            </div>

            <button type="submit" class="btn-primary" [disabled]="submitting()">
              @if (submitting()) {
                <i class="fa-solid fa-spinner fa-spin"></i> Enregistrement...
              } @else {
                <i class="fa-solid fa-lock"></i> Enregistrer le nouveau mot de passe
              }
            </button>
          </form>
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
    .auth-brand p { margin: 0.45rem 0 0; font-size: 0.85rem; color: #6E5A56; }
    .email-chip { background: #FAF8F4; border: 1px solid #EDE7DC; border-radius: 9999px; padding: 0.4rem 0.9rem; font-size: 0.82rem; font-weight: 700; color: #721513; display: flex; align-items: center; justify-content: center; gap: 0.45rem; margin-bottom: 1.15rem; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.75rem; font-weight: 800; color: #332724; text-transform: uppercase; letter-spacing: 0.03em; }
    .form-group input { width: 100%; height: 44px; border: 1.5px solid #EDE7DC; border-radius: 12px; padding: 0 2.75rem 0 0.9rem; font-size: 0.9rem; box-sizing: border-box; background: #FAF8F4; }
    .form-group input:focus { outline: none; border-color: #721513; background: #FFFFFF; }
    .pwd-wrap { position: relative; }
    .toggle-btn { position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6E5A56; cursor: pointer; padding: 0.35rem; }
    .btn-primary { height: 46px; border: none; border-radius: 9999px; background: #721513; color: #FFFFFF; font-weight: 800; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .state-box { text-align: center; padding: 1.5rem 1rem; border-radius: 16px; border: 1.5px solid #EDE7DC; background: #FAF8F4; }
    .error-box { background: #FEF2F2; border-color: #FECACA; }
    .success-box { background: rgba(96, 108, 56, 0.08); border-color: #606C38; }
    .state-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .state-title { margin: 0 0 0.35rem; font-weight: 800; font-size: 1rem; }
    .state-desc { margin: 0; font-size: 0.84rem; color: #6E5A56; }
    .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  `]
})
export class B2bResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(B2bApiService);

  token = signal('');
  email = signal('');
  verifying = signal(true);
  invalidToken = signal(false);
  submitting = signal(false);
  done = signal(false);
  errorMsg = signal<string | null>(null);

  newPassword = signal('');
  confirmPassword = signal('');
  showPwd = signal(false);
  showConfirm = signal(false);

  ngOnInit() {
    const tokenParam = this.route.snapshot.queryParamMap.get('token') || '';
    this.token.set(tokenParam);
    if (!tokenParam) {
      this.verifying.set(false);
      this.invalidToken.set(true);
      this.errorMsg.set('Aucun jeton de réinitialisation trouvé dans le lien.');
      return;
    }

    this.api.verifyResetToken(tokenParam).subscribe({
      next: (res) => {
        this.verifying.set(false);
        if (res.success && res.data?.email) {
          this.email.set(res.data.email);
        } else {
          this.invalidToken.set(true);
          this.errorMsg.set(res.message || 'Lien invalide ou expiré.');
        }
      },
      error: (err) => {
        this.verifying.set(false);
        this.invalidToken.set(true);
        this.errorMsg.set(err?.error?.message || 'Ce lien de réinitialisation est invalide ou a expiré.');
      }
    });
  }

  validerNouveauMotDePasse() {
    this.errorMsg.set(null);
    if (!this.newPassword() || this.newPassword().length < 6) {
      this.errorMsg.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (this.newPassword() !== this.confirmPassword()) {
      this.errorMsg.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.submitting.set(true);
    this.api.resetPassword({ token: this.token(), newPassword: this.newPassword() }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.done.set(true);
        setTimeout(() => this.router.navigateByUrl('/b2b/login'), 2000);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err?.error?.message || 'Impossible de réinitialiser le mot de passe.');
      }
    });
  }
}
