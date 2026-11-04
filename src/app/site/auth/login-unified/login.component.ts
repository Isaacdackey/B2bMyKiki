import { Component, OnInit, ViewEncapsulation, ElementRef, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleConnexionService } from '../../../core/services/google-connexion.service';
import { KikiDataService } from '../../../services/kiki-data.service';

@Component({
  selector: 'app-login-unified',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  @ViewChild('boutonGoogle') boutonGoogle?: ElementRef<HTMLDivElement>;

  credentials = { username: '', password: '' };
  loading = false;
  showPassword = false;
  errorMessage = '';
  sessionExpired = false;
  isStaffLogin = false;
  googleDisponible = false;
  loginSlug = '';
  currentYear = new Date().getFullYear();

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private googleService: GoogleConnexionService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    // Si déjà connecté, rediriger
    if (this.auth.isLoggedIn()) {
      this.redirectByRole();
      return;
    }

    // Détecter slug personnalisé dans l'URL
    this.route.params.subscribe(params => {
      if (params['slug']) {
        this.loginSlug = params['slug'];
        this.isStaffLogin = true;
      } else {
        this.preparerGoogle();
      }
    });

    // Détecter session expirée
    this.route.queryParams.subscribe(params => {
      this.sessionExpired = !!params['expired'];
    });
  }

  private preparerGoogle(): void {
    this.googleService.estDisponible().subscribe({
      next: (config) => {
        if (!config.disponible || !config.clientId) {
          return;
        }
        this.googleDisponible = true;
        this.cdr.detectChanges();

        setTimeout(() => {
          if (!this.boutonGoogle) return;
          this.googleService
            .afficherBouton(config.clientId!, this.boutonGoogle.nativeElement,
                            (credential) => this.ngZone.run(() => this.connexionGoogle(credential)))
            .catch((e) => console.warn('Bouton Google indisponible :', e.message));
        });
      },
      error: () => { /* Google non configuré : on reste sur le formulaire classique. */ }
    });
  }

  private connexionGoogle(credential: string): void {
    this.loading = true;
    this.errorMessage = '';
    this.googleService.connecter(credential).subscribe({
      next: (res) => {
        this.loading = false;
        this.auth.enregistrerSession(res);
        this.dataService.showToast('Connexion Google réussie ! Redirection...', false);
        this.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || "La connexion avec Google n'a pas abouti.";
        this.dataService.showToast(this.errorMessage, true);
        this.cdr.detectChanges();
      }
    });
  }

  onLogin(): void {
    if (!this.credentials.username || !this.credentials.password) {
      this.errorMessage = 'Veuillez saisir votre identifiant et votre mot de passe.';
      this.dataService.showToast(this.errorMessage, true);
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.auth.login(
      this.credentials.username.trim(),
      this.credentials.password,
      this.loginSlug || undefined
    ).subscribe({
      next: (response) => {
        this.loading = false;
        this.dataService.showToast('Connexion réussie ! Redirection...', false);
        if (response.tempPasswordChangeRequired) {
          this.router.navigate(['/change-password']);
        } else {
          this.redirectByRole();
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = (typeof err.error === 'string' ? err.error : err.error?.message) || 'Identifiants incorrects. Vérifiez vos informations.';
        this.dataService.showToast(this.errorMessage, true);
      }
    });
  }

  private redirectByRole(): void {
    const user = this.auth.getCurrentUser();
    if (!user) { this.router.navigate(['/']); return; }

    switch (user.role) {
      case 'ADMIN':
      case 'GESTIONNAIRE':
      case 'PERSONNEL':
        this.router.navigate(['/gestionnaire/dashboard']);
        break;
      case 'CLIENT':
        this.router.navigate(['/mykiki']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  getLoginTitle(): string {
    return 'Connexion';
  }

  getLoginSubtitle(): string {
    return '';
  }
}
