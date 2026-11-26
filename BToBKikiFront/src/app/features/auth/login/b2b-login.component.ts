import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { B2bApiService } from '../../../b2b/shared/b2b-api.service';
import { UserRoleB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-b2b-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './b2b-login.component.html',
  styleUrls: ['./b2b-login.component.css']
})
export class B2bLoginComponent {
  b2b = inject(B2bStateService);
  private api = inject(B2bApiService);
  private router = inject(Router);

  // Identifiants formulaire JWT
  username = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);

  // Modal d'auto-inscription Salarié Non Subventionné (Autonome)
  showRegisterAutonomeModal = signal(false);
  newAutonome = signal({
    prenom: '',
    nom: '',
    telephone: '+221 ',
    email: '',
    entrepriseId: 'ent-001',
    siteId: 'site-1',
    password: ''
  });
  registerSuccess = signal(false);

  ouvrirModalInscriptionAutonome() {
    this.showRegisterAutonomeModal.set(true);
    this.registerSuccess.set(false);
  }

  fermerModalInscriptionAutonome() {
    this.showRegisterAutonomeModal.set(false);
  }

  private formatSenegalPhone(raw: string): string {
    let digits = (raw || '').replace(/\D/g, '');
    if (digits.startsWith('00221')) digits = digits.slice(5);
    else if (digits.startsWith('221')) digits = digits.slice(3);
    digits = digits.slice(0, 9);

    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 7));
    if (digits.length > 7) parts.push(digits.slice(7, 9));

    return parts.length > 0 ? `+221 ${parts.join(' ')}` : '+221 ';
  }

  onTelephoneAutonomeChange(value: string) {
    const formatted = this.formatSenegalPhone(value);
    this.newAutonome.update(cur => ({ ...cur, telephone: formatted }));
  }

  onTelephoneAutonomeInput(event: Event) {
    const input = event.target as HTMLInputElement;
    const formatted = this.formatSenegalPhone(input.value);
    input.value = formatted;
    this.newAutonome.update(cur => ({ ...cur, telephone: formatted }));
  }

  inscrireAutonome() {
    const val = this.newAutonome();
    if (!val.nom?.trim() || !val.prenom?.trim() || !val.telephone?.trim()) {
      this.b2b.showToast('Veuillez renseigner votre prénom, nom et numéro de téléphone.', 'error');
      return;
    }

    const phoneClean = val.telephone.replace(/[\s-]/g, '');
    if (!/^(\+221)?(70|75|76|77|78)\d{7}$/.test(phoneClean)) {
      this.b2b.showToast('Numéro Téléphone / Wave invalide (ex: +221 77 123 45 67).', 'error');
      return;
    }

    if (val.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.email.trim())) {
      this.b2b.showToast('Adresse email professionnelle invalide.', 'error');
      return;
    }

    this.loading.set(true);
    this.api.registerAutonome({
      prenom: val.prenom,
      nom: val.nom,
      telephone: val.telephone,
      email: val.email,
      siteId: val.siteId,
      password: val.password || 'Kiki2026!'
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          if (typeof localStorage !== 'undefined' && res.data.token) {
            localStorage.setItem('b2b_jwt_token', res.data.token);
          }
          this.registerSuccess.set(true);
          this.b2b.setSessionRole({
            role: res.data.role,
            nomComplet: res.data.nomComplet,
            titrePoste: res.data.titrePoste,
            entite: res.data.entite,
            email: res.data.email || val.email,
            entrepriseId: res.data.entrepriseId || val.entrepriseId,
            badge: res.data.badge,
            badgeColor: res.data.badgeColor,
            siteId: res.data.siteId,
            siteNom: res.data.siteNom,
            matricule: res.data.matricule
          });
          this.b2b.syncFromBackend();
          setTimeout(() => {
            this.showRegisterAutonomeModal.set(false);
            this.router.navigateByUrl('/b2b/commande');
          }, 800);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.b2b.showToast(err?.error?.message || 'Erreur lors de la création du compte autonome.', 'error');
      }
    });
  }

  seConnecter() {
    this.loading.set(true);
    this.api.login(this.username(), this.password()).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success && res.data) {
          if (typeof localStorage !== 'undefined' && res.data.token) {
            localStorage.setItem('b2b_jwt_token', res.data.token);
          }
          const role = res.data.role as UserRoleB2B;
          if (role === 'SUPER_ADMIN') {
            this.b2b.superAdminActiveSection.set('DASHBOARD');
          } else if (role === 'RESPONSABLE_ENTREPRISE') {
            this.b2b.rhActiveSection.set('STATISTIQUES');
          } else if (role === 'RESPONSABLE_SITE_KIKI') {
            this.b2b.cuisineActiveTab.set('MENU');
          }
          this.b2b.setSessionRole({
            role,
            nomComplet: res.data.nomComplet,
            titrePoste: res.data.titrePoste,
            entite: res.data.entite,
            email: res.data.email || this.username(),
            entrepriseId: res.data.entrepriseId,
            badge: res.data.badge,
            badgeColor: res.data.badgeColor,
            siteId: res.data.siteId,
            siteNom: res.data.siteNom,
            matricule: res.data.matricule
          });
          this.b2b.syncFromBackend();

          const dest =
            role === 'SUPER_ADMIN' ? '/b2b/super-admin' :
            role === 'RESPONSABLE_ENTREPRISE' ? '/b2b/rh' :
            role === 'RESPONSABLE_SITE_KIKI' ? '/b2b/cuisine' :
            '/b2b/commande';
          this.router.navigateByUrl(dest);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.b2b.showToast(err?.error?.message || 'Identifiants invalides ou serveur backend indisponible.', 'error');
      }
    });
  }
}

