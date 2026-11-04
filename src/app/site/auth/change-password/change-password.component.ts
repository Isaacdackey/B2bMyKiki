import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { KikiDataService } from '../../../services/kiki-data.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css'
})
export class ChangePasswordComponent implements OnInit {
  newPwd = '';
  confirm = '';
  loading = false;
  error = '';
  success = false;

  showNew = false;
  showConfirm = false;

  get isForced(): boolean {
    return !!this.auth.getCurrentUser()?.tempPasswordChangeRequired;
  }

  constructor(
    private auth: AuthService,
    private router: Router,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Si l'utilisateur n'est pas connecté, le renvoyer vers la page de login
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
    }
  }

  getStrengthClass(): string {
    const p = this.newPwd;
    if (!p) return '';
    if (p.length < 8) return 'weak';
    if (p.length >= 8 && (/[A-Z]/.test(p) || /[0-9]/.test(p))) return 'medium';
    if (p.length >= 10 && /[A-Z]/.test(p) && /[0-9]/.test(p)) return 'strong';
    return 'medium';
  }

  getStrengthLabel(): string {
    const cls = this.getStrengthClass();
    return {
      '': '',
      'weak': 'Faible (min. 8 caractères)',
      'medium': 'Moyen',
      'strong': 'Robuste & Sécurisé ✓'
    }[cls] || '';
  }

  onSubmit(): void {
    if (!this.newPwd || this.newPwd.length < 8) {
      this.error = 'Le nouveau mot de passe doit comporter au moins 8 caractères.';
      this.dataService.showToast(this.error, true);
      return;
    }

    if (this.newPwd !== this.confirm) {
      this.error = 'Les deux mots de passe ne sont pas identiques.';
      this.dataService.showToast(this.error, true);
      return;
    }

    this.loading = true;
    this.error = '';

    // Envoi du nouveau mot de passe (sans ancien mot de passe puisque l'utilisateur est déjà authentifié via son token de première connexion)
    this.auth.changePassword('', this.newPwd).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.dataService.showToast('Votre mot de passe a été modifié avec succès.');
        this.cdr.detectChanges();

        setTimeout(() => {
          const user = this.auth.getCurrentUser();
          if (user?.role === 'CLIENT') {
            this.router.navigate(['/mykiki']);
          } else {
            this.router.navigate(['/gestionnaire/dashboard']);
          }
        }, 1200);
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || (typeof err.error === 'string' ? err.error : 'Erreur lors du changement de mot de passe.');
        this.dataService.showToast(this.error, true);
        this.cdr.detectChanges();
      }
    });
  }

  onLogout(): void {
    this.auth.logout();
  }
}


