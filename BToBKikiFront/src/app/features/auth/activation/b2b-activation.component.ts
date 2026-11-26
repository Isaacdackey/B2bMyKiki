import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { B2bApiService } from '../../../b2b/shared/b2b-api.service';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { UserRoleB2B } from '../../../b2b/shared/b2b.models';

interface InvitationDetails {
  email: string;
  nomComplet: string;
  role: string;
  roleLibelle: string;
  entrepriseId: string;
  entrepriseNom: string;
  statut: string;
}

@Component({
  selector: 'app-b2b-activation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <img src="assets/images/logo.png" alt="Kiki Traiteur" onerror="this.src='assets/images/KIKI TRAITEUR Logo Picto Rouge bordeau.png'">
          <h1 class="font-serif-luxury">Kiki Traiteur <span class="badge-pro">B2B Pro</span></h1>
          <p>Activation de votre Espace {{ invitation()?.roleLibelle || 'Collaborateur B2B' }}</p>
        </div>

        @if (verifying()) {
          <div class="state-box">
            <i class="fa-solid fa-spinner fa-spin state-icon" style="color: #721513;"></i>
            <p class="state-title">Vérification de votre invitation...</p>
            <p class="state-desc">Un instant, nous contrôlons la validité de votre lien d'activation.</p>
          </div>
        } @else if (errorMsg() && !invitation()) {
          <div class="state-box error-box">
            <i class="fa-solid fa-triangle-exclamation state-icon" style="color: #DC2626;"></i>
            <p class="state-title" style="color: #991B1B;">Lien d'activation indisponible</p>
            <p class="state-desc">{{ errorMsg() }}</p>
            <a routerLink="/b2b/login" class="btn-secondary">
              <i class="fa-solid fa-arrow-left"></i> Retour à la connexion
            </a>
          </div>
        } @else if (activated()) {
          <div class="state-box success-box">
            <i class="fa-solid fa-circle-check state-icon" style="color: #606C38;"></i>
            <p class="state-title" style="color: #3F4A22;">Compte activé avec succès !</p>
            <p class="state-desc">Redirection vers votre portail {{ invitation()?.roleLibelle }}...</p>
          </div>
        } @else if (invitation()) {
          <div class="invite-summary">
            <div class="invite-row">
              <span class="invite-label">Entreprise</span>
              <strong>{{ invitation()!.entrepriseNom }}</strong>
            </div>
            <div class="invite-row">
              <span class="invite-label">Rôle attribué</span>
              <span class="role-pill">{{ invitation()!.roleLibelle }}</span>
            </div>
            <div class="invite-row">
              <span class="invite-label">Email</span>
              <span>{{ invitation()!.email }}</span>
            </div>
          </div>

          @if (errorMsg()) {
            <div class="alert-error">
              <i class="fa-solid fa-circle-exclamation"></i> {{ errorMsg() }}
            </div>
          }

          <form (ngSubmit)="activerCompte()" class="auth-form">
            <div class="form-group">
              <label for="nomComplet">Nom complet</label>
              <input id="nomComplet" type="text" [ngModel]="nomComplet()" (ngModelChange)="nomComplet.set($event)" name="nomComplet" required>
            </div>

            <div class="form-group">
              <label for="password">Définir votre mot de passe *</label>
              <div class="pwd-wrap">
                <input id="password" [type]="showPwd() ? 'text' : 'password'" [ngModel]="password()" (ngModelChange)="password.set($event)" name="password" placeholder="Minimum 6 caractères" required minlength="6">
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
                <i class="fa-solid fa-spinner fa-spin"></i> Activation en cours...
              } @else {
                <i class="fa-solid fa-shield-check"></i> Activer mon compte et accéder
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh;
      background: linear-gradient(160deg, #FAF8F4 0%, #F4EDE2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 480px;
      background: #FFFFFF;
      border: 1.5px solid #EDE7DC;
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 18px 42px rgba(114, 21, 19, 0.08);
    }
    .auth-brand { text-align: center; margin-bottom: 1.5rem; }
    .auth-brand img { height: 48px; width: auto; object-fit: contain; margin-bottom: 0.65rem; }
    .auth-brand h1 { margin: 0; font-size: 1.45rem; color: #721513; font-weight: 900; display: flex; align-items: center; justify-content: center; gap: 0.5rem; flex-wrap: wrap; }
    .auth-brand p { margin: 0.35rem 0 0; font-size: 0.85rem; color: #6E5A56; }
    .badge-pro { background: #E51D24; color: #FFFFFF; font-size: 0.68rem; font-weight: 800; padding: 0.18rem 0.55rem; border-radius: 9999px; font-family: sans-serif; text-transform: uppercase; }
    .invite-summary { background: #FAF8F4; border: 1.5px solid #EDE7DC; border-radius: 14px; padding: 0.9rem 1rem; margin-bottom: 1.25rem; display: flex; flex-direction: column; gap: 0.55rem; font-size: 0.85rem; }
    .invite-row { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .invite-label { color: #6E5A56; font-weight: 600; font-size: 0.78rem; }
    .role-pill { background: rgba(114, 21, 19, 0.1); color: #721513; font-weight: 800; font-size: 0.76rem; padding: 0.2rem 0.65rem; border-radius: 9999px; }
    .auth-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-group label { font-size: 0.75rem; font-weight: 800; color: #332724; text-transform: uppercase; letter-spacing: 0.03em; }
    .form-group input { width: 100%; height: 44px; border: 1.5px solid #EDE7DC; border-radius: 12px; padding: 0 0.9rem; font-size: 0.9rem; box-sizing: border-box; background: #FAF8F4; }
    .form-group input:focus { outline: none; border-color: #721513; background: #FFFFFF; }
    .pwd-wrap { position: relative; }
    .pwd-wrap input { padding-right: 2.75rem; }
    .toggle-btn { position: absolute; right: 0.65rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #6E5A56; cursor: pointer; padding: 0.35rem; }
    .btn-primary { height: 46px; border: none; border-radius: 9999px; background: #721513; color: #FFFFFF; font-weight: 800; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%; margin-top: 0.25rem; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; height: 42px; padding: 0 1.25rem; border-radius: 9999px; border: 1.5px solid #EDE7DC; background: #FFFFFF; color: #721513; font-weight: 700; font-size: 0.85rem; text-decoration: none; margin-top: 0.75rem; }
    .state-box { text-align: center; padding: 1.5rem 1rem; border-radius: 16px; background: #FAF8F4; border: 1.5px solid #EDE7DC; }
    .error-box { background: #FEF2F2; border-color: #FECACA; }
    .success-box { background: rgba(96, 108, 56, 0.08); border-color: #606C38; }
    .state-icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .state-title { margin: 0 0 0.35rem; font-weight: 800; font-size: 1rem; color: #1E293B; }
    .state-desc { margin: 0; font-size: 0.84rem; color: #6E5A56; }
    .alert-error { background: #FEF2F2; border: 1px solid #FECACA; color: #B91C1C; border-radius: 10px; padding: 0.65rem 0.85rem; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem; }
  `]
})
export class B2bActivationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(B2bApiService);
  private b2b = inject(B2bStateService);

  token = signal('');
  verifying = signal(true);
  submitting = signal(false);
  activated = signal(false);
  errorMsg = signal<string | null>(null);
  invitation = signal<InvitationDetails | null>(null);

  nomComplet = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPwd = signal(false);
  showConfirm = signal(false);

  ngOnInit() {
    const tokenParam = this.route.snapshot.queryParamMap.get('token') || '';
    this.token.set(tokenParam);
    if (!tokenParam) {
      this.verifying.set(false);
      this.errorMsg.set("Aucun token d'activation n'a été fourni dans le lien.");
      return;
    }

    this.api.verifyInvitation(tokenParam).subscribe({
      next: (res) => {
        this.verifying.set(false);
        if (res.success && res.data) {
          this.invitation.set(res.data);
          this.nomComplet.set(res.data.nomComplet || '');
        } else {
          this.errorMsg.set(res.message || "Lien d'activation invalide.");
        }
      },
      error: (err) => {
        this.verifying.set(false);
        this.errorMsg.set(err?.error?.message || "Ce lien d'activation est invalide ou a expiré.");
      }
    });
  }

  activerCompte() {
    this.errorMsg.set(null);
    if (!this.password() || this.password().length < 6) {
      this.errorMsg.set('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.errorMsg.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.submitting.set(true);
    this.api.activateInvitation({
      token: this.token(),
      password: this.password(),
      nomComplet: this.nomComplet().trim() || undefined
    }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res.success && res.data) {
          if (typeof localStorage !== 'undefined' && res.data.token) {
            localStorage.setItem('b2b_jwt_token', res.data.token);
          }
          const role = res.data.role as UserRoleB2B;
          if (role === 'RESPONSABLE_ENTREPRISE') {
            this.b2b.rhActiveSection.set('STATISTIQUES');
          } else if (role === 'RESPONSABLE_SITE_KIKI') {
            this.b2b.cuisineActiveTab.set('MENU');
          }
          this.b2b.setSessionRole({
            role,
            nomComplet: res.data.nomComplet,
            titrePoste: res.data.titrePoste,
            entite: res.data.entite,
            email: res.data.email || this.invitation()?.email,
            entrepriseId: res.data.entrepriseId || this.invitation()?.entrepriseId,
            badge: res.data.badge,
            badgeColor: res.data.badgeColor,
            siteId: res.data.siteId,
            siteNom: res.data.siteNom,
            matricule: res.data.matricule
          });
          this.b2b.syncFromBackend();
          this.activated.set(true);

          const dest =
            role === 'SUPER_ADMIN' ? '/b2b/super-admin' :
            role === 'RESPONSABLE_SITE_KIKI' ? '/b2b/cuisine' :
            role === 'RESPONSABLE_ENTREPRISE' ? '/b2b/rh' :
            '/b2b/commande';
          setTimeout(() => this.router.navigateByUrl(dest), 1100);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err?.error?.message || "Impossible d'activer votre compte.");
      }
    });
  }
}
