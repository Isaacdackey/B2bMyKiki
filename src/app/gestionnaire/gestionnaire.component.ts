import { Component, OnInit, HostListener, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { LoadingService } from './services/loading.service';
import { Observable } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { KikiDataService } from '../services/kiki-data.service';
import { GestionnaireDataService } from './services/gestionnaire-data.service';
import { NotificationBellComponent } from '../shared/notifications/notification-bell.component';
import { UploadBackgroundService } from '../services/upload-background.service';

@Component({
  selector: 'app-gestionnaire-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  templateUrl: './gestionnaire.component.html',
  styleUrls: ['./gestionnaire.css']
})
export class GestionnaireLayoutComponent implements OnInit {
  isLoading$: Observable<boolean>;

  /** État du menu latéral sur mobile */
  isSidebarOpen = false;

  constructor(
    private router: Router,
    private loadingService: LoadingService,
    private dataService: KikiDataService,
    private gData: GestionnaireDataService,
    private auth: AuthService,
    public uploadBg: UploadBackgroundService
  ) {
    this.isLoading$ = this.loadingService.loading$;
  }

  ngOnInit() {}

  /* ── Menu mobile ────────────────────────────────────────────── */

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
    document.body.style.overflow = this.isSidebarOpen ? 'hidden' : '';
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
    document.body.style.overflow = '';
  }

  /** Ferme automatiquement le drawer quand on navigue vers un lien */
  onNavClick(): void {
    if (window.innerWidth < 768) {
      this.closeSidebar();
    }
  }

  /** Referme le drawer si on passe en mode bureau (resize) */
  @HostListener('window:resize')
  onResize(): void {
    if (window.innerWidth >= 768 && this.isSidebarOpen) {
      this.closeSidebar();
    }
  }

  /* ── Authentification & rôles ───────────────────────────────── */

  isAdmin(): boolean {
    const user = this.auth.getCurrentUser();
    return user ? user.role === 'ADMIN' : false;
  }

  getUserRole(): string {
    const user = this.auth.getCurrentUser();
    if (!user) return 'Gestionnaire';
    if (user.username === 'kiki.admin' || user.username === 'admin') return 'Administrateur';
    if ((user.role as string) === 'ADMIN' || (user.role as string) === 'ADMINISTRATION') return 'Administration';
    if ((user.role as string) === 'GESTIONNAIRE') return 'Gestionnaire';
    const userAny = user as any;
    if (userAny.poste && (userAny.poste.toUpperCase() === 'ADMIN' || userAny.poste.toUpperCase() === 'ADMINISTRATION')) return 'Administration';
    return userAny.poste || user.role || 'Personnel';
  }

  logout() {
    this.auth.logout();
    this.dataService.showToast('Déconnexion du module Gestionnaire ERP.');
    this.router.navigate(['/']);
  }

  getUserName(): string {
    const user = this.auth.getCurrentUser();
    if (user && user.fullName) return user.fullName;
    const stored = localStorage.getItem('kiki_current_staff_name');
    return stored || 'Marie V.';
  }

  getUserInitials(): string {
    const name = this.getUserName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  /* ── En-tête & navigation ───────────────────────────────────── */

  showCreateEventBtn(): boolean {
    const url = this.router.url;
    return !url.includes('demandes') && !url.includes('propositions');
  }

  isPropositionsMenuOpen(): boolean {
    return this.router.url.includes('propositions');
  }

  isPropositionsCatalogueActive(): boolean {
    const url = this.router.url;
    return url.includes('/propositions') && !url.includes('tab=envoyees');
  }

  isPropositionsEnvoyeesActive(): boolean {
    const url = this.router.url;
    return url.includes('/propositions') && url.includes('tab=envoyees');
  }

  getTitle(): string {
    const url = this.router.url;
    if (url.includes('dashboard')) return 'Tableau de bord';
    if (url.includes('demandes')) return 'Demandes';
    if (url.includes('commandes')) return 'Commandes de mets';
    if (url.includes('avis')) return 'Avis & Notations clients';
    if (url.includes('catalogue')) return 'Catalogue';
    if (url.includes('fidelite')) return 'Fidélité & Points Clients';
    if (url.includes('propositions') && url.includes('tab=envoyees')) return 'Propositions Envoyées';
    if (url.includes('propositions')) return 'Catalogue des Propositions';
    if (url.includes('agenda')) return 'Calendrier interne';
    if (url.includes('mediatheque')) return 'Médiathèque';
    if (url.includes('cms')) return 'CMS & Contenus';
    if (url.includes('clients')) return 'Clients';
    if (url.includes('personnel')) return 'Personnel';
    if (url.includes('sync')) return 'GOOGLE SYNC & SEC';
    return 'Espace Gestionnaire';
  }

  getSubtitle(): string {
    const url = this.router.url;
    if (url.includes('dashboard')) return "Vue d'ensemble de l'activité de Kiki Traiteur.";
    if (url.includes('demandes')) return 'Traitement commercial et validation des devis.';
    if (url.includes('commandes')) return 'Traitement des commandes, de la réception au retrait.';
    if (url.includes('avis')) return 'Retours d\'expérience, notes et évaluations des clients.';
    if (url.includes('catalogue')) return 'Mets, catégories, tarifs et délais de préparation.';
    if (url.includes('fidelite')) return 'Configuration des points de bienvenue, paliers de cumul et bonus.';
    if (url.includes('propositions') && url.includes('tab=envoyees')) return "Historique des devis et propositions validés et transmis à l'ERP.";
    if (url.includes('propositions')) return 'Gestion des modèles et formules de propositions commerciales.';
    if (url.includes('agenda')) return 'Organisation interne et planification logistique.';
    if (url.includes('mediatheque')) return 'Galerie photos, catalogues et documents Kiki Traiteur.';
    if (url.includes('cms')) return 'Gestion des textes, cartes, plats et contenus en ligne.';
    if (url.includes('clients')) return 'Profils et historique des clients Kiki Traiteur.';
    if (url.includes('personnel')) return "Equipes culinaires et maîtres d'hôtel.";
    if (url.includes('sync')) return 'Paramètres de liaison Google Agenda et sécurité.';
    return 'Bienvenue dans votre espace';
  }
}
