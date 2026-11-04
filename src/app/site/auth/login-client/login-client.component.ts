import { Component, OnInit, NgZone, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { GoogleConnexionService } from '../../../core/services/google-connexion.service';
import { KikiDataService } from '../../../services/kiki-data.service';

@Component({
  selector: 'app-login-client',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login-client.component.html',
  styleUrl: './login-client.component.css'
})
export class LoginClientComponent implements OnInit {
  @ViewChild('boutonGoogle') boutonGoogle?: ElementRef<HTMLDivElement>;

  email = '';
  password = '';
  showPassword = false;
  message = '';
  isError = false;
  isLoading = false;
  googleDisponible = false;
  isStandalone = false;

  constructor(
    private router: Router, 
    private auth: AuthService,
    private googleService: GoogleConnexionService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true ||
                          window.location.search.includes('source=pwa') ||
                          localStorage.getItem('kiki_pwa_installed') === 'true';
    }
    this.preparerGoogle();
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
    this.isLoading = true;
    this.message = '';
    this.googleService.connecter(credential).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.auth.enregistrerSession(res);
        this.isError = false;
        this.message = 'Connexion Google réussie ! Redirection...';
        this.dataService.showToast('Connexion Google réussie ! Redirection...', false);
        this.router.navigate(['/mykiki']);
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        this.message = err.error?.message || "La connexion avec Google n'a pas abouti.";
        this.dataService.showToast(this.message, true);
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.isError = true;
      this.message = 'Veuillez saisir votre email et votre mot de passe.';
      this.dataService.showToast(this.message, true);
      return;
    }
    this.isLoading = true;
    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.isError = false;
        this.message = 'Connexion réussie ! Redirection...';
        this.dataService.showToast('Connexion réussie ! Redirection...', false);
        setTimeout(() => {
          this.router.navigate(['/mykiki']);
        }, 1200);
      },
      error: (err: any) => {
        this.isError = true;
        this.isLoading = false;
        this.message = err.error?.message || 'Identifiants incorrects.';
        this.dataService.showToast(this.message, true);
      }
    });
  }

  forgotPassword(): void {
    this.isError = false;
    this.message = 'Un email de réinitialisation vous a été envoyé.';
    this.dataService.showToast(this.message, false);
  }
}
