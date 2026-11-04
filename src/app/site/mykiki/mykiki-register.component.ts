import { Component, OnInit, ChangeDetectorRef, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { GoogleConnexionService } from '../../core/services/google-connexion.service';
import { KikiDataService } from '../../services/kiki-data.service';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

const API = environment.apiUrl;

@Component({
  selector: 'app-mykiki-register',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule],
  templateUrl: './mykiki-register.component.html',
  styleUrl: './mykiki-register.component.css'
})
export class MyKikiRegisterComponent implements OnInit {
  step = 1;
  loading = false;
  error = '';
  showPwd = false;

  form = {
    fullName: '',
    email: '',
    phone: '',
    type: 'particulier',
    organization: '',
    password: ''
  };

  isHumanChecked = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private auth: AuthService,
    private googleService: GoogleConnexionService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  /** Vrai lorsque le serveur dispose d'un identifiant client OAuth. */
  googleDisponible = false;

  /** Points offerts à l'ouverture du compte, tels que renvoyés par le serveur. */
  pointsOfferts = 0;

  @ViewChild('boutonGoogle') boutonGoogle?: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.preparerGoogle();
  }

  /**
   * Le bouton Google n'est affiché que si le serveur est configuré : proposer
   * une connexion qui échouera systématiquement serait pire que de ne rien
   * proposer.
   */
  private preparerGoogle(): void {
    this.googleService.estDisponible().subscribe({
      next: (config) => {
        if (!config.disponible || !config.clientId) {
          return;
        }
        this.googleDisponible = true;
        this.cdr.detectChanges();

        // Le conteneur n'existe qu'une fois le @if résolu.
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
    this.error = '';
    this.googleService.connecter(credential).subscribe({
      next: (res) => {
        this.loading = false;
        // Même stockage que la connexion classique, pour que les guards et
        // l'intercepteur JWT fonctionnent sans cas particulier.
        this.auth.enregistrerSession(res);
        this.dataService.showToast('Compte Google connecté avec succès !', false);
        this.router.navigate(['/mykiki']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || "La connexion avec Google n'a pas abouti.";
        this.dataService.showToast(this.error, true);
        this.cdr.detectChanges();
      }
    });
  }

  isStep1Valid(): boolean {
    return !!(this.form.fullName && this.form.email && this.form.password && this.form.password.length >= 8);
  }

  getPasswordStrengthClass(): string {
    const p = this.form.password;
    if (!p) return '';
    if (p.length < 8) return 'weak';
    if (p.length >= 8 && (/[A-Z]/.test(p) || /[0-9]/.test(p))) return 'medium';
    if (p.length >= 10 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 'strong';
    return 'medium';
  }

  getPasswordStrengthLabel(): string {
    const cls = this.getPasswordStrengthClass();
    return { '': '', weak: 'Faible (min 8 caractères)', medium: 'Moyen', strong: 'Fort ✓' }[cls] || '';
  }

  onRegister(): void {
    if (!this.isStep1Valid()) {
      this.error = 'Veuillez remplir tous les champs obligatoires (mot de passe min. 8 caractères).';
      this.dataService.showToast(this.error, true);
      return;
    }

    this.loading = true;
    this.error = '';

    const payload = {
      fullName: this.form.fullName,
      email: this.form.email,
      phone: this.form.phone,
      type: this.form.type,
      organization: this.form.organization,
      password: this.form.password
    };

    this.http.post<any>(`${API}/api/mykiki/register`, payload).pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (reponse: any) => {
        this.pointsOfferts = reponse?.pointsOfferts ?? 50;
        this.dataService.showToast('Compte MyKiki créé avec succès !', false);

        // Auto-login après inscription
        this.auth.login(this.form.email, this.form.password).subscribe({
          next: () => { 
            this.step = 2; 
            this.cdr.detectChanges();
          },
          error: () => { 
            this.step = 2; 
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error("Erreur register:", err);
        this.error = err.error?.message || 'Erreur lors de la création du compte. Veuillez réessayer.';
        this.dataService.showToast(this.error, true);
        this.cdr.detectChanges();
      }
    });
  }

  goToMykiki(): void {
    this.router.navigate(['/mykiki']);
  }
}
