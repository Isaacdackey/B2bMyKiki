import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { B2bPeriodFilterComponent, PeriodeFilterChange } from '../../../b2b/shared/b2b-period-filter.component';
import { CountUpDirective } from '../../../b2b/shared/count-up.directive';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-cuisine-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bPeriodFilterComponent, CountUpDirective],
  templateUrl: './cuisine-dashboard.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineDashboardComponent {
  b2b = inject(B2bStateService);
  qrMode = signal<'PROJETER' | 'SCANNER'>('PROJETER');
  private router = inject(Router);
  constructor() {
  }

  setTab(tab: 'DASHBOARD' | 'INFOS' | 'UTILISATEURS' | 'MENU' | 'COMMANDES' | 'FACTURATION' | 'RECLAMATIONS' | 'PROJECTION_QR') {
    const map: Record<string, string> = {
      DASHBOARD: '/b2b/cuisine/dashboard', MENU: '/b2b/cuisine/menu', COMMANDES: '/b2b/cuisine/commandes',
      PROJECTION_QR: '/b2b/cuisine/qr', RECLAMATIONS: '/b2b/cuisine/reclamations',
      UTILISATEURS: '/b2b/cuisine/utilisateurs', FACTURATION: '/b2b/cuisine/facturation', INFOS: '/b2b/cuisine/infos'
    };
    this.router.navigate([map[tab] || '/b2b/cuisine/dashboard']);
  }

  private readonly todayIso = new Date().toISOString().slice(0, 10);
  dashboardDateDebut = signal<string>(this.todayIso);
  dashboardDateFin = signal<string>(this.todayIso);

  onPeriodeDashboardCuisineChange(ev: PeriodeFilterChange) {
    this.dashboardDateDebut.set(ev.dateDebut);
    this.dashboardDateFin.set(ev.dateFin);
  }

  commandesDashboardSite = computed(() => {
    const d1 = this.dashboardDateDebut();
    const d2 = this.dashboardDateFin();
    return this.commandesSite().filter(c => (!d1 || c.date >= d1) && (!d2 || c.date <= d2));
  });

  caDashboardSite = computed(() => {
    return this.commandesDashboardSite().reduce((acc, c) => acc + (c.montantTotal || 0), 0);
  });

  siteStatsStatuts = computed(() => {
    const cmds = this.commandesDashboardSite();
    const total = Math.max(1, cmds.length);
    const enCours = cmds.filter(c => c.statut === 'EN_COURS').length;
    const scanne = cmds.filter(c => c.statut === 'SCANNE').length;
    const livre = cmds.filter(c => c.statut === 'LIVRE').length;
    return [
      { label: 'En attente de retrait', count: enCours, pct: Math.round((enCours / total) * 100), color: '#721513' },
      { label: 'Scannés à la cantine', count: scanne, pct: Math.round((scanne / total) * 100), color: '#C05621' },
      { label: 'Livrés / Remis', count: livre, pct: Math.round((livre / total) * 100), color: '#606C38' }
    ];
  });

  entreprise = computed(() => this.b2b.currentEntreprise());

  // Utilisateurs du site géré
  employesSite = computed(() => {
    const ent = this.entreprise();
    const siteIds = new Set((ent.sites || []).map(s => s.id));
    const list = this.b2b.listeEmployes();
    const matched = list.filter(e => siteIds.has(e.siteId) || (e as any).entrepriseId === ent.id);
    return matched.length > 0 ? matched : list;
  });

  employesSubventionnesCount = computed(() => {
    return this.employesSite().filter(e => e.type === 'SUBVENTIONNE' && e.actif).length;
  });

  // Plats du Catalogue Global pour ajout/remplacement
  commandesSite = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeCommandesSite().filter(c => c.entrepriseId === entId);
  });

  commandesScanneesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'SCANNE').length;
  });

  commandesLivreesCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'LIVRE').length;
  });

  commandesEnAttenteCount = computed(() => {
    return this.commandesSite().filter(c => c.statut === 'EN_COURS').length;
  });

  // GESTION DES RÉCLAMATIONS RETARDATAIRES (Cut-off dépassé)
  reclamations = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeReclamations().filter(r => r.entrepriseId === entId);
  });

  reclamationsEnAttenteCount = computed(() => {
    return this.reclamations().filter(r => r.statut === 'EN_ATTENTE').length;
  });

}

