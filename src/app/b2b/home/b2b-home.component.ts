import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { B2bStateService } from '../shared/b2b-state.service';
import { UserRoleB2B } from '../shared/b2b.models';

interface PortailCarte {
  role: UserRoleB2B;
  titre: string;
  sousTitre: string;
  description: string;
  icone: string;
  badge: string;
  couleur: string;
  destination: string;
  nomDemo: string;
  entiteDemo: string;
}

@Component({
  selector: 'app-b2b-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './b2b-home.component.html',
  styleUrls: ['./b2b-home.component.css']
})
export class B2bHomeComponent {
  b2b = inject(B2bStateService);
  private router = inject(Router);

  menuMobileOuvert = signal(false);

  readonly prestationsB2B = [
    {
      icone: 'fa-solid fa-fire-burner',
      titre: 'Cuisine & Service sur Place',
      badge: 'Restauration intégrée',
      description: 'Installation et exploitation complète de votre restaurant d\'entreprise avec notre brigade sur site : préparation fraîche et service continu.'
    },
    {
      icone: 'fa-solid fa-utensils',
      titre: 'Service sur Place (Réfectoire)',
      badge: 'Cantine clé en main',
      description: 'Repas cuisinés dans nos cuisines centrales de Hann Maristes, acheminés en liaison chaude et servis à l\'assiette dans votre réfectoire.'
    },
    {
      icone: 'fa-solid fa-box-open',
      titre: 'Livraison en Barquettes',
      badge: 'Flexibilité maximale',
      description: 'Conditionnement individuel éco-responsable, étiquetage nominatif par salarié et livraison ponctuelle avant la pause déjeuner.'
    }
  ];

  readonly etapesFlux = [
    {
      numero: '01',
      titre: 'Menu Planifié & Quotas',
      texte: 'La direction Kiki et le responsable de site planifient les menus de la semaine et vérifient la conformité des quantités.'
    },
    {
      numero: '02',
      titre: 'Commande & Cut-Off',
      texte: 'Chaque collaborateur commande ses repas de la semaine avant l\'heure limite (J-1 ou Jour J), avec règlement Wave si non subventionné.'
    },
    {
      numero: '03',
      titre: 'Scan QR Code Cantine',
      texte: 'Sur place, le salarié scanne le QR Code du jour projeté au réfectoire : sa commande passe à « Scanné » puis « Livré ».'
    },
    {
      numero: '04',
      titre: 'Pilotage RH & Facture',
      texte: 'La RH suit les repas consommés en temps réel, gère les taux de subvention (0% à 100%) et exporte la facture consolidée.'
    }
  ];

  readonly portails: PortailCarte[] = [
    {
      role: 'SALARIE_CONVENTIONNE',
      titre: 'Espace Collaborateur',
      sousTitre: 'Salarié Subventionné ou Autonome',
      description: 'Commandez vos repas de la semaine, consultez les stocks en direct et débloquez votre plateau par QR Code.',
      icone: 'fa-solid fa-user-check',
      badge: 'Commande & QR',
      couleur: '#606C38',
      destination: '/b2b/commande',
      nomDemo: 'Moussa Ndiaye',
      entiteDemo: 'TotalEnergies Sénégal'
    },
    {
      role: 'RESPONSABLE_ENTREPRISE',
      titre: 'Portail RH & Entreprise',
      sousTitre: 'Pilotage & Facturation',
      description: 'Gérez vos collaborateurs, ajustez les taux de prise en charge (0% à 100%) et suivez la facturation mensuelle.',
      icone: 'fa-solid fa-briefcase',
      badge: 'Admin RH',
      couleur: '#721513',
      destination: '/b2b/rh',
      nomDemo: 'Mme Fatou Fall',
      entiteDemo: 'TotalEnergies Sénégal'
    },
    {
      role: 'RESPONSABLE_SITE_KIKI',
      titre: 'Responsable de Site',
      sousTitre: 'Exploitation & Distribution',
      description: 'Saisissez les quotas du jour, projetez le QR Code cantine, gérez les retards cut-off et validez les remises.',
      icone: 'fa-solid fa-qrcode',
      badge: 'Site & Cantine',
      couleur: '#C05621',
      destination: '/b2b/cuisine',
      nomDemo: 'M. Babacar Samb',
      entiteDemo: 'Kiki Traiteur Exploitation'
    },
    {
      role: 'SUPER_ADMIN',
      titre: 'Super Admin Kiki',
      sousTitre: 'Direction Multi-Entreprises',
      description: 'Supervisez l\'ensemble des entreprises clientes, le catalogue global, les menus hebdomadaires et le chiffre d\'affaires.',
      icone: 'fa-solid fa-crown',
      badge: 'Direction Kiki',
      couleur: '#332724',
      destination: '/b2b/super-admin',
      nomDemo: 'Direction Kiki Traiteur',
      entiteDemo: 'Kiki Traiteur Siège'
    }
  ];

  toggleMenuMobile() {
    this.menuMobileOuvert.update(v => !v);
  }

  ouvrirPortail(p: PortailCarte) {
    if (p.role === 'SUPER_ADMIN') {
      this.b2b.superAdminActiveSection.set('DASHBOARD');
    }
    this.b2b.setSessionRole({
      role: p.role,
      nomComplet: p.nomDemo,
      titrePoste: p.sousTitre,
      entite: p.entiteDemo,
      badge: p.badge,
      badgeColor: p.couleur,
      siteId: 'site-1',
      siteNom: 'Siège Plateau - Dakar'
    });
    this.router.navigateByUrl(p.destination);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

