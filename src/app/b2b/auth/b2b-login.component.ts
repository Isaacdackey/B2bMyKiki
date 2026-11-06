import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { B2bStateService } from '../shared/b2b-state.service';

export interface ProfilDemo {
  id: string;
  nom: string;
  roleTitre: string;
  badge: string;
  badgeColor: string;
  identifiant: string;
  description: string;
  icone: string;
  type: 'SUBVENTIONNE' | 'AUTONOME' | 'RH' | 'CUISINE';
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
  username = signal('b.ndiaye@totalenergies.sn');
  password = signal('••••••••');
  showPassword = signal(false);
  loading = signal(false);

  // Profils démo 1-Clic
  profilsDemo: ProfilDemo[] = [
    {
      id: 'subventionne',
      nom: 'Babacar Ndiaye',
      roleTitre: 'Salarié Conventionné (Subventionné 100%)',
      badge: 'Prise en charge RH • 0 F',
      badgeColor: '#606C38',
      identifiant: 'TOT-9842 • Finance & Comptabilité',
      description: 'Accède directement au menu du jour avec formule 4 composantes 100% prise en charge par TotalEnergies.',
      icone: 'fa-solid fa-building-shield',
      type: 'SUBVENTIONNE',
      destinationUrl: '/b2b/commande'
    },
    {
      id: 'autonome',
      nom: 'Ousmane Ba (Prestataire IT)',
      roleTitre: 'Salarié Autonome (Frais Personnels)',
      badge: 'Règlement Wave direct',
      badgeColor: '#1D4ED8',
      identifiant: 'TOT-EXT-01 • Direction Projet IT',
      description: 'Accède au comptoir digital avec commande à la carte et paiement direct par Wave Mobile Money.',
      icone: 'fa-solid fa-wallet',
      type: 'AUTONOME',
      destinationUrl: '/b2b/commande'
    },
    {
      id: 'rh',
      nom: 'Fatou Fall (Responsable RH)',
      roleTitre: 'Espace RH & Rapprochement',
      badge: 'Pilotage & Facturation B2B',
      badgeColor: '#721513',
      identifiant: 'RH-DIR • Siège Dakar Plateau',
      description: 'Pilote les quotas, suit les consommations par site et génère les factures mensuelles proforma.',
      icone: 'fa-solid fa-chart-pie',
      type: 'RH',
      destinationUrl: '/b2b/rh'
    },
    {
      id: 'cuisine',
      nom: 'Chef Mamadou Seck (Brigade)',
      roleTitre: 'Cuisine Centrale & Dispatch',
      badge: 'Production & Scanner BL',
      badgeColor: '#E51D24',
      identifiant: 'CHEF-01 • Cuisine Centrale Hann',
      description: 'Consolidation des portions du jour, scanner de retrait QR code et émargement des bordereaux.',
      icone: 'fa-solid fa-fire-burner',
      type: 'CUISINE',
      destinationUrl: '/b2b/cuisine'
    }
  ];

  selectionnerProfilDemo(p: ProfilDemo) {
    this.loading.set(true);
    if (p.type === 'SUBVENTIONNE' || p.type === 'AUTONOME') {
      this.b2b.setModeProfil(p.type);
    }
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigateByUrl(p.destinationUrl);
    }, 400);
  }

  seConnecter() {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
      this.b2b.setModeProfil('SUBVENTIONNE');
      this.router.navigateByUrl('/b2b/commande');
    }, 500);
  }
}

