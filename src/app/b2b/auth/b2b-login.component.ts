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

  // 5 PROFILS OFFICIELS DU CDCF (Y COMPRIS LE SUPER ADMIN KIKI TRAITEUR)
  profilsDemo: ProfilDemo[] = [
    {
      id: 'super-admin-kiki',
      nom: 'Direction Kiki Traiteur',
      roleTitre: 'Super Admin Kiki (Global)',
      badge: 'Direction Générale',
      badgeColor: '#721513',
      identifiant: 'admin.general@kikitraiteur.sn',
      description: 'Gestion globale de toutes les entreprises, création des sites, contractualisation des tarifs, gestion du catalogue (archivage/création) et supervision.',
      icone: 'fa-solid fa-crown',
      role: 'SUPER_ADMIN',
      destinationUrl: '/b2b/super-admin'
    },
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

  inscrireAutonome() {
    const val = this.newAutonome();
    if (!val.nom || !val.prenom || !val.telephone) {
      alert('Veuillez renseigner votre prénom, nom et numéro de téléphone.');
      return;
    }

    const matricule = `AUTO-${Date.now().toString().slice(-4)}`;
    const site = this.b2b.currentEntreprise().sites.find(s => s.id === val.siteId);

    // Enrôler l'employé en mode Autonome (0% subvention)
    this.b2b.ajouterEmploye({
      matricule,
      nom: val.nom,
      prenom: val.prenom,
      email: val.email || `${val.prenom.toLowerCase()}.${val.nom.toLowerCase()}@collaborateur.sn`,
      telephone: val.telephone,
      siteId: val.siteId,
      siteNom: site ? site.nom : 'Siège Plateau',
      departement: 'Collaborateur Autonome',
      type: 'AUTONOME',
      tauxSubvention: 0
    });

    this.registerSuccess.set(true);

    setTimeout(() => {
      this.showRegisterAutonomeModal.set(false);
      // Connecter directement l'utilisateur
      this.b2b.setSessionRole({
        role: 'SALARIE_AUTONOME',
        nomComplet: `${val.prenom} ${val.nom}`,
        titrePoste: 'Salarié Autonome (Frais Personnels)',
        entite: this.b2b.currentEntreprise().nom,
        badge: 'Paiement direct Wave',
        badgeColor: '#1D4ED8',
        siteId: val.siteId,
        siteNom: site ? site.nom : 'Siège Plateau'
      });
      this.router.navigateByUrl('/b2b/commande');
    }, 1200);
  }

  selectionnerProfilDemo(p: ProfilDemo) {
    this.loading.set(true);

    if (p.role === 'SUPER_ADMIN') {
      this.b2b.superAdminActiveSection.set('DASHBOARD');
    }

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
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
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

