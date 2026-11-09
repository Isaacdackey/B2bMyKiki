import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { B2bStateService } from '../shared/b2b-state.service';
import { UserRoleB2B } from '../shared/b2b.models';

export interface ProfilDemo {
  id: string;
  nom: string;
  roleTitre: string;
  badge: string;
  badgeColor: string;
  identifiant: string;
  description: string;
  icone: string;
  role: UserRoleB2B;
  destinationUrl: string;
}

@Component({
  selector: 'app-b2b-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './b2b-login.component.html',
  styleUrls: ['./b2b-login.component.css']
})
export class B2bLoginComponent {
  b2b = inject(B2bStateService);
  private router = inject(Router);

  // Identifiants formulaire libre
  username = signal('rh@totalenergies.sn');
  password = signal('••••••••');
  showPassword = signal(false);
  loading = signal(false);

  // 4 PROFILS OFFICIELS EXIGÉS PAR LE MENTOR TONTON FUFU
  profilsDemo: ProfilDemo[] = [
    {
      id: 'responsable-entreprise',
      nom: 'Mme Fatou Fall',
      roleTitre: 'Responsable de l’Entreprise',
      badge: 'Admin RH & Moyens Généraux',
      badgeColor: '#721513',
      identifiant: 'TotalEnergies Sénégal • RH Siège',
      description: 'Gère la liste des salariés, active/bloque les droits de subvention, suit les consommations par site et valide la facture mensuelle proforma.',
      icone: 'fa-solid fa-briefcase',
      role: 'RESPONSABLE_ENTREPRISE',
      destinationUrl: '/b2b/rh'
    },
    {
      id: 'responsable-site-kiki',
      nom: 'M. Babacar Samb',
      roleTitre: 'Responsable de Site Kiki',
      badge: 'Exploitation & Cantine Traiteur',
      badgeColor: '#C05621',
      identifiant: 'Kiki Traiteur • Gérant de Site & Dispatch',
      description: 'Supervise la cantine sur site, contrôle les réceptions de plats chauds, suit les portions prévues, valide les BL et scanne les QR codes de retrait.',
      icone: 'fa-solid fa-clipboard-check',
      role: 'RESPONSABLE_SITE_KIKI',
      destinationUrl: '/b2b/cuisine'
    },
    {
      id: 'salarie-conventionne',
      nom: 'Babacar Ndiaye',
      roleTitre: 'Salarié Conventionné (Pris en charge)',
      badge: 'Subventionné 100% • 0 FCFA',
      badgeColor: '#2E7D32',
      identifiant: 'TOT-9842 • Finance & Comptabilité',
      description: 'Choisit sa formule déjeuner 4 composantes 100% prise en charge par TotalEnergies, valide sa commande et obtient son QR Code personnel de retrait.',
      icone: 'fa-solid fa-user-shield',
      role: 'SALARIE_CONVENTIONNE',
      destinationUrl: '/b2b/commande'
    },
    {
      id: 'salarie-autonome',
      nom: 'Ousmane Ba (Prestataire IT)',
      roleTitre: 'Salarié Autonome (Frais Personnels)',
      badge: 'Paiement direct Wave',
      badgeColor: '#1D4ED8',
      identifiant: 'TOT-EXT-01 • Consultant IT Externe',
      description: 'Commande librement ses plats à la carte sur le comptoir digital et règle directement par Wave Mobile Money avant retrait.',
      icone: 'fa-solid fa-mobile-screen-button',
      role: 'SALARIE_AUTONOME',
      destinationUrl: '/b2b/commande'
    }
  ];

  selectionnerProfilDemo(p: ProfilDemo) {
    this.loading.set(true);

    this.b2b.setSessionRole({
      role: p.role,
      nomComplet: p.nom,
      titrePoste: p.roleTitre,
      entite: p.role === 'RESPONSABLE_SITE_KIKI' ? 'Kiki Traiteur Exploitation' : 'TotalEnergies Sénégal',
      badge: p.badge,
      badgeColor: p.badgeColor,
      siteId: 'site-1',
      siteNom: 'Siège Plateau - Dakar'
    });

    setTimeout(() => {
      this.loading.set(false);
      this.router.navigateByUrl(p.destinationUrl);
    }, 350);
  }

  seConnecter() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      // Connexion par défaut Responsable Entreprise
      this.selectionnerProfilDemo(this.profilsDemo[0]);
    }, 450);
  }
}

