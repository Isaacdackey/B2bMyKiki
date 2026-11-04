import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { NotificationBellComponent } from '../../shared/notifications/notification-bell.component';
import { HttpClient } from '@angular/common/http';
import { PanierService } from './services/panier.service';
import { FideliteService, ConfigurationFideliteDto } from './services/fidelite.service';
import { environment } from '../../../environments/environment';



@Component({
  selector: 'app-mykiki-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  templateUrl: './mykiki-layout.component.html',
  styleUrl: './mykiki-layout.component.css'
})
export class MyKikiLayoutComponent implements OnInit {
  unreadPropositions = 0;
  nombreArticlesPanier = 0;
  pointsFidelite = 0;
  isDropdownOpen = false;
  modaleFideliteOuverte = false;
  configFidelite: ConfigurationFideliteDto = {
    pointsBienvenue: 100,
    seuilMontantPanier: 5000,
    pointsGagnesParSeuil: 10,
    pointsRequisBonus: 500,
    descriptionBonus: 'Plat ou cocktail signature offert pour toute commande atteignant 500 points.',
    produitsBonus: [],
    pointsAvisClient: 20
  };

  constructor(
    private router: Router,
    private auth: AuthService,
    private notifService: NotificationService,
    private panier: PanierService,
    private fideliteService: FideliteService,
    private http: HttpClient
  ) {}

  get isHomePage(): boolean {
    const url = (this.router.url || '').split('?')[0].split('#')[0];
    return url === '/mykiki' || url === '/mykiki/';
  }

  ngOnInit(): void {
    this.notifService.count$.subscribe(c => this.unreadPropositions = c);
    this.notifService.startPolling();
    this.panier.nombreArticles$.subscribe(n => this.nombreArticlesPanier = n);
    this.fideliteService.points$.subscribe(p => this.pointsFidelite = p);
    this.fideliteService.config$.subscribe(c => this.configFidelite = c);
    this.fideliteService.modaleOuverte$.subscribe(m => this.modaleFideliteOuverte = m);
    this.fideliteService.chargerFidelite();
    this.fideliteService.chargerConfigFidelite();
  }

  chargerFidelite(): void {
    this.fideliteService.chargerFidelite();
  }

  chargerConfigFidelite(): void {
    this.fideliteService.chargerConfigFidelite();
  }

  ouvrirModaleFidelite(): void {
    this.fideliteService.ouvrirModale();
  }

  fermerModaleFidelite(): void {
    this.fideliteService.fermerModale();
  }

  allerAuCatalogue(): void {
    this.fermerModaleFidelite();
    this.router.navigate(['/mykiki/catalogue']);
  }

  calculerPourcentageBonus(): number {
    if (!this.configFidelite.pointsRequisBonus || this.configFidelite.pointsRequisBonus <= 0) return 100;
    const pct = Math.round((this.pointsFidelite / this.configFidelite.pointsRequisBonus) * 100);
    return Math.min(100, Math.max(0, pct));
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.profile-dropdown-container')) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  getUserName(): string {
    return this.auth.getCurrentUser()?.fullName || 'Client';
  }

  getTitle(): string {
    const url = this.router.url;
    if (url.includes('propositions')) return 'Propositions de Menus';
    if (url.includes('demandes')) return 'Suivi des Demandes';
    if (url.includes('devis')) return 'Devis & Factures';
    if (url.includes('profil')) return 'Mon Profil';
    if (url.includes('nouvelle-demande')) return 'Nouvelle Demande de Devis';
    if (url.includes('catalogue')) return 'Catalogue des Mets';
    if (url.includes('panier')) return 'Mon Panier';
    if (url.includes('commandes')) return 'Mes Commandes';
    return 'Accueil';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
