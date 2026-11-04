import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KikiDataService } from './services/kiki-data.service';
import { GestionnaireApiService } from './services/gestionnaire-api.service';

@Component({
  selector: 'app-gestionnaire',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-logo">
          <img src="assets/images/logo.png" alt="Kiki Traiteur Logo" onerror="this.style.display='none'">
          <div class="brand-text">
            <span class="brand-title">KIKI TRAITEUR</span>
            <span class="brand-subtitle">La poésie des saveurs</span>
          </div>
        </div>

        <ul class="sidebar-menu">
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'">
              <i class="fas fa-th-large me-2"></i> Tableau de bord
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'requests'" (click)="activeTab = 'requests'">
              <i class="fas fa-file-invoice me-2"></i> Demandes de devis
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'agenda'" (click)="activeTab = 'agenda'">
              <i class="fas fa-calendar-alt me-2"></i> Calendrier interne
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'mediatheque'" (click)="activeTab = 'mediatheque'">
              <i class="fas fa-images me-2"></i> Médiathèque
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'cms'" (click)="activeTab = 'cms'">
              <i class="fas fa-edit me-2"></i> CMS & Contenus
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'clients'" (click)="activeTab = 'clients'">
              <i class="fas fa-users me-2"></i> Clients
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'staff'" (click)="activeTab = 'staff'">
              <i class="fas fa-user-plus me-2"></i> Personnel
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'sync'" (click)="activeTab = 'sync'">
              <i class="fas fa-exclamation-circle me-2"></i> GOOGLE SYNC & SEC
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <div class="user-badge-container">
            <div class="user-badge">
              <div class="user-avatar">MV</div>
              <div class="user-info">
                <span class="user-name">Marie V.</span>
                <span class="user-role">GESTIONNAIRE</span>
              </div>
            </div>
            <a href="javascript:void(0)" (click)="logout()" class="logout-link">
              <i class="fas fa-sign-out-alt me-2"></i> Déconnexion
            </a>
          </div>
        </div>
      </aside>

      <!-- Main Workspace -->
      <main class="main-content">
        <!-- Top header -->
        <div class="dashboard-header">
          <div class="dashboard-title">
            <h1>{{ getTitle() }}</h1>
            <p>{{ getSubtitle() }}</p>
          </div>
          <div *ngIf="activeTab !== 'requests'" class="header-actions">
            <button type="button" (click)="openCreateEventModal()" class="btn-create-event">
              <i class="fas fa-plus-circle"></i> CRÉER UN ÉVÉNEMENT
            </button>
          </div>
        </div>

        <!-- Month Selector Bar (only on Dashboard tab) -->
        <div *ngIf="activeTab === 'dashboard'" class="month-selector-card">
          <button class="month-nav-btn" (click)="prevMonth()" title="Mois précédent">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div class="month-display" style="position: relative; cursor: pointer;" title="Cliquer pour choisir n'importe quel mois depuis 1997">
            <i class="fas fa-calendar-alt calendar-icon"></i>
            <span>{{ currentMonth }}</span>
            <input type="month" min="1997-01" [value]="getMonthInputValue()" (change)="onMonthInputChange($event)"
                   style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;" />
          </div>
          <button class="month-nav-btn" (click)="nextMonth()" title="Mois suivant">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>

        <!-- TAB 1: DASHBOARD -->
        <section *ngIf="activeTab === 'dashboard'" class="dashboard-section active">
          <!-- 6 KPI Cards Grid -->
          <div class="kpi-grid">
            <!-- 1. DEMANDES REÇUES -->
            <div class="kpi-card card-dark-maroon">
              <div class="kpi-header">DEMANDES REÇUES</div>
              <div class="kpi-body">
                <div class="kpi-icon-box"><i class="fas fa-inbox"></i></div>
                <div class="kpi-stat">
                  <span class="kpi-number">{{ getRequestsThisMonthCount() }}</span>
                  <span class="kpi-sub">pour ce mois</span>
                </div>
              </div>
              <div class="kpi-footer">
                <i class="fas fa-layer-group me-2"></i> Toutes prestations confondues
              </div>
            </div>

            <!-- 2. DEMANDES ABOUTIES -->
            <div class="kpi-card card-bright-red">
              <div class="kpi-header">DEMANDES ABOUTIES</div>
              <div class="kpi-body">
                <div class="kpi-icon-box"><i class="fas fa-check"></i></div>
                <div class="kpi-stat">
                  <span class="kpi-number">{{ getAcceptedCount() }}</span>
                  <span class="kpi-sub">réservations validées</span>
                </div>
              </div>
              <div class="kpi-footer">
                <i class="fas fa-handshake me-2"></i> Devis signés et confirmés
              </div>
            </div>

            <!-- 3. EN ATTENTE DE RÉALISATION -->
            <div class="kpi-card card-gold">
              <div class="kpi-header">EN ATTENTE DE RÉALISATION</div>
              <div class="kpi-body">
                <div class="kpi-icon-box"><i class="fas fa-hourglass-half"></i></div>
                <div class="kpi-stat">
                  <span class="kpi-number">{{ getPendingRealisationCount() }}</span>
                  <span class="kpi-sub">à confirmer ce mois-ci</span>
                </div>
              </div>
              <div class="kpi-footer">
                <i class="fas fa-clock me-2"></i> Statuts : En attente / Devis émis
              </div>
            </div>

            <!-- 4. TAUX DE CONVERSION -->
            <div class="kpi-card card-white">
              <div class="kpi-header">TAUX DE CONVERSION</div>
              <div class="kpi-body">
                <div class="kpi-icon-box"><i class="fas fa-percentage"></i></div>
                <div class="kpi-stat">
                  <span class="kpi-number">{{ getConversionRate() }} %</span>
                  <span class="kpi-sub">abouties / reçues</span>
                </div>
              </div>
              <div class="kpi-footer">
                <i class="fas fa-chart-line me-2"></i> Performance commerciale mensuelle
              </div>
            </div>

            <!-- 5. CLIENTS & ENTREPRISES -->
            <div class="kpi-card card-navy">
              <div class="kpi-header">CLIENTS & ENTREPRISES</div>
              <div class="kpi-body">
                <div class="kpi-icon-box"><i class="fas fa-users"></i></div>
                <div class="kpi-stat">
                  <span class="kpi-number">{{ getClientsCount() }}</span>
                  <span class="kpi-sub">inscrits dans l'ERP</span>
                </div>
              </div>
              <div class="kpi-footer">
                <i class="fas fa-user me-2"></i> {{ getClientsBreakdown() }}
              </div>
            </div>

            <!-- 6. EN ATTENTE DE VALIDATION -->
            <div class="kpi-card card-amber">
              <div class="kpi-header">EN ATTENTE DE VALIDATION</div>
              <div class="kpi-body">
                <div class="kpi-icon-box"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="kpi-stat">
                  <span class="kpi-number">{{ getPendingValidationCount() }}</span>
                  <span class="kpi-sub">demandes urgentes</span>
                </div>
              </div>
              <div class="kpi-footer">
                <i class="fas fa-bolt me-2"></i> Action requise du gestionnaire
              </div>
            </div>
          </div>

          <!-- Dashboard Bottom Grid -->
          <div class="dashboard-bottom-grid">
            <!-- LEFT COLUMN: LINE CHART -->
            <div class="chart-card">
              <div class="chart-header">
                <div class="chart-title">
                  <i class="fas fa-chart-line me-2" style="color: #DC2626;"></i>
                  <span>ÉVOLUTION DES DEMANDES</span>
                </div>
                <p class="chart-subtitle">Courbe sur les 6 derniers mois – par type de prestation</p>
              </div>

              <!-- FILTER TABS -->
              <div class="chart-filter-pills">
                <button *ngFor="let tab of chartTabs" 
                        class="chart-pill-btn" 
                        [class.active]="selectedChartFilter === tab" 
                        (click)="selectedChartFilter = tab">
                  {{ tab }}
                </button>
              </div>

              <!-- SVG LINE CHART -->
              <div class="svg-chart-container">
                <svg viewBox="0 0 560 215" class="svg-chart">
                  <!-- Gradient definition -->
                  <defs>
                    <linearGradient id="maroonGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#7A1C1C" stop-opacity="0.25" />
                      <stop offset="100%" stop-color="#7A1C1C" stop-opacity="0.01" />
                    </linearGradient>
                  </defs>

                  <!-- Horizontal Grid lines & Y Labels -->
                  <line x1="55" y1="20" x2="540" y2="20" stroke="#E2E8F0" stroke-width="1" />
                  <text x="35" y="24" fill="#64748B" font-size="11" text-anchor="end" font-family="Poppins, sans-serif">{{ getChartYLabel3() }}</text>

                  <line x1="55" y1="70" x2="540" y2="70" stroke="#E2E8F0" stroke-width="1" />
                  <text x="35" y="74" fill="#64748B" font-size="11" text-anchor="end" font-family="Poppins, sans-serif">{{ getChartYLabel2() }}</text>

                  <line x1="55" y1="120" x2="540" y2="120" stroke="#E2E8F0" stroke-width="1" />
                  <text x="35" y="124" fill="#64748B" font-size="11" text-anchor="end" font-family="Poppins, sans-serif">{{ getChartYLabel1() }}</text>

                  <line x1="55" y1="170" x2="540" y2="170" stroke="#CBD5E1" stroke-width="1.5" />
                  <text x="35" y="174" fill="#64748B" font-size="11" text-anchor="end" font-family="Poppins, sans-serif">0</text>


                  <!-- Shaded Area Under Curve -->
                  <path [attr.d]="getChartAreaPath()" fill="url(#maroonGradient)" />

                  <!-- Line Curve -->
                  <path [attr.d]="getChartPath()" fill="none" stroke="#7A1C1C" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

                  <!-- Data Point Dots & Month Labels -->
                  <g *ngFor="let pt of getChartPoints()">
                    <circle [attr.cx]="pt.x" [attr.cy]="pt.y" [attr.r]="pt.isLast ? 5 : 3.5" 
                            fill="#7A1C1C" [attr.stroke]="pt.isLast ? '#FFFFFF' : 'none'" 
                            [attr.stroke-width]="pt.isLast ? 2 : 0" />
                    <text [attr.x]="pt.x" y="198" fill="#64748B" font-size="11" text-anchor="middle" font-family="Poppins, sans-serif">{{ pt.label }}</text>
                  </g>
                </svg>
              </div>
            </div>

            <!-- RIGHT COLUMN: STACKED CARDS -->
            <div class="right-stacked-cards">
              <!-- TOP CARD: DISPONIBILITÉ & BLOCAGES -->
              <div class="side-card">
                <div class="side-card-title">
                  <i class="fas fa-shield-alt me-2" style="color: #DC2626;"></i>
                  <span>DISPONIBILITÉ & BLOCAGES</span>
                </div>

                <div class="conflict-box">
                  <div class="conflict-item">
                    <div class="conflict-num green-text">{{ getActiveConflictsCount() }}</div>
                    <div class="conflict-label">CONFLIT ACTIF</div>
                  </div>
                  <div class="conflict-divider"></div>
                  <div class="conflict-item">
                    <div class="conflict-num orange-text">{{ getRoomBlockedCount() }}</div>
                    <div class="conflict-label">BLOCAGE SALLE</div>
                  </div>
                </div>

                <a href="javascript:void(0)" (click)="activeTab = 'agenda'" class="side-card-link">
                  GÉRER LE CALENDRIER <i class="fas fa-arrow-right ms-1"></i>
                </a>
              </div>

              <!-- BOTTOM CARD: FLUX DES DEMANDES RÉCENTES -->
              <div class="side-card">
                <div class="side-card-title">
                  <i class="fas fa-bars me-2" style="color: #DC2626;"></i>
                  <span>FLUX DES DEMANDES RÉCENTES</span>
                </div>

                <div class="recent-requests-list">
                  <div *ngIf="!getRecentRequestsFeed() || getRecentRequestsFeed().length === 0" style="padding: 1.5rem; text-align: center; color: #94A3B8; font-size: 0.9rem;">
                    Aucune demande en base de données pour ce mois.
                  </div>
                  <div class="recent-item" *ngFor="let item of getRecentRequestsFeed()">
                    <div class="recent-left">
                      <span class="dot" [ngStyle]="{'background-color': item.dotColor}"></span>
                      <span class="recent-name">{{ item.name }}</span>
                    </div>
                    <div class="recent-right">
                      <span class="recent-badge">{{ item.badge }}</span>
                      <span class="recent-date">{{ item.date }}</span>
                    </div>
                  </div>
                </div>

                <a href="javascript:void(0)" (click)="activeTab = 'requests'" class="side-card-link">
                  VOIR TOUTES LES DEMANDES <i class="fas fa-arrow-right ms-1"></i>
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- TAB 2: REQUESTS -->
        <section *ngIf="activeTab === 'requests'" class="dashboard-section active">
          <div class="panel">
            <!-- En-tête de la table avec bouton Créer un Devis -->
            <div class="panel-header" style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem;">
              <h2 class="panel-title" style="color: #7A1C1C; font-size: 1.15rem; margin: 0;">Demandes de devis des clients</h2>
              <button class="btn" style="background: #7A1C1C; color: white; font-weight: 600;" (click)="openCreateDevisModal()">
                <i class="fas fa-plus me-1"></i> CRÉER UN DEVIS
              </button>
            </div>

            <!-- FILTRES RECHERCHE CLIENT & PRESTATIONS -->
            <div style="display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-bottom: 0.85rem;">
              <input type="text" class="form-control" [(ngModel)]="requestClientFilter" placeholder="Rechercher un client..." style="width: 210px; font-size: 0.78rem;">
              <select class="form-control" [(ngModel)]="requestPrestationFilter" style="width: 210px; font-size: 0.78rem;">
                <option value="ALL">Toutes les prestations</option>
                <option value="salle-diva">Salle La Diva</option>
                <option value="traiteur">Service Traiteur Prestige</option>
                <option value="evenements">Organisation d'Événements</option>
                <option value="foodtruck">Food Truck Gourmet</option>
                <option value="takeaway">Plats à Emporter</option>
              </select>
            </div>

            <!-- BOUTONS DE FILTRE PAR STATUT (restent sélectionnés après pagination) -->
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.25rem;">
              <button *ngFor="let sf of statusFiltersList" type="button" class="btn btn-sm"
                [style.background]="selectedRequestStatusFilter === sf.value ? '#7A1C1C' : '#F1F5F9'"
                [style.color]="selectedRequestStatusFilter === sf.value ? 'white' : '#334155'"
                [style.border]="selectedRequestStatusFilter === sf.value ? '1px solid #7A1C1C' : '1px solid #E2E8F0'"
                style="border-radius: 20px; padding: 0.35rem 0.85rem; font-weight: 600;"
                (click)="selectRequestStatusFilter(sf.value)">
                {{ sf.label }} ({{ getRequestCountByStatus(sf.value) }})
              </button>
            </div>

            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID DEMANDE</th>
                    <th>CLIENT</th>
                    <th>TYPE</th>
                    <th>PRESTATION</th>
                    <th>LIEU</th>
                    <th>DATE</th>
                    <th>CONVIVES</th>
                    <th>STATUT</th>
                    <th style="min-width: 120px; width: 120px;">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of getFilteredRequestsForPage()">
                    <td><strong style="color: #1E293B;">#{{ req.id }}</strong></td>
                    <td><strong style="color: #1E293B;">{{ req.clientName && req.clientName !== req.clientId ? req.clientName : getClientName(req.clientId) }}</strong></td>
                    <td>
                      <span class="badge" style="background: #EDE9FE; color: #6D28D9; font-size: 0.65rem;">
                        {{ getClientType(req.clientId) }}
                      </span>
                    </td>
                    <td>{{ getPrestationName(req.prestationId) }}</td>
                    <td>{{ req.location || 'À définir' }}</td>
                    <td>{{ formatDate(req.date) }}</td>
                    <td>{{ req.guests || 0 }}</td>
                    <td>
                      <span class="badge" [ngClass]="getBadgeClass(req.status)">
                        {{ getStatusLabel(req.status) }}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.3rem; flex-wrap: nowrap; align-items: center;">
                        <!-- 1. En attente (pending) : Voir détails, Accepter, Refuser -->
                        <ng-container *ngIf="isPendingStatus(req.status)">
                          <button class="btn btn-sm" style="background: #475569; color: white;" (click)="openRequestDetailsModal(req)" title="Voir les détails de la demande">
                            <i class="fas fa-eye"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #059669; color: white;" (click)="acceptRequest(req)" title="Accepter la demande">
                            <i class="fas fa-check"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #DC2626; color: white;" (click)="rejectRequest(req)" title="Refuser la demande">
                            <i class="fas fa-times"></i>
                          </button>
                        </ng-container>

                        <!-- 2. Accepté : Éditer devis, Refuser, Voir détails -->
                        <ng-container *ngIf="isAcceptedStatus(req.status)">
                          <button class="btn btn-sm" style="background: #7A1C1C; color: white;" (click)="openDevisModal(req, false)" title="Éditer et envoyer le devis PDF au client">
                            <i class="fas fa-file-invoice-dollar"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #DC2626; color: white;" (click)="rejectRequest(req)" title="Refuser">
                            <i class="fas fa-times"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #475569; color: white;" (click)="openRequestDetailsModal(req)" title="Voir les infos de la demande">
                            <i class="fas fa-eye"></i>
                          </button>
                        </ng-container>

                        <!-- 3. Devis envoyé : Modifier, Créer événement, Refuser, Voir -->
                        <ng-container *ngIf="isSentStatus(req.status)">
                          <button class="btn btn-sm" style="background: #2563EB; color: white;" (click)="openDevisModal(req, false)" title="Modifier et renvoyer le devis PDF">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #059669; color: white;" (click)="acceptDevisAndCreateEvent(req)" title="Créer l'événement">
                            <i class="fas fa-calendar-plus"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #DC2626; color: white;" (click)="rejectRequest(req)" title="Refuser le devis">
                            <i class="fas fa-times"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #475569; color: white;" (click)="openRequestDetailsModal(req)" title="Voir les infos du client">
                            <i class="fas fa-eye"></i>
                          </button>
                        </ng-container>

                        <!-- 4. Aboutis : Voir devis, Voir détails -->
                        <ng-container *ngIf="isAboutisStatus(req.status)">
                          <button class="btn btn-sm" style="background: #5B21B6; color: white;" (click)="openDevisModal(req, true)" title="Voir le devis conclu">
                            <i class="fas fa-file-invoice"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #475569; color: white;" (click)="openRequestDetailsModal(req)" title="Voir les détails">
                            <i class="fas fa-eye"></i>
                          </button>
                        </ng-container>

                        <!-- 5. Refusé : Voir détails, Voir devis -->
                        <ng-container *ngIf="isRejectedStatus(req.status)">
                          <button class="btn btn-sm" style="background: #475569; color: white;" (click)="openRequestDetailsModal(req)" title="Voir les détails">
                            <i class="fas fa-eye"></i>
                          </button>
                          <button class="btn btn-sm" style="background: #64748B; color: white;" (click)="openDevisModal(req, true)" title="Voir le devis">
                            <i class="fas fa-file-invoice"></i>
                          </button>
                        </ng-container>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="getFilteredRequestsForPage().length === 0">
                    <td colspan="9" style="text-align: center; padding: 2.5rem; color: #94A3B8;">
                      Aucune demande de devis trouvée avec les filtres actuels.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION CIRCLES (Image 4) -->
            <div *ngIf="getRequestTotalPages() > 1" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; align-items: center;">
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="requestPage === 1" [style.opacity]="requestPage === 1 ? '0.5' : '1'" (click)="requestPage = requestPage - 1">
                Précédent
              </button>
              <button *ngFor="let p of getRequestPageArray()" type="button" class="btn btn-sm"
                [style.background]="requestPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="requestPage === p ? 'white' : '#64748B'"
                [style.border]="requestPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (requestPage = $any(p))">
                {{ p }}
              </button>
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="requestPage === getRequestTotalPages()" [style.opacity]="requestPage === getRequestTotalPages() ? '0.5' : '1'" (click)="requestPage = requestPage + 1">
                Suivant
              </button>
            </div>
          </div>
        </section>

        <!-- TAB 3: AGENDA (CALENDRIER INTERNE - IMAGE 5) -->
        <section *ngIf="activeTab === 'agenda'" class="dashboard-section active">
          <!-- BARRE SUPÉRIEURE DES FILTRES & NAVIGATION MOIS -->
          <div class="panel" style="margin-bottom: 1.25rem;">
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 1rem;">
              <div style="display: flex; flex-wrap: wrap; gap: 0.65rem; align-items: center;">
                <select class="form-control" [(ngModel)]="calendarPrestationFilter" style="width: 190px; font-size: 0.78rem;">
                  <option value="ALL">Toutes les prestations</option>
                  <option value="salle-diva">Salle La Diva</option>
                  <option value="traiteur">Service Traiteur Prestige</option>
                  <option value="evenements">Organisation d'Événements</option>
                  <option value="decoration">Design & Décoration</option>
                  <option value="location">Location de Matériel</option>
                  <option value="foodtruck">Food Truck Gourmet</option>
                </select>

                <input type="text" class="form-control" [(ngModel)]="calendarClientFilter" placeholder="Rechercher un client..." style="width: 190px; font-size: 0.78rem;">

                <select class="form-control" [(ngModel)]="calendarResourceFilter" style="width: 190px; font-size: 0.78rem;">
                  <option value="ALL">Toutes les ressources</option>
                  <option value="Salle La Diva">Salle La Diva</option>
                  <option value="Cuisine & Brigade">Cuisine & Brigade</option>
                  <option value="Scénographie">Scénographie</option>
                  <option value="Matériel & Logistique">Matériel & Logistique</option>
                </select>

                <input type="text" class="form-control" [(ngModel)]="calendarStaffFilter" placeholder="Rechercher un responsable..." style="width: 190px; font-size: 0.78rem;">
              </div>

              <!-- MONTH PILL NAVIGATION (Image 5) -->
              <div style="display: flex; align-items: center; background: white; border: 1px solid #E2E8F0; border-radius: 50px; padding: 0.35rem 0.85rem; box-shadow: 0 2px 6px rgba(0,0,0,0.03);">
                <button type="button" (click)="prevCalendarMonth()" style="background: transparent; border: none; color: #7A1C1C; cursor: pointer; font-size: 0.95rem; padding: 0 0.5rem;"><i class="fas fa-chevron-left"></i></button>
                <span style="color: #7A1C1C; font-weight: 700; font-size: 1.05rem; margin: 0 0.75rem;">{{ getCalendarHeaderLabel() }}</span>
                <button type="button" (click)="nextCalendarMonth()" style="background: transparent; border: none; color: #7A1C1C; cursor: pointer; font-size: 0.95rem; padding: 0 0.5rem;"><i class="fas fa-chevron-right"></i></button>
              </div>
            </div>
          </div>

          <div class="panel">
            <!-- VIEW SWITCHER (Mois / Semaine / Jour / Événements) -->
            <div style="display: flex; gap: 0.4rem; margin-bottom: 1.25rem;">
              <button type="button" class="btn btn-sm" [style.background]="calendarView === 'Mois' ? '#DC2626' : 'white'" [style.color]="calendarView === 'Mois' ? 'white' : '#1E293B'" [style.border]="calendarView === 'Mois' ? 'none' : '1px solid #E2E8F0'" style="border-radius: 20px; padding: 0.35rem 1rem; font-weight: 600;" (click)="calendarView = 'Mois'">Mois</button>
              <button type="button" class="btn btn-sm" [style.background]="calendarView === 'Semaine' ? '#DC2626' : 'white'" [style.color]="calendarView === 'Semaine' ? 'white' : '#1E293B'" [style.border]="calendarView === 'Semaine' ? 'none' : '1px solid #E2E8F0'" style="border-radius: 20px; padding: 0.35rem 1rem; font-weight: 600;" (click)="calendarView = 'Semaine'">Semaine</button>
              <button type="button" class="btn btn-sm" [style.background]="calendarView === 'Jour' ? '#DC2626' : 'white'" [style.color]="calendarView === 'Jour' ? 'white' : '#1E293B'" [style.border]="calendarView === 'Jour' ? 'none' : '1px solid #E2E8F0'" style="border-radius: 20px; padding: 0.35rem 1rem; font-weight: 600;" (click)="calendarView = 'Jour'">Jour</button>
              <button type="button" class="btn btn-sm" [style.background]="calendarView === 'Événements' ? '#DC2626' : 'white'" [style.color]="calendarView === 'Événements' ? 'white' : '#1E293B'" [style.border]="calendarView === 'Événements' ? 'none' : '1px solid #E2E8F0'" style="border-radius: 20px; padding: 0.35rem 1rem; font-weight: 600;" (click)="calendarView = 'Événements'">Événements</button>
            </div>

            <!-- GRILLE CALENDRIER - VUE MOIS (Image 5) -->
            <div *ngIf="calendarView === 'Mois'" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: white;">
              <!-- EN-TÊTE JOURS DE LA SEMAINE -->
              <div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #F8FAFC; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 600; color: #475569; font-size: 0.8rem; padding: 0.65rem 0;">
                <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
              </div>
              <!-- GRILLE DES JOURS DU MOIS -->
              <div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #E2E8F0; gap: 1px;">
                <div *ngFor="let day of getCalendarGridDays()" [style.background]="day.isCurrentMonth ? 'white' : '#F8FAFC'" [style.color]="day.isCurrentMonth ? '#1E293B' : '#94A3B8'" style="min-height: 115px; padding: 0.5rem; display: flex; flex-direction: column;">
                  <span style="font-size: 0.82rem; font-weight: 600; margin-bottom: 0.35rem;">{{ day.dayNumber }}</span>
                  <!-- EVENTS -->
                  <div style="display: flex; flex-direction: column; gap: 0.35rem;">
                    <div *ngFor="let ev of day.events" (click)="openEventDetailsModal(ev); $event.stopPropagation()" [style.background]="getEventBlockBg(ev)" [style.color]="getEventBlockColor(ev)" style="border-radius: 4px; padding: 0.3rem 0.5rem; font-size: 0.72rem; font-weight: 600; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; box-shadow: 0 1px 2px rgba(0,0,0,0.08);">
                      <span>{{ ev.title }}</span> <span style="font-weight: 400; opacity: 0.95;">{{ ev.time }} - {{ getEndTime(ev.time) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- GRILLE CALENDRIER - VUE SEMAINE (Image 2) -->
            <div *ngIf="calendarView === 'Semaine'" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: white;">
              <!-- EN-TÊTE JOURS DE LA SEMAINE -->
              <div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #F8FAFC; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 600; color: #475569; font-size: 0.8rem; padding: 0.65rem 0;">
                <div>Lun</div><div>Mar</div><div>Mer</div><div>Jeu</div><div>Ven</div><div>Sam</div><div>Dim</div>
              </div>
              <div style="display: grid; grid-template-columns: repeat(7, 1fr); background: #E2E8F0; gap: 1px;">
                <div *ngFor="let day of getCalendarWeekDays()" style="min-height: 300px; background: white; padding: 0.75rem 0.5rem; display: flex; flex-direction: column;">
                  <span style="font-size: 1rem; font-weight: 800; color: #1E293B; margin-bottom: 0.75rem;">{{ day.dayNumber }}</span>
                  <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <div *ngFor="let ev of day.events" (click)="openEventDetailsModal(ev); $event.stopPropagation()" [style.background]="getEventBlockBg(ev)" [style.color]="getEventBlockColor(ev)" style="border-radius: 6px; padding: 0.5rem 0.6rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                      <div style="font-weight: 700; margin-bottom: 0.2rem;">{{ ev.title }}</div>
                      <div style="font-size: 0.7rem; opacity: 0.9;">{{ ev.time }} - {{ getEndTime(ev.time) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- GRILLE CALENDRIER - VUE JOUR (Image 3) -->
            <div *ngIf="calendarView === 'Jour'" style="border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; background: white; min-height: 250px;">
              <div style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0; text-align: center; font-weight: 600; color: #475569; font-size: 0.85rem; padding: 0.65rem 0;">
                Jour
              </div>
              <div style="padding: 1.25rem 1.5rem;">
                <div style="font-size: 2rem; font-weight: 800; color: #DC2626; margin-bottom: 1.25rem; line-height: 1;">
                  {{ getCalendarDayView().dayNumber }}
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                  <div *ngFor="let ev of getCalendarDayView().events" (click)="openEventDetailsModal(ev); $event.stopPropagation()"
                    [style.background]="getEventBlockBg(ev)" [style.color]="getEventBlockColor(ev)"
                    style="border-radius: 8px; padding: 0.85rem 1.25rem; font-size: 0.88rem; font-weight: 700; cursor: pointer; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
                    <span>{{ ev.title }}</span>
                    <span style="font-weight: 600; font-size: 0.85rem;">{{ ev.time }} - {{ getEndTime(ev.time) }}</span>
                  </div>
                  <div *ngIf="getCalendarDayView().events.length === 0" style="text-align: center; padding: 2.5rem; color: #94A3B8;">
                    Aucun événement pour cette journée.
                  </div>
                </div>
              </div>
            </div>

            <!-- VUE EN LISTE (Événements sous forme de card + pagination) -->
            <div *ngIf="calendarView === 'Événements'">
              <div *ngIf="getEventsForPage().length === 0" style="text-align: center; padding: 3rem; color: #94A3B8; background: white; border: 1px solid #E2E8F0; border-radius: 12px;">
                <i class="fas fa-calendar-times" style="font-size: 2.5rem; margin-bottom: 0.75rem; opacity: 0.6;"></i>
                <p style="margin: 0; font-weight: 600;">Aucun événement programmé avec ces critères.</p>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                <div *ngFor="let ev of getEventsForPage()" (click)="openEventDetailsModal(ev)"
                  style="background: white; border: 1px solid #E2E8F0; border-radius: 14px; padding: 1.15rem 1.5rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 8px rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s ease; flex-wrap: wrap; gap: 1rem;">
                  
                  <div style="display: flex; align-items: center; gap: 1.5rem; flex: 1; min-width: 280px;">
                    <!-- Date Block (Photo 4 style: JUIL. / 19 in Bordeaux) -->
                    <div style="text-align: center; min-width: 50px;">
                      <div style="font-size: 0.72rem; font-weight: 800; color: #7A1C1C; text-transform: uppercase; letter-spacing: 0.5px;">{{ getEventCardMonth(ev.date) }}</div>
                      <div style="font-size: 1.75rem; font-weight: 800; color: #7A1C1C; line-height: 1.1;">{{ getEventCardDay(ev.date) }}</div>
                    </div>

                    <!-- Details Block -->
                    <div>
                      <h4 style="margin: 0 0 0.35rem 0; font-size: 1.05rem; font-weight: 700; color: #1E293B; font-family: 'Playfair Display', serif;">{{ ev.title }}</h4>
                      <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 1.25rem; font-size: 0.8rem; color: #64748B;">
                        <span style="display: flex; align-items: center;"><i class="fas fa-map-marker-alt me-1" style="color: #DC2626;"></i> {{ ev.location }}</span>
                        <span style="display: flex; align-items: center;"><i class="far fa-clock me-1" style="color: #DC2626;"></i> {{ ev.time }} - {{ getEndTime(ev.time) }}</span>
                        <span style="display: flex; align-items: center;" *ngIf="ev.staffIds && ev.staffIds.length > 0"><i class="fas fa-user me-1" style="color: #DC2626;"></i> Resp: {{ getStaffName(ev.staffIds[0]) }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Status Badge (Photo 4 style: VALIDÉ in green pill) -->
                  <div>
                    <span style="background: #D1FAE5; color: #059669; font-weight: 700; padding: 0.35rem 1rem; border-radius: 50px; font-size: 0.75rem; letter-spacing: 0.5px; text-transform: uppercase;">
                      VALIDÉ
                    </span>
                  </div>
                </div>
              </div>

              <!-- PAGINATION ÉVÉNEMENTS -->
              <div *ngIf="getEventTotalPages() > 1" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.5rem; align-items: center;">
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="eventListPage === 1" [style.opacity]="eventListPage === 1 ? '0.5' : '1'" (click)="eventListPage = eventListPage - 1">
                Précédent
              </button>
              <button *ngFor="let p of getEventPageArray()" type="button" class="btn btn-sm"
                [style.background]="eventListPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="eventListPage === p ? 'white' : '#64748B'"
                [style.border]="eventListPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (eventListPage = $any(p))">
                {{ p }}
              </button>
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="eventListPage === getEventTotalPages()" [style.opacity]="eventListPage === getEventTotalPages() ? '0.5' : '1'" (click)="eventListPage = eventListPage + 1">
                Suivant
              </button>
              </div>
            </div>
          </div>
        </section>

        <!-- TAB 4: MEDIATHEQUE -->
        <section *ngIf="activeTab === 'mediatheque'" class="dashboard-section active">
          <div class="panel">
            <div class="panel-header" style="flex-wrap: wrap; gap: 0.75rem;">
              <h2 class="panel-title">Médiathèque (Photos & Vidéos regroupées par événement)</h2>
              <button class="btn btn-accent" (click)="openAddMediaModal()"><i class="fas fa-upload me-1"></i> Ajouter un média</button>
            </div>
            <!-- Event filter bar -->
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
              <button class="btn btn-sm" [style.background]="selectedEventFilterForMedia === 'ALL' ? '#7A1C1C' : '#E2E8F0'" [style.color]="selectedEventFilterForMedia === 'ALL' ? 'white' : '#334155'" (click)="selectedEventFilterForMedia = 'ALL'">
                Tous les événements ({{ mediaList.length }})
              </button>
              <button *ngFor="let title of getEventTitlesWithMedia()" class="btn btn-sm" [style.background]="selectedEventFilterForMedia === title ? '#7A1C1C' : '#E2E8F0'" [style.color]="selectedEventFilterForMedia === title ? 'white' : '#334155'" (click)="selectedEventFilterForMedia = title">
                {{ title }}
              </button>
            </div>
            <!-- Grouped Sections -->
            <div *ngFor="let evTitle of (selectedEventFilterForMedia === 'ALL' ? getEventTitlesWithMedia() : [selectedEventFilterForMedia])" style="margin-bottom: 1.75rem;">
              <h3 style="color: #1E293B; font-size: 0.95rem; font-weight: 600; margin-bottom: 0.75rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 0.4rem;">
                <i class="fas fa-folder-open me-2" style="color: #7A1C1C;"></i> {{ evTitle }}
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 1.15rem;">
                <div *ngFor="let m of getMediaByEventTitle(evTitle)" style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background: white; box-shadow: 0 2px 6px rgba(0,0,0,0.03); position: relative;">
                  <div style="height: 135px; background: #E2E8F0; position: relative;">
                    <img [src]="m.url" alt="" style="width: 100%; height: 100%; object-fit: cover;">
                    <button class="btn btn-sm" style="position: absolute; top: 0.4rem; right: 0.4rem; background: rgba(220, 38, 38, 0.85); color: white; padding: 0.2rem 0.5rem;" (click)="deleteMedia(m.id)" title="Supprimer">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                  <div style="padding: 0.75rem;">
                    <strong style="display: block; color: #1E293B; font-size: 0.82rem;">{{ m.title }}</strong>
                    <small style="color: #64748B; font-size: 0.72rem; display: block; margin-top: 0.2rem;">
                      <i class="fas" [ngClass]="m.type === 'video' ? 'fa-video' : 'fa-image'"></i> {{ m.type === 'video' ? 'Vidéo' : 'Photo HD' }} • {{ m.eventTitle }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
            <div *ngIf="mediaList.length === 0" style="text-align: center; padding: 2.5rem; color: #94A3B8; font-size: 0.85rem;">
              Aucun média dans la médiathèque. Cliquez sur "Ajouter un média" pour commencer.
            </div>

            <!-- PAGINATION MEDIATHÈQUE -->
            <div *ngIf="getMediaTotalPages() > 1" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.25rem; align-items: center;">
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="mediaPage === 1" [style.opacity]="mediaPage === 1 ? '0.5' : '1'" (click)="mediaPage = mediaPage - 1">
                Précédent
              </button>
              <button *ngFor="let p of getMediaPageArray()" type="button" class="btn btn-sm"
                [style.background]="mediaPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="mediaPage === p ? 'white' : '#64748B'"
                [style.border]="mediaPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (mediaPage = $any(p))">
                {{ p }}
              </button>
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="mediaPage === getMediaTotalPages()" [style.opacity]="mediaPage === getMediaTotalPages() ? '0.5' : '1'" (click)="mediaPage = mediaPage + 1">
                Suivant
              </button>
            </div>
          </div>
        </section>

        <!-- TAB 5: CMS & CONTENUS -->
        <section *ngIf="activeTab === 'cms'" class="dashboard-section active">

          <!-- FILTRES DE CONTENU CMS -->
          <div style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: center;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #64748B; text-transform: uppercase; margin-right: 0.5rem;"><i class="fas fa-filter me-1"></i> Filtrer la rubrique :</span>
            <button type="button" class="btn"
              [style.background]="cmsFilterTab === 'FAQS' ? '#7A1C1C' : '#F8FAFC'"
              [style.color]="cmsFilterTab === 'FAQS' ? 'white' : '#475569'"
              [style.border]="cmsFilterTab === 'FAQS' ? '1px solid #7A1C1C' : '1px solid #CBD5E1'"
              style="padding: 0.5rem 1.1rem; border-radius: 6px; font-weight: 600;"
              (click)="cmsFilterTab = 'FAQS'">
              <i class="fas fa-question-circle me-1"></i> FAQs (Questions Fréquentes)
            </button>
            <button type="button" class="btn"
              [style.background]="cmsFilterTab === 'TESTIMONIALS' ? '#7A1C1C' : '#F8FAFC'"
              [style.color]="cmsFilterTab === 'TESTIMONIALS' ? 'white' : '#475569'"
              [style.border]="cmsFilterTab === 'TESTIMONIALS' ? '1px solid #7A1C1C' : '1px solid #CBD5E1'"
              style="padding: 0.5rem 1.1rem; border-radius: 6px; font-weight: 600;"
              (click)="cmsFilterTab = 'TESTIMONIALS'">
              <i class="fas fa-star me-1"></i> Témoignages &amp; Commentaires
            </button>
            <button type="button" class="btn"
              [style.background]="cmsFilterTab === 'ALL' ? '#7A1C1C' : '#F8FAFC'"
              [style.color]="cmsFilterTab === 'ALL' ? 'white' : '#475569'"
              [style.border]="cmsFilterTab === 'ALL' ? '1px solid #7A1C1C' : '1px solid #CBD5E1'"
              style="padding: 0.5rem 1.1rem; border-radius: 6px; font-weight: 600;"
              (click)="cmsFilterTab = 'ALL'">
              <i class="fas fa-layer-group me-1"></i> Tous les contenus
            </button>
          </div>

          <!-- FAQ PANEL -->
          <div *ngIf="cmsFilterTab === 'ALL' || cmsFilterTab === 'FAQS'" class="panel" style="margin-bottom: 1.25rem;">
            <div class="panel-header" style="flex-wrap: wrap; gap: 0.75rem;">
              <h2 class="panel-title"><i class="fas fa-question-circle me-2" style="color:#7A1C1C;"></i>Questions Fréquentes (FAQs)</h2>
              <button class="btn btn-accent" (click)="openAddFaqModal()"><i class="fas fa-plus me-1"></i> Créer une FAQ</button>
            </div>
            <p style="color: #64748B; font-size: 0.78rem; margin-bottom: 1rem;">
              Gérez ici les questions et réponses affichées sur votre site internet.
            </p>
            <div class="table-responsive">
              <table class="admin-table" style="table-layout: fixed; width: 100%;">
                <colgroup>
                  <col style="width: 30%;">
                  <col style="width: 42%;">
                  <col style="width: 14%;">
                  <col style="width: 14%;">
                </colgroup>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Réponse</th>
                    <th>Catégorie</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let f of getFaqsForPage()">
                    <td style="white-space: normal; word-break: break-word;"><strong style="color: #1E293B; font-size: 0.70rem;">{{ f.question }}</strong></td>
                    <td style="white-space: normal; word-break: break-word; color: #475569; font-size: 0.68rem;">{{ f.answer }}</td>
                    <td><span class="badge" [ngStyle]="getBadgeStyle(f.category)">{{ f.category || 'Général' }}</span></td>
                    <td>
                      <div style="display: flex; gap: 0.3rem;">
                        <button class="btn btn-sm btn-outline" (click)="openEditFaqModal(f)" title="Modifier">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm" style="background:#DC2626; color:white;" (click)="openDeleteFaqModal(f)" title="Supprimer">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="faqs.length === 0">
                    <td colspan="4" style="text-align: center; padding: 2rem; color: #94A3B8;">Aucune FAQ configurée.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- PAGINATION FAQS -->
            <div *ngIf="getFaqTotalPages() > 1" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.25rem; align-items: center;">
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="faqPage === 1" [style.opacity]="faqPage === 1 ? '0.5' : '1'" (click)="faqPage = faqPage - 1">
                Précédent
              </button>
              <button *ngFor="let p of getFaqPageArray()" type="button" class="btn btn-sm"
                [style.background]="faqPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="faqPage === p ? 'white' : '#64748B'"
                [style.border]="faqPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (faqPage = $any(p))">
                {{ p }}
              </button>
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="faqPage === getFaqTotalPages()" [style.opacity]="faqPage === getFaqTotalPages() ? '0.5' : '1'" (click)="faqPage = faqPage + 1">
                Suivant
              </button>
            </div>
          </div>

          <!-- TESTIMONIALS PANEL -->
          <div *ngIf="cmsFilterTab === 'ALL' || cmsFilterTab === 'TESTIMONIALS'" class="panel">
            <div class="panel-header" style="flex-wrap: wrap; gap: 0.75rem;">
              <h2 class="panel-title"><i class="fas fa-star me-2" style="color:#D97706;"></i>Témoignages Clients</h2>
              <button class="btn btn-accent" (click)="openAddTestimonialModal()"><i class="fas fa-plus me-1"></i> Ajouter un témoignage</button>
            </div>
            <p style="color: #64748B; font-size: 0.78rem; margin-bottom: 1rem;">
              Gérez les avis clients affichés sur votre site (texte, nom, titre et étoiles).
            </p>
            <div class="table-responsive">
              <table class="admin-table" style="table-layout: fixed; width: 100%;">
                <colgroup>
                  <col style="width: 38%;">
                  <col style="width: 20%;">
                  <col style="width: 20%;">
                  <col style="width: 10%;">
                  <col style="width: 12%;">
                </colgroup>
                <thead>
                  <tr>
                    <th>Témoignage</th>
                    <th>Nom du client</th>
                    <th>Titre / Fonction</th>
                    <th>Étoiles</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of testimonials">
                    <td style="white-space: normal; word-break: break-word; font-style: italic; color: #475569; font-size: 0.68rem;">"{{ t.text }}"</td>
                    <td style="white-space: normal; font-size: 0.70rem;"><strong>{{ t.clientName }}</strong></td>
                    <td style="white-space: normal; font-size: 0.68rem; color: #64748B;">{{ t.clientTitle }}</td>
                    <td>
                      <span style="color: #D97706; font-size: 0.75rem; letter-spacing: 1px;">
                        <ng-container *ngFor="let s of getStarsArray(t.stars)">&#9733;</ng-container>
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.3rem;">
                        <button class="btn btn-sm btn-outline" (click)="openEditTestimonialModal(t)" title="Modifier">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm" style="background:#DC2626; color:white;" (click)="openDeleteTestimonialModal(t)" title="Supprimer">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr *ngIf="testimonials.length === 0">
                    <td colspan="5" style="text-align: center; padding: 2rem; color: #94A3B8;">Aucun témoignage configuré.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </section>

        <!-- TAB 6: CLIENTS -->
        <section *ngIf="activeTab === 'clients'" class="dashboard-section active">
          <div class="panel">
            <div class="panel-header" style="flex-wrap: wrap; gap: 0.75rem;">
              <h2 class="panel-title">Répertoire Clientèle Kiki Traiteur</h2>
              <button class="btn btn-accent" (click)="openAddClientModal()"><i class="fas fa-plus me-1"></i> Créer un Client</button>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom Client</th>
                    <th>Société</th>
                    <th>E-mail</th>
                    <th>Catégorie</th>
                    <th style="width: 100px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of getClientsForPage()" style="font-size: 0.8rem;">
                    <td><strong>{{ c.id }}</strong></td>
                    <td>{{ c.name }}</td>
                    <td>{{ c.organization || '-' }}</td>
                    <td>{{ c.email }}</td>
                    <td>
                      <span class="badge" [style.background]="c.organization ? '#DBEAFE' : '#F3E8FF'" [style.color]="c.organization ? '#1E40AF' : '#6B21A8'" style="font-weight: 700;">
                        <i [class]="c.organization ? 'fas fa-building me-1' : 'fas fa-user me-1'"></i>
                        {{ c.organization ? 'Entreprise' : 'Particulier' }}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.3rem;">
                        <button type="button" class="btn btn-sm btn-outline" (click)="openEditModal(c); $event.stopPropagation()" title="Modifier Client">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm" style="background:#DC2626; color:white;" (click)="openDeleteModal(c); $event.stopPropagation()" title="Supprimer Client">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION CLIENTS -->
            <div *ngIf="getClientTotalPages() > 1" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.25rem; align-items: center;">
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="clientPage === 1" [style.opacity]="clientPage === 1 ? '0.5' : '1'" (click)="clientPage = clientPage - 1">
                Précédent
              </button>
              <button *ngFor="let p of getClientPageArray()" type="button" class="btn btn-sm"
                [style.background]="clientPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="clientPage === p ? 'white' : '#64748B'"
                [style.border]="clientPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (clientPage = $any(p))">
                {{ p }}
              </button>
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="clientPage === getClientTotalPages()" [style.opacity]="clientPage === getClientTotalPages() ? '0.5' : '1'" (click)="clientPage = clientPage + 1">
                Suivant
              </button>
            </div>
          </div>
        </section>

        <!-- TAB 7: STAFF -->
        <section *ngIf="activeTab === 'staff'" class="dashboard-section active">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Personnel Traiteur & Brigade de Cuisine</h2>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Nom Prénom</th>
                    <th>Rôle / Poste</th>
                    <th>Téléphone</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let s of getStaffForPage()">
                    <td><strong>{{ s.name }}</strong></td>
                    <td>{{ s.role }}</td>
                    <td>{{ s.phone }}</td>
                    <td><span class="badge badge-accepted">Disponible</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PAGINATION STAFF -->
            <div *ngIf="getStaffTotalPages() > 1" style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1.25rem; align-items: center;">
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="staffPage === 1" [style.opacity]="staffPage === 1 ? '0.5' : '1'" (click)="staffPage = staffPage - 1">
                Précédent
              </button>
              <button *ngFor="let p of getStaffPageArray()" type="button" class="btn btn-sm"
                [style.background]="staffPage === p ? '#7A1C1C' : (p === '...' ? 'transparent' : 'white')"
                [style.color]="staffPage === p ? 'white' : '#64748B'"
                [style.border]="staffPage === p ? '1px solid #7A1C1C' : (p === '...' ? 'none' : '1px solid #CBD5E1')"
                [disabled]="p === '...'" [style.cursor]="p === '...' ? 'default' : 'pointer'"
                style="width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.85rem; padding: 0; transition: all 0.2s;"
                (click)="p !== '...' && (staffPage = $any(p))">
                {{ p }}
              </button>
              <button type="button" class="btn btn-sm" style="background: white; color: #64748B; border: 1px solid #CBD5E1; border-radius: 8px; font-weight: 600; font-size: 0.85rem; padding: 0 0.75rem; cursor: pointer; transition: all 0.2s; height: 32px;" [disabled]="staffPage === getStaffTotalPages()" [style.opacity]="staffPage === getStaffTotalPages() ? '0.5' : '1'" (click)="staffPage = staffPage + 1">
                Suivant
              </button>
            </div>
          </div>
        </section>

        <!-- TAB 8: GOOGLE SYNC -->
        <section *ngIf="activeTab === 'sync'" class="dashboard-section active">
          <div class="panel" style="max-width: 640px;">
            <div class="panel-header">
              <h2 class="panel-title">Synchronisation Google Calendar & Sécurité</h2>
            </div>
            <div style="background: #1E293B; color: white; padding: 1.25rem; border-radius: 10px; margin-bottom: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <h4 style="color: white; font-size: 0.95rem; margin-bottom: 0.35rem;">Statut de synchronisation</h4>
                  <p style="color: #94A3B8; font-size: 0.8rem; margin: 0;">{{ syncStatus }}</p>
                </div>
                <button class="btn btn-accent" (click)="triggerSync()">
                  <i class="fas fa-sync me-1"></i> Synchroniser maintenant
                </button>
              </div>
            </div>
            <p style="color: #64748B; font-size: 0.82rem; margin: 0;">
              La synchronisation bidirectionnelle Google Calendar met à jour automatiquement votre agenda en ligne chaque fois qu'un devis est accepté ou modifié dans l'ERP Kiki Traiteur.
            </p>
          </div>
        </section>

        <!-- MODAL 1: CRÉER UN ÉVÉNEMENT (AVEC RECHERCHE CLIENT & MULTI-SÉLECTION PERSONNEL) -->
        <div *ngIf="showCreateEventModal" class="custom-modal-backdrop" (click)="closeCreateEventModal()">
          <div class="custom-modal-box" style="max-width: 650px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 style="margin: 0; color: #7A1C1C;"><i class="fas fa-calendar-plus me-2"></i>Créer un Événement (Agenda ERP)</h3>
              <button class="btn-close" (click)="closeCreateEventModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <!-- CLIENT SEARCH / SELECTION -->
              <div class="form-group" style="margin-bottom: 1.25rem; background: #F8FAFC; padding: 1rem; border-radius: 8px; border: 1px solid #E2E8F0;">
                <label style="font-weight: 600; color: #1E293B; display: block; margin-bottom: 0.4rem;">
                  <i class="fas fa-user-tag me-1" style="color: #7A1C1C;"></i> Sélection du Client <span style="color: #DC2626;">*</span>
                </label>
                <div *ngIf="selectedClientForEvent" style="display: flex; align-items: center; justify-content: space-between; background: #FEF2F2; border: 1px solid #FECACA; padding: 0.6rem 0.85rem; border-radius: 6px;">
                  <div>
                    <strong style="color: #7A1C1C;">{{ selectedClientForEvent.name }}</strong>
                    <span style="color: #64748B; font-size: 0.8rem; margin-left: 0.5rem;">({{ selectedClientForEvent.email }} - {{ selectedClientForEvent.phone }})</span>
                  </div>
                  <button *ngIf="!isEventFromDevis" type="button" class="btn btn-sm" style="background: #DC2626; color: white;" (click)="removeSelectedClient()">
                    <i class="fas fa-times"></i> Changer
                  </button>
                </div>
                <div *ngIf="!selectedClientForEvent">
                  <input type="text" class="form-control" [(ngModel)]="clientSearchQuery" placeholder="Rechercher par nom ou e-mail..." style="margin-bottom: 0.5rem;">
                  <div style="max-height: 120px; overflow-y: auto; border: 1px solid #E2E8F0; border-radius: 6px; background: white;">
                    <div *ngFor="let c of getFilteredClients()" (click)="selectClientForEvent(c)" style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #F1F5F9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" class="client-search-item">
                      <div>
                        <strong>{{ c.name }}</strong>
                        <small style="color: #64748B; display: block;">{{ c.email }} • {{ c.phone }}</small>
                      </div>
                      <span class="badge" style="background: #E2E8F0; color: #334155;">Sélectionner</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- EVENEMENT DETAILS -->
              <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label>Titre de l'événement</label>
                  <input type="text" class="form-control" [disabled]="isEventFromDevis" [(ngModel)]="eventForm.title" placeholder="Ex: Mariage VIP - La Diva">
                </div>
                <div class="form-group">
                  <label>Type de prestation</label>
                  <select class="form-control" [disabled]="isEventFromDevis" [(ngModel)]="eventForm.type">
                    <option value="salle-diva">Salle La Diva</option>
                    <option value="traiteur">Service Traiteur Prestige</option>
                    <option value="evenements">Organisation Événements</option>
                    <option value="decoration">Design & Décoration</option>
                    <option value="foodtruck">Food Truck Gourmet</option>
                  </select>
                </div>
              </div>

              <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label>Date</label>
                  <input type="date" class="form-control" [(ngModel)]="eventForm.date">
                </div>
                <div class="form-group">
                  <label>Heure</label>
                  <input type="time" class="form-control" [(ngModel)]="eventForm.time">
                </div>
                <div class="form-group">
                  <label>Convives</label>
                  <input type="number" class="form-control" [disabled]="isEventFromDevis" [(ngModel)]="eventForm.guests">
                </div>
              </div>

              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Lieu de réception</label>
                <input type="text" class="form-control" [disabled]="isEventFromDevis" [(ngModel)]="eventForm.location" placeholder="Ex: Salle La Diva, Dakar ou Villa Almadies">
              </div>

              <!-- SIGNATURE GASTRONOMIQUE -->
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label style="font-weight: 600; color: #1E293B; display: block; margin-bottom: 0.35rem;">
                  <i class="fas fa-utensils me-1" style="color: #7A1C1C;"></i> Signature Gastronomique Kiki Traiteur <span style="color: #DC2626;">*</span>
                </label>
                <select class="form-control" [disabled]="isEventFromDevis" [(ngModel)]="eventForm.signatureGastronomique">
                  <option value="Cuisine Royale Sénégalaise & Fusion">Cuisine Royale Sénégalaise & Fusion</option>
                  <option value="Buffet Gastronomique International">Buffet Gastronomique International</option>
                  <option value="Cocktail Dînatoire Prestige La Diva">Cocktail Dînatoire Prestige La Diva</option>
                  <option value="Menu Signature Kiki Traiteur">Menu Signature Kiki Traiteur</option>
                  <option value="Service à la Table VIP & Voiturier">Service à la Table VIP & Voiturier</option>
                </select>
              </div>

              <!-- STAFF SEARCH / SELECTION MULTIPLE -->
              <div class="form-group" style="background: #F8FAFC; padding: 1rem; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 1rem;">
                <label style="font-weight: 600; color: #1E293B; display: block; margin-bottom: 0.5rem;">
                  <i class="fas fa-users-cog me-1" style="color: #7A1C1C;"></i> Assignation du Personnel Traiteur (Recherche & Sélection)
                </label>
                <!-- LISTE DES PERSONNELS DÉJÀ SÉLECTIONNÉS -->
                <div *ngIf="selectedStaffListForEvent && selectedStaffListForEvent.length > 0" style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem;">
                  <div *ngFor="let st of selectedStaffListForEvent" style="display: flex; align-items: center; background: #FEF2F2; border: 1px solid #FECACA; padding: 0.35rem 0.65rem; border-radius: 6px;">
                    <strong style="color: #7A1C1C; font-size: 0.78rem; margin-right: 0.4rem;">{{ st.name }} ({{ st.role }})</strong>
                    <button type="button" class="btn-close" style="font-size: 0.75rem; color: #DC2626;" (click)="removeStaffFromEvent(st.id)"><i class="fas fa-times"></i></button>
                  </div>
                </div>
                <!-- RECHERCHE PERSONNEL -->
                <input type="text" class="form-control" [(ngModel)]="staffSearchQuery" placeholder="Rechercher un membre du personnel par nom ou rôle..." style="margin-bottom: 0.5rem;">
                <div style="max-height: 120px; overflow-y: auto; border: 1px solid #E2E8F0; border-radius: 6px; background: white;">
                  <div *ngFor="let s of getFilteredStaffForSearch()" (click)="addStaffToEvent(s)" style="padding: 0.5rem 0.75rem; border-bottom: 1px solid #F1F5F9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong style="font-size: 0.82rem;">{{ s.name }}</strong>
                      <small style="color: #64748B; display: block; font-size: 0.72rem;">{{ s.role }}</small>
                    </div>
                    <span class="badge" style="background: #E2E8F0; color: #334155;"><i class="fas fa-plus me-1"></i> Sélectionner</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
              <button type="button" class="btn btn-outline" (click)="closeCreateEventModal()">Annuler</button>
              <button type="button" class="btn" style="background: #7A1C1C; color: white;" (click)="submitCreateEvent()">
                <i class="fas fa-check me-1"></i> Enrégistrer dans le Calendrier
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL DÉTAILS DE L'ÉVÉNEMENT (POPUP CALENDRIER) -->
        <div *ngIf="showEventDetailsModal && selectedDetailEvent" class="custom-modal-backdrop" (click)="closeEventDetailsModal()">
          <div class="custom-modal-box" style="max-width: 550px; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);" (click)="$event.stopPropagation()">
            <!-- En-tête bordeaux -->
            <div class="modal-header" style="background: #7A1C1C; color: white; padding: 1.25rem 1.5rem; border-bottom: none;">
              <h3 style="margin: 0; color: white; font-family: 'Playfair Display', serif; font-size: 1.25rem;">
                <i class="fas fa-calendar-alt me-2"></i>Détails de l'événement #{{ selectedDetailEvent.id }}
              </h3>
              <button class="btn-close" style="filter: brightness(0) invert(1);" (click)="closeEventDetailsModal()"><i class="fas fa-times"></i></button>
            </div>
            <!-- Corps de la modale -->
            <div class="modal-body" style="padding: 1.5rem;">
              <div style="margin-bottom: 1.25rem; border-bottom: 1px solid #E2E8F0; padding-bottom: 1rem;">
                <h2 style="margin: 0 0 0.4rem 0; font-family: 'Playfair Display', serif; color: #1E293B; font-size: 1.35rem;">
                  {{ selectedDetailEvent.title }}
                </h2>
                <span class="badge" style="background: #FEF2F2; color: #991B1B; font-weight: 700; padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem;">
                  {{ getPrestationName(selectedDetailEvent.type) }}
                </span>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.25rem;">
                <div style="background: #F8FAFC; padding: 0.85rem; border-radius: 8px; border: 1px solid #E2E8F0;">
                  <span style="font-size: 0.72rem; color: #64748B; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Date & Heure</span>
                  <strong style="color: #1E293B; font-size: 0.9rem; display: block;">{{ formatDate(selectedDetailEvent.date) }}</strong>
                  <span style="color: #7A1C1C; font-weight: 600; font-size: 0.85rem;">{{ selectedDetailEvent.time }} - {{ getEndTime(selectedDetailEvent.time) }}</span>
                </div>
                <div style="background: #F8FAFC; padding: 0.85rem; border-radius: 8px; border: 1px solid #E2E8F0;">
                  <span style="font-size: 0.72rem; color: #64748B; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.25rem;">Lieu & Convives</span>
                  <strong style="color: #1E293B; font-size: 0.9rem; display: block;">{{ selectedDetailEvent.location }}</strong>
                  <span style="color: #64748B; font-size: 0.85rem;">{{ selectedDetailEvent.guests }} personnes</span>
                </div>
              </div>

              <!-- SIGNATURE GASTRONOMIQUE -->
              <div style="background: #FEF2F2; border: 1px solid #FECACA; padding: 0.85rem 1rem; border-radius: 8px; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.85rem;">
                <div style="background: #7A1C1C; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.05rem; flex-shrink: 0; box-shadow: 0 2px 4px rgba(122,28,28,0.2);">
                  <i class="fas fa-utensils"></i>
                </div>
                <div>
                  <span style="font-size: 0.72rem; color: #991B1B; text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 0.15rem;">Signature Gastronomique</span>
                  <strong style="color: #7A1C1C; font-size: 0.95rem; font-family: 'Playfair Display', serif;">{{ selectedDetailEvent.signatureGastronomique || getEventSignature(selectedDetailEvent) }}</strong>
                </div>
              </div>

              <!-- CLIENT (PARTICULIER OU ENTREPRISE) -->
              <div style="background: #F8FAFC; padding: 0.85rem 1rem; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 1.25rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                  <span style="font-size: 0.72rem; color: #64748B; text-transform: uppercase; font-weight: 700;">Client commanditaire</span>
                  <!-- Badge Particulier / Entreprise -->
                  <span *ngIf="getClientType(selectedDetailEvent.clientId) === 'Entreprise'"
                    style="background: #DBEAFE; color: #1E40AF; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; border: 1px solid #BFDBFE; display: inline-flex; align-items: center;">
                    <i class="fas fa-building me-1"></i> Entreprise
                  </span>
                  <span *ngIf="getClientType(selectedDetailEvent.clientId) !== 'Entreprise'"
                    style="background: #F3E8FF; color: #6B21A8; font-weight: 700; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.75rem; border: 1px solid #E9D5FF; display: inline-flex; align-items: center;">
                    <i class="fas fa-user me-1"></i> Particulier
                  </span>
                </div>
                <strong style="color: #1E293B; font-size: 1rem; display: block;">{{ selectedDetailEvent.clientName || getClientName(selectedDetailEvent.clientId) }}</strong>
                <span style="color: #64748B; font-size: 0.82rem; display: block; margin-top: 0.15rem;" *ngIf="selectedDetailEvent.clientPhone || getClientEmail(selectedDetailEvent.clientId)">{{ selectedDetailEvent.clientPhone || getClientPhone(selectedDetailEvent.clientId) }} • {{ selectedDetailEvent.clientEmail || getClientEmail(selectedDetailEvent.clientId) }}</span>
                <span style="color: #7A1C1C; font-size: 0.8rem; font-weight: 600; display: block; margin-top: 0.35rem;" *ngIf="getClientType(selectedDetailEvent.clientId) === 'Entreprise' && getClientOrg(selectedDetailEvent.clientId)">
                  <i class="fas fa-briefcase me-1"></i> {{ getClientOrg(selectedDetailEvent.clientId) }}
                </span>
              </div>

              <!-- PERSONNEL ASSIGNÉ (MÊME SI 20 PERSONNELS) -->
              <div style="margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.78rem; color: #475569; font-weight: 700;">
                    <i class="fas fa-users me-1" style="color: #7A1C1C;"></i> Brigade Traiteur Assignée :
                  </span>
                  <span *ngIf="selectedDetailEvent.staffIds && selectedDetailEvent.staffIds.length > 0"
                    style="background: #E2E8F0; color: #1E293B; font-weight: 700; font-size: 0.72rem; padding: 0.15rem 0.55rem; border-radius: 20px;">
                    {{ selectedDetailEvent.staffIds.length }} personnel{{ selectedDetailEvent.staffIds.length > 1 ? 's' : '' }}
                  </span>
                </div>
                <div style="max-height: 180px; overflow-y: auto; padding: 0.65rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  <div *ngFor="let stId of selectedDetailEvent.staffIds"
                    style="background: #EEF2FF; color: #3730A3; font-weight: 600; padding: 0.4rem 0.75rem; border-radius: 6px; font-size: 0.78rem; border: 1px solid #E0E7FF; display: flex; align-items: center; gap: 0.35rem;">
                    <i class="fas fa-user-check" style="color: #4F46E5;"></i>
                    <span>{{ getStaffName(stId) }} <small style="color: #6366F1; font-weight: 500;">({{ getStaffRole(stId) }})</small></span>
                  </div>
                  <div *ngIf="!selectedDetailEvent.staffIds || selectedDetailEvent.staffIds.length === 0" style="color: #94A3B8; font-size: 0.82rem; font-style: italic; width: 100%; text-align: center; padding: 1rem 0;">
                    Aucun personnel n'a encore été assigné à cet événement.
                  </div>
                </div>
              </div>
            </div>
            <!-- Footer -->
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding: 1rem 1.5rem; background: #F8FAFC;">
              <button type="button" class="btn btn-outline" (click)="closeEventDetailsModal()">Fermer</button>
            </div>
          </div>
        </div>

        <!-- MODAL 2: DEVIS & TRANSMISSION PAR E-MAIL -->
        <div *ngIf="showDevisModal" class="custom-modal-backdrop" (click)="closeDevisModal()">
          <div class="custom-modal-box" style="max-width: 680px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 style="margin: 0; color: #7A1C1C;"><i class="fas fa-file-invoice-dollar me-2"></i>{{ isNewDevis ? 'Création de devis' : 'Édition & Envoi du Devis par Mail' }}</h3>
              <button class="btn-close" (click)="closeDevisModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <!-- SÉLECTION CLIENT ET INFOS SI NOUVEAU DEVIS -->
              <div *ngIf="isNewDevis" style="background: #F8FAFC; padding: 1rem; border-radius: 8px; border: 1px solid #E2E8F0; margin-bottom: 1rem;">
                <label style="font-weight: 600; color: #1E293B; display: block; margin-bottom: 0.35rem;">
                  <i class="fas fa-user-tag me-1" style="color: #7A1C1C;"></i> Client destinataire du devis <span style="color: #DC2626;">*</span>
                </label>
                <div *ngIf="selectedClientForDevis" style="display: flex; align-items: center; justify-content: space-between; background: #FEF2F2; border: 1px solid #FECACA; padding: 0.5rem 0.75rem; border-radius: 6px; margin-bottom: 0.75rem;">
                  <div>
                    <strong style="color: #7A1C1C;">{{ selectedClientForDevis.name }}</strong>
                    <span style="color: #64748B; font-size: 0.8rem; margin-left: 0.5rem;">({{ selectedClientForDevis.email }})</span>
                  </div>
                  <button type="button" class="btn btn-sm" style="background: #DC2626; color: white;" (click)="selectedClientForDevis = null">
                    <i class="fas fa-times"></i> Changer
                  </button>
                </div>
                <div *ngIf="!selectedClientForDevis" style="margin-bottom: 0.75rem;">
                  <input type="text" class="form-control" [(ngModel)]="devisSearchClientQuery" placeholder="Rechercher par nom client..." style="margin-bottom: 0.4rem;">
                  <div style="max-height: 110px; overflow-y: auto; border: 1px solid #E2E8F0; border-radius: 6px; background: white;">
                    <div *ngFor="let c of getFilteredClientsForDevis()" (click)="selectClientForDevis(c)" style="padding: 0.45rem 0.75rem; border-bottom: 1px solid #F1F5F9; cursor: pointer; display: flex; justify-content: space-between; align-items: center;">
                      <div><strong>{{ c.name }}</strong> <small style="color: #64748B;">({{ c.email }})</small></div>
                      <span class="badge" style="background: #E2E8F0; color: #334155;">Sélectionner</span>
                    </div>
                  </div>
                </div>

                <!-- INFOS DU DEVIS (Prestation, signature gastronomique, convives, lieu, date, heure) -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0.75rem;">
                  <div>
                    <label style="font-size: 0.75rem; color: #475569; font-weight: 600;">Type de prestation</label>
                    <select class="form-control" [(ngModel)]="devisForm.prestationId" style="font-size: 0.8rem;">
                      <option value="salle-diva">Salle La Diva</option>
                      <option value="traiteur">Service Traiteur Prestige</option>
                      <option value="evenements">Organisation Événements</option>
                      <option value="decoration">Design & Décoration</option>
                      <option value="location">Location de Matériel</option>
                    </select>
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; color: #475569; font-weight: 600;">Signature gastronomique <span style="color: #DC2626;">*</span></label>
                    <select class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="devisForm.signatureGastronomique" style="font-size: 0.8rem;">
                      <option value="Menu Signature Kiki Traiteur">Menu Signature Kiki Traiteur</option>
                      <option value="Cuisine Royale Sénégalaise & Fusion">Cuisine Royale Sénégalaise & Fusion</option>
                      <option value="Buffet Gastronomique International">Buffet Gastronomique International</option>
                      <option value="Cocktail Dînatoire Prestige La Diva">Cocktail Dînatoire Prestige La Diva</option>
                      <option value="Service à la Table VIP & Voiturier">Service à la Table VIP & Voiturier</option>
                      <option value="Sur-mesure / À la carte">Sur-mesure / À la carte</option>
                    </select>
                  </div>
                </div>
                <div style="display: grid; grid-template-columns: 0.8fr 1.3fr 1fr 0.8fr; gap: 0.75rem;">
                  <div>
                    <label style="font-size: 0.75rem; color: #475569; font-weight: 600;">Convives</label>
                    <input type="number" class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="devisForm.guests" style="font-size: 0.8rem;">
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; color: #475569; font-weight: 600;">Lieu de réception</label>
                    <input type="text" class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="devisForm.location" style="font-size: 0.8rem;">
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; color: #475569; font-weight: 600;">Date prévue</label>
                    <input type="date" class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="devisForm.date" style="font-size: 0.8rem;">
                  </div>
                  <div>
                    <label style="font-size: 0.75rem; color: #475569; font-weight: 600;">Heure</label>
                    <input type="time" class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="devisForm.time" style="font-size: 0.8rem;">
                  </div>
                </div>
              </div>

              <!-- INFOS CLIENT STANDARD (si devis existant) -->
              <div *ngIf="!isNewDevis" style="background: #F8FAFC; padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <strong>Client :</strong> {{ devisForm.clientName }}
                </div>
                <div>
                  <strong>E-mail :</strong> {{ devisForm.clientEmail }}
                </div>
                <span class="badge" style="background: #FEF3C7; color: #D97706;">{{ devisForm.status | uppercase }}</span>
              </div>

              <!-- Lignes du devis (sans quantité ni TVA, uniquement Titre et Montant en FCFA + Remise) -->
              <table class="admin-table" style="margin-bottom: 1rem;">
                <thead>
                  <tr>
                    <th>Titre / Description du montant</th>
                    <th style="width: 170px;">Montant (FCFA)</th>
                    <th style="width: 50px;"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of devisForm.items; let i = index">
                    <td><input type="text" class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="item.desc" (ngModelChange)="onDevisFormChange()" placeholder="Ex: Forfait Buffet Gastronomique"></td>
                    <td><input type="number" class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="item.unitPrice" (ngModelChange)="onDevisFormChange()"></td>
                    <td>
                      <button *ngIf="!isDevisReadonly" type="button" class="btn btn-sm" style="color: #DC2626;" (click)="removeDevisItem(i)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <button *ngIf="!isDevisReadonly" type="button" class="btn btn-sm btn-outline" (click)="addDevisItem()" style="margin-bottom: 1.25rem;">
                <i class="fas fa-plus me-1"></i> Ajouter un titre de montant
              </button>

              <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
                <div style="width: 280px; background: #F8FAFC; padding: 1.15rem; border-radius: 10px; border: 1px solid #E2E8F0;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.85rem;">
                    <span>Sous-total :</span> <strong>{{ getDevisSubtotal() | number }} FCFA</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 0.6rem; align-items: center; font-size: 0.85rem;">
                    <span>Remise (%) :</span>
                    <input type="number" class="form-control" [disabled]="isDevisReadonly" [(ngModel)]="devisForm.discount" (ngModelChange)="onDevisFormChange()" style="width: 75px; padding: 0.25rem 0.5rem; text-align: right;">
                  </div>
                  <div style="display: flex; justify-content: space-between; border-top: 2px solid #CBD5E1; padding-top: 0.6rem; color: #7A1C1C; font-size: 1.12rem; font-weight: 800;">
                    <span>Total Net :</span> <strong>{{ getDevisTotal() | number }} FCFA</strong>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding: 1rem 1.5rem; background: #F8FAFC;">
              <div style="display: flex; gap: 0.6rem; align-items: center;">
                <button type="button" class="btn btn-outline" (click)="closeDevisModal()">{{ isDevisReadonly ? 'Fermer' : 'Annuler' }}</button>
                <button *ngIf="!isDevisReadonly && !isNewDevis && isSentStatus(devisForm.status)" type="button" class="btn" style="background: #DC2626; color: white; font-weight: 600; padding: 0.55rem 1rem;" (click)="rejectDevisFromModal()">
                  <i class="fas fa-times me-1"></i> Refuser la demande
                </button>
              </div>
              <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
                <!-- Bouton télécharger PDF (visible si un devis existe en base) -->
                <button *ngIf="currentDevisId" type="button" class="btn" 
                  style="background: #475569; color: white; font-weight: 600; padding: 0.55rem 1rem;"
                  [disabled]="isDevisDownloading"
                  (click)="_downloadPdf(currentDevisId!)">
                  <i [class]="isDevisDownloading ? 'fas fa-spinner fa-spin me-1' : 'fas fa-download me-1'"></i>
                  {{ isDevisDownloading ? 'Génération...' : 'Télécharger PDF' }}
                </button>
                <!-- Bouton envoyer par email -->
                <button *ngIf="!isDevisReadonly" type="button" class="btn" 
                  style="background: #7A1C1C; color: white; font-weight: 700; padding: 0.55rem 1.2rem;"
                  [disabled]="isDevisSending"
                  (click)="sendDevisByEmail()">
                  <i [class]="isDevisSending ? 'fas fa-spinner fa-spin me-1' : 'fas fa-paper-plane me-1'"></i>
                  {{ isDevisSending ? 'Envoi en cours...' : 'ENREGISTRER ET ENVOYER PAR MAIL (PDF)' }}
                </button>
                <button *ngIf="canShowCreateEventButton(devisForm)" type="button" class="btn" style="background: #2563EB; color: white; font-weight: 600; padding: 0.55rem 1rem;" (click)="concludeDevisAndCreateEvent()">
                  <i class="fas fa-calendar-plus me-1"></i> Créer un événement
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL : DÉTAILS DE LA DEMANDE CLIENT (EN ATTENTE, ACCEPTÉE, ETC.) -->
        <div *ngIf="showRequestDetailsModal && currentDetailRequest" class="custom-modal-backdrop" (click)="closeRequestDetailsModal()">
          <div class="custom-modal-box" style="max-width: 580px; background: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);" (click)="$event.stopPropagation()">
            <!-- Header bordeaux premium -->
            <div class="modal-header" style="background: #7A1C1C; color: #FFFFFF; padding: 1.25rem 1.5rem; border-bottom: none;">
              <h3 style="margin: 0; color: #FFFFFF; font-family: 'Playfair Display', serif; font-size: 1.2rem;">
                <i class="fas fa-file-alt me-2"></i>Détails de la demande #{{ currentDetailRequest.id }}
              </h3>
              <button class="btn-close" style="color: #FFFFFF; opacity: 0.9;" (click)="closeRequestDetailsModal()"><i class="fas fa-times"></i></button>
            </div>

            <!-- Body : informations complètes envoyées par le client -->
            <div class="modal-body" style="padding: 1.75rem 1.5rem;">
              <!-- Client Banner -->
              <div style="display: flex; align-items: center; gap: 1rem; background: #FDFBF7; border: 1px solid #EBE4D5; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem;">
                <div style="width: 48px; height: 48px; border-radius: 50%; background: #7A1C1C; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem;">
                  {{ getClientInitials(currentDetailRequest.clientId) }}
                </div>
                <div>
                  <h4 style="margin: 0; color: #1E293B; font-size: 1.1rem; font-weight: 700;">
                    {{ currentDetailRequest.clientName || getClientName(currentDetailRequest.clientId) }}
                  </h4>
                  <div style="font-size: 0.8rem; color: #64748B; margin-top: 0.3rem;">
                    <i class="fas fa-envelope me-1" style="color: #7A1C1C;"></i>
                    {{ currentDetailRequest.clientEmail || getClientEmail(currentDetailRequest.clientId) }}
                    &nbsp;|&nbsp;
                    <i class="fas fa-phone me-1" style="color: #7A1C1C;"></i>
                    {{ currentDetailRequest.clientPhone || getClientPhone(currentDetailRequest.clientId) }}
                  </div>
                  <!-- Badge organisation si institution -->
                  <div *ngIf="currentDetailRequest.organization || currentDetailRequest.clientOrganization" style="margin-top: 0.35rem;">
                    <span style="background: #EDE9FE; color: #6D28D9; font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 20px;">
                      <i class="fas fa-building me-1"></i>
                      {{ currentDetailRequest.organization || currentDetailRequest.clientOrganization }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Grille d'informations -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">PRESTATION DEMANDÉE</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #7A1C1C; margin-top: 0.3rem;">
                    <i class="fas fa-utensils me-1"></i> {{ getPrestationName(currentDetailRequest.prestationId) }}
                  </div>
                </div>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">NOMBRE DE CONVIVES</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #1E293B; margin-top: 0.3rem;">
                    <i class="fas fa-users me-1" style="color: #D97706;"></i> {{ currentDetailRequest.guests || 'Non spécifié' }} personnes
                  </div>
                </div>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">DATE SOUHAITÉE</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #1E293B; margin-top: 0.3rem;">
                    <i class="fas fa-calendar-alt me-1" style="color: #2563EB;"></i> {{ formatDate(currentDetailRequest.date) }}
                    <span style="color: #64748B; font-weight: 500; font-size: 0.85rem; margin-left: 0.3rem;">&agrave; {{ currentDetailRequest.time || 'Non spécifié' }}</span>
                  </div>
                </div>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">LIEU / ADRESSE</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #1E293B; margin-top: 0.3rem;">
                    <i class="fas fa-map-marker-alt me-1" style="color: #DC2626;"></i> {{ currentDetailRequest.location || 'Dakar / À définir' }}
                  </div>
                </div>
                
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">TYPE DE CLIENT & ORGANISME</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #1E293B; margin-top: 0.3rem;">
                    <i class="fas fa-building me-1" style="color: #059669;"></i> {{ currentDetailRequest.clientType === 'entreprise' ? 'Entreprise' : 'Particulier' }}
                    <span *ngIf="currentDetailRequest.organization" style="color: #64748B; font-weight: 500; font-size: 0.85rem; margin-left: 0.3rem;">({{ currentDetailRequest.organization }})</span>
                  </div>
                </div>
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">STYLE DE CUISINE</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #1E293B; margin-top: 0.3rem;">
                    <i class="fas fa-concierge-bell me-1" style="color: #D97706;"></i> {{ currentDetailRequest.cuisine || 'Non spécifié' }}
                  </div>
                </div>
                <!-- Date de soumission -->
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">SOUMISE LE</span>
                  <div style="font-size: 0.88rem; font-weight: 600; color: #475569; margin-top: 0.3rem;">
                    <i class="fas fa-clock me-1" style="color: #64748B;"></i>
                    {{ currentDetailRequest.dateSubmitted ? formatDate(currentDetailRequest.dateSubmitted) : "Aujourd'hui" }}
                  </div>
                </div>
                <!-- Statut actuel -->
                <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 0.9rem;">
                  <span style="font-size: 0.72rem; color: #64748B; font-weight: 600; text-transform: uppercase;">STATUT ACTUEL</span>
                  <div style="margin-top: 0.3rem;">
                    <span class="badge" [ngClass]="getBadgeClass(currentDetailRequest.status)">
                      {{ getStatusLabel(currentDetailRequest.status) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Notes & Commentaire client -->
              <div style="background: #F1F5F9; border-left: 4px solid #7A1C1C; border-radius: 6px; padding: 1rem; margin-bottom: 0.5rem;">
                <span style="font-size: 0.72rem; color: #64748B; font-weight: 700; text-transform: uppercase; display: block; margin-bottom: 0.4rem;">PRÉCISIONS / MESSAGE DU CLIENT :</span>
                <p *ngIf="currentDetailRequest.message && currentDetailRequest.message.trim()" style="margin: 0; font-style: italic; color: #334155; font-size: 0.9rem; line-height: 1.5;">
                  &ldquo;{{ currentDetailRequest.message }}&rdquo;
                </p>
                <p *ngIf="!currentDetailRequest.message || !currentDetailRequest.message.trim()" style="margin: 0; font-style: italic; color: #64748B; font-size: 0.9rem; line-height: 1.5;">
                  Aucune note supplémentaire n'a été transmise par le client lors de la demande.
                </p>
              </div>

              <!-- Détails du devis associé (si applicable) -->
              <div *ngIf="currentDetailDevis && currentDetailDevis.items && currentDetailDevis.items.length > 0" style="margin-top: 1.5rem;">
                <h5 style="color: #7A1C1C; font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem; border-bottom: 2px solid #E2E8F0; padding-bottom: 0.4rem;">
                  <i class="fas fa-file-invoice-dollar me-2"></i>Détails du Devis Lié
                </h5>
                <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden;">
                  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem;">
                    <thead>
                      <tr style="background: #F8FAFC; color: #64748B; border-bottom: 1px solid #E2E8F0;">
                        <th style="padding: 0.75rem 1rem; font-weight: 600;">Désignation / Titre</th>
                        <th style="padding: 0.75rem 1rem; font-weight: 600; text-align: right;">Montant (FCFA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let item of currentDetailDevis.items" style="border-bottom: 1px solid #F1F5F9;">
                        <td style="padding: 0.75rem 1rem; color: #334155;">{{ item.desc }}</td>
                        <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 600; color: #1E293B;">{{ item.unitPrice | number }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr style="background: #FDFBF7;">
                        <td style="padding: 0.75rem 1rem; font-weight: 700; color: #7A1C1C; text-align: right;">TOTAL NET</td>
                        <td style="padding: 0.75rem 1rem; text-align: right; font-weight: 800; color: #7A1C1C;">{{ getDetailDevisTotal() | number }}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <!-- Footer : Actions dynamiques selon le statut -->
            <div class="modal-footer" style="background: #F8FAFC; padding: 1rem 1.5rem; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; flex-wrap: wrap; gap: 0.5rem;">
              <button type="button" class="btn btn-outline" (click)="closeRequestDetailsModal()">Fermer</button>
              <div style="display: flex; gap: 0.6rem; flex-wrap: wrap;">
                <!-- Si en attente : possibilité d'accepter ou refuser -->
                <ng-container *ngIf="isPendingStatus(currentDetailRequest.status)">
                  <button type="button" class="btn" style="background: #059669; color: white; font-weight: 600; padding: 0.5rem 1.1rem;" (click)="acceptRequestFromDetails()">
                    <i class="fas fa-check me-1"></i> ACCEPTER
                  </button>
                  <button type="button" class="btn" style="background: #DC2626; color: white; font-weight: 600; padding: 0.5rem 1.1rem;" (click)="rejectRequestFromDetails()">
                    <i class="fas fa-times me-1"></i> REFUSER
                  </button>
                </ng-container>
                <!-- Si accepté : ouvrir le formulaire de devis -->
                <ng-container *ngIf="isAcceptedStatus(currentDetailRequest.status)">
                  <button type="button" class="btn" style="background: #7A1C1C; color: white; font-weight: 600; padding: 0.5rem 1.1rem;" (click)="closeRequestDetailsModal(); openDevisModal(currentDetailRequest, false)">
                    <i class="fas fa-file-invoice-dollar me-1"></i> CRÉER LE DEVIS
                  </button>
                  <button type="button" class="btn" style="background: #DC2626; color: white; font-weight: 600; padding: 0.5rem 1.1rem;" (click)="rejectRequestFromDetails()">
                    <i class="fas fa-times me-1"></i> REFUSER
                  </button>
                </ng-container>
                <!-- Si devis envoyé -->
                <ng-container *ngIf="isSentStatus(currentDetailRequest.status)">
                  <button type="button" class="btn" style="background: #2563EB; color: white; font-weight: 600; padding: 0.5rem 1.1rem;" (click)="closeRequestDetailsModal(); openDevisModal(currentDetailRequest, false)">
                    <i class="fas fa-edit me-1"></i> MODIFIER LE DEVIS
                  </button>
                  <button type="button" class="btn" style="background: #059669; color: white; font-weight: 600; padding: 0.5rem 1.1rem;" (click)="closeRequestDetailsModal(); acceptDevisAndCreateEvent(currentDetailRequest)">
                    <i class="fas fa-calendar-plus me-1"></i> CRÉER ÉVÉNEMENT
                  </button>
                  <button type="button" class="btn" style="background: #475569; color: white; font-weight: 600; padding: 0.5rem 0.9rem;" (click)="closeRequestDetailsModal(); downloadDevisPdfForRequest(currentDetailRequest)">
                    <i class="fas fa-download me-1"></i> PDF
                  </button>
                </ng-container>
                <!-- Si aboutis : voir devis + télécharger PDF -->
                <ng-container *ngIf="isAboutisStatus(currentDetailRequest.status)">
                  <button type="button" class="btn" style="background: #5B21B6; color: white; font-weight: 600; padding: 0.5rem 1.1rem;" (click)="closeRequestDetailsModal(); openDevisModal(currentDetailRequest, true)">
                    <i class="fas fa-file-invoice me-1"></i> VOIR LE DEVIS
                  </button>
                  <button type="button" class="btn" style="background: #475569; color: white; font-weight: 600; padding: 0.5rem 0.9rem;" (click)="closeRequestDetailsModal(); downloadDevisPdfForRequest(currentDetailRequest)">
                    <i class="fas fa-download me-1"></i> PDF
                  </button>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL 3: TRAÇABILITÉ COMPLÈTE (DE LA DEMANDE JUSQU'À L'AGENDA) -->
        <div *ngIf="showTraceabilityModal && currentTraceRequest" class="custom-modal-backdrop" (click)="closeTraceabilityModal()">
          <div class="custom-modal-box" style="max-width: 600px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 style="margin: 0; color: #7A1C1C;"><i class="fas fa-history me-2"></i>Traçabilité du Devis & Planning</h3>
              <button class="btn-close" (click)="closeTraceabilityModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <div style="border-left: 3px solid #7A1C1C; padding-left: 1.25rem; margin: 0.5rem 0 1.5rem 0.5rem; position: relative;">
                <!-- Étape 1 : Demande soumise -->
                <div style="margin-bottom: 1.25rem; position: relative;">
                  <span style="position: absolute; left: -1.75rem; top: 0.1rem; width: 12px; height: 12px; border-radius: 50%; background: #059669; border: 2px solid white;"></span>
                  <strong style="color: #1E293B;">1. Demande soumise par le client</strong><br>
                  <div style="background: #F8FAFC; padding: 0.75rem; border-radius: 8px; margin-top: 0.4rem; font-size: 0.8rem; color: #334155;">
                    <div><strong>Client :</strong> {{ getClientName(currentTraceRequest.clientId) }}</div>
                    <div><strong>Prestation :</strong> {{ getPrestationName(currentTraceRequest.prestationId) }} ({{ currentTraceRequest.guests }} convives)</div>
                    <div><strong>Date souhaitée :</strong> {{ formatDate(currentTraceRequest.date) }} — <strong>Lieu :</strong> {{ currentTraceRequest.location || 'À définir' }}</div>
                    <div *ngIf="currentTraceRequest.message" style="margin-top: 0.3rem; font-style: italic; color: #475569;">
                      "{{ currentTraceRequest.message }}"
                    </div>
                  </div>
                </div>

                <!-- Étape 2 : Devis créé / envoyé -->
                <div style="margin-bottom: 1.25rem; position: relative;">
                  <span style="position: absolute; left: -1.75rem; top: 0.1rem; width: 12px; height: 12px; border-radius: 50%;" [style.background]="currentTraceDevis ? '#3B82F6' : '#CBD5E1'"></span>
                  <strong style="color: #1E293B;">2. Traitement & Chiffrage du Devis</strong><br>
                  <div *ngIf="currentTraceDevis && currentTraceDevis.history && currentTraceDevis.history.length">
                    <div *ngFor="let h of currentTraceDevis.history" style="font-size: 0.8rem; color: #475569; margin-top: 0.2rem;">
                      <i class="fas fa-envelope-open-text me-1" style="color: #3B82F6;"></i> {{ h.date }} — {{ h.action }}
                    </div>
                  </div>
                  <div *ngIf="!currentTraceDevis" style="color: #94A3B8; font-size: 0.8rem;">Devis en attente de génération</div>
                </div>

                <!-- Étape 3 : Événement dans l'agenda -->
                <div style="position: relative;">
                  <span style="position: absolute; left: -1.75rem; top: 0.1rem; width: 12px; height: 12px; border-radius: 50%;" [style.background]="currentTraceEvent ? '#7A1C1C' : '#CBD5E1'"></span>
                  <strong style="color: #1E293B;">3. Enrégistrement sur le Calendrier / Agenda</strong><br>
                  <div *ngIf="currentTraceEvent" style="color: #7A1C1C; font-size: 0.82rem; margin-top: 0.25rem;">
                    <i class="fas fa-calendar-check me-1"></i> Confirmé dans le planning : "{{ currentTraceEvent.title }}" le {{ formatDate(currentTraceEvent.date) }} à {{ currentTraceEvent.time }} ({{ currentTraceEvent.location }})
                  </div>
                  <div *ngIf="!currentTraceEvent" style="color: #94A3B8; font-size: 0.8rem;">
                    Pas encore programmé dans le calendrier.
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
              <button type="button" class="btn btn-outline" (click)="closeTraceabilityModal()">Fermer</button>
            </div>
          </div>
        </div>

        <!-- MODAL 4: MODIFIER UN CLIENT -->
        <div *ngIf="showEditModal && selectedClient" class="custom-modal-backdrop" (click)="closeEditModal()">
          <div class="custom-modal-box" style="max-width: 500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 style="margin: 0; color: #7A1C1C;"><i class="fas fa-user-edit me-2"></i>Modifier Fiche Client</h3>
              <button type="button" class="btn-close" (click)="closeEditModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Nom complet</label>
                <input type="text" class="form-control" [(ngModel)]="selectedClient.name">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Société / Organisation</label>
                <input type="text" class="form-control" [(ngModel)]="selectedClient.organization">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>E-mail</label>
                <input type="email" class="form-control" [(ngModel)]="selectedClient.email">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Téléphone</label>
                <input type="text" class="form-control" [(ngModel)]="selectedClient.phone">
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
              <button type="button" class="btn btn-outline" (click)="closeEditModal()">Annuler</button>
              <button type="button" class="btn" style="background: #7A1C1C; color: white;" (click)="saveClientChanges()">
                <i class="fas fa-save me-1"></i> Enregistrer
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL 5: FAQ -->
        <div *ngIf="showFaqModal" class="custom-modal-backdrop" (click)="closeFaqModal()">
          <div class="custom-modal-box" style="max-width: 540px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 style="margin: 0; color: #7A1C1C;"><i class="fas fa-question-circle me-2"></i>{{ isEditingFaq ? 'Modifier' : 'Ajouter' }} une FAQ</h3>
              <button class="btn-close" (click)="closeFaqModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Question</label>
                <input type="text" class="form-control" [(ngModel)]="faqForm.question" placeholder="Ex: Proposez-vous des menus halal ou végétariens ?">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Réponse</label>
                <textarea class="form-control" rows="4" [(ngModel)]="faqForm.answer" placeholder="Ex: Oui, tous nos buffets s'adaptent..."></textarea>
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Catégorie</label>
                <select class="form-control" [(ngModel)]="faqForm.category">
                  <option value="Général">Général</option>
                  <option value="Réservation">Réservation</option>
                  <option value="Salle La Diva">Salle La Diva</option>
                  <option value="Traiteur">Traiteur</option>
                </select>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
              <button type="button" class="btn btn-outline" (click)="closeFaqModal()">Annuler</button>
              <button type="button" class="btn" style="background: #7A1C1C; color: white;" (click)="saveFaq()">
                <i class="fas fa-save me-1"></i> Enregistrer
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL: TÉMOIGNAGE -->
        <div *ngIf="showTestimonialModal" class="custom-modal-backdrop" (click)="closeTestimonialModal()">
          <div class="custom-modal-box" style="max-width: 540px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 style="margin: 0; color: #7A1C1C;"><i class="fas fa-star me-2" style="color:#D97706;"></i>{{ isEditingTestimonial ? 'Modifier' : 'Ajouter' }} un témoignage</h3>
              <button class="btn-close" (click)="closeTestimonialModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="font-weight: 600; font-size: 0.75rem; color: #475569; text-transform: uppercase; display: block; margin-bottom: 0.35rem;">Témoignage *</label>
                <textarea class="form-control" rows="4" [(ngModel)]="testimonialForm.text" placeholder="Ex: Un service d’exception pour notre mariage..."></textarea>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.75rem; color: #475569; text-transform: uppercase; display: block; margin-bottom: 0.35rem;">Choisir le client (BDD) *</label>
                  <select class="form-control" [(ngModel)]="testimonialForm.clientName" (change)="onSelectClientForTestimonial($event)">
                    <option value="">-- Sélectionner un client --</option>
                    <option *ngFor="let c of clients" [value]="c.name">{{ c.name }} {{ c.organization ? '(' + c.organization + ')' : '' }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label style="font-weight: 600; font-size: 0.75rem; color: #475569; text-transform: uppercase; display: block; margin-bottom: 0.35rem;">Titre / Fonction</label>
                  <input type="text" class="form-control" [(ngModel)]="testimonialForm.clientTitle" placeholder="Ex: Directrice Orange Sénégal">
                </div>
              </div>
              <div class="form-group" style="margin-bottom: 0.5rem;">
                <label style="font-weight: 600; font-size: 0.75rem; color: #475569; text-transform: uppercase; display: block; margin-bottom: 0.5rem;">Évaluation (nombre d'étoiles)</label>
                <div style="display: flex; gap: 0.4rem; align-items: center;">
                  <button *ngFor="let n of [1,2,3,4,5]" type="button"
                    (click)="testimonialForm.stars = n"
                    style="background: none; border: none; cursor: pointer; font-size: 1.6rem; padding: 0; transition: transform 0.1s;"
                    [style.color]="n <= testimonialForm.stars ? '#D97706' : '#CBD5E1'"
                    title="{{ n }} étoile(s)">&#9733;</button>
                  <span style="font-size: 0.8rem; color: #64748B; margin-left: 0.5rem;">{{ testimonialForm.stars }} / 5</span>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
              <button type="button" class="btn btn-outline" (click)="closeTestimonialModal()">Annuler</button>
              <button type="button" class="btn" style="background: #7A1C1C; color: white;" (click)="saveTestimonial()">
                <i class="fas fa-save me-1"></i> Enregistrer
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL 6: AJOUT DE MÉDIA -->
        <div *ngIf="showMediaModal" class="custom-modal-backdrop" (click)="closeMediaModal()">
          <div class="custom-modal-box" style="max-width: 500px;" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3 style="margin: 0; color: #7A1C1C;"><i class="fas fa-upload me-2"></i>Ajouter un Média (Photo / Vidéo)</h3>
              <button class="btn-close" (click)="closeMediaModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Titre du visuel</label>
                <input type="text" class="form-control" [(ngModel)]="mediaForm.title" placeholder="Ex: Buffet de Mariage - Salle La Diva">
              </div>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>URL de l'image / vidéo</label>
                <input type="text" class="form-control" [(ngModel)]="mediaForm.url" placeholder="https://images.unsplash.com/photo-...">
              </div>
              <div class="form-group-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                <div class="form-group">
                  <label>Type de média</label>
                  <select class="form-control" [(ngModel)]="mediaForm.type">
                    <option value="image">Photo HD</option>
                    <option value="video">Vidéo</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Associé à l'événement</label>
                  <select class="form-control" [(ngModel)]="mediaForm.eventId">
                    <option value="">-- Autres / Général --</option>
                    <option *ngFor="let e of events" [value]="e.id">{{ e.title }}</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
              <button type="button" class="btn btn-outline" (click)="closeMediaModal()">Annuler</button>
              <button type="button" class="btn" style="background: #7A1C1C; color: white;" (click)="saveMedia()">
                <i class="fas fa-check me-1"></i> Ajouter à la Médiathèque
              </button>
            </div>
          </div>
        </div>
        <!-- MODAL: SUPPRESSION CLIENT -->
        <div *ngIf="showDeleteModal && selectedClient" class="custom-modal-backdrop" (click)="closeDeleteModal()">
          <div class="custom-modal-box" style="max-width: 450px;" (click)="$event.stopPropagation()">
            <div class="modal-header" style="background: #7A1C1C; color: white;">
              <h3 style="margin: 0; color: white; display: flex; align-items: center; font-size: 1.1rem;"><i class="fas fa-exclamation-triangle me-2" style="color: #FCD34D;"></i>Confirmer la suppression</h3>
              <button type="button" class="btn-close" style="filter: brightness(0) invert(1);" (click)="closeDeleteModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 0;">
                Êtes-vous sûr de vouloir supprimer le client <strong>{{ selectedClient.name }}</strong> définitivement ?<br>
                <span style="color: #DC2626; font-size: 0.85rem; display: block; margin-top: 0.5rem;"><i class="fas fa-info-circle me-1"></i>Cette action est irréversible.</span>
              </p>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-outline" (click)="closeDeleteModal()">Annuler</button>
              <button type="button" class="btn" style="background: #DC2626; color: white;" (click)="confirmDeleteClient()">
                <i class="fas fa-trash me-1"></i> Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL: SUPPRESSION FAQ -->
        <div *ngIf="showDeleteFaqModal && faqToDelete" class="custom-modal-backdrop" (click)="closeDeleteFaqModal()">
          <div class="custom-modal-box" style="max-width: 450px;" (click)="$event.stopPropagation()">
            <div class="modal-header" style="background: #7A1C1C; color: white;">
              <h3 style="margin: 0; color: white; display: flex; align-items: center; font-size: 1.1rem;"><i class="fas fa-exclamation-triangle me-2" style="color: #FCD34D;"></i>Confirmer la suppression</h3>
              <button class="btn-close" style="filter: brightness(0) invert(1);" (click)="closeDeleteFaqModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 0;">
                Êtes-vous sûr de vouloir supprimer cette FAQ ?<br>
                <em style="color: #1E293B; display: block; margin-top: 0.5rem; background: #F8FAFC; padding: 0.5rem; border-radius: 4px;">"{{ faqToDelete.question }}"</em>
              </p>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-outline" (click)="closeDeleteFaqModal()">Annuler</button>
              <button type="button" class="btn" style="background: #DC2626; color: white;" (click)="confirmDeleteFaq()">
                <i class="fas fa-trash me-1"></i> Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- MODAL: SUPPRESSION TÉMOIGNAGE -->
        <div *ngIf="showDeleteTestimonialModal && testimonialToDelete" class="custom-modal-backdrop" (click)="closeDeleteTestimonialModal()">
          <div class="custom-modal-box" style="max-width: 450px;" (click)="$event.stopPropagation()">
            <div class="modal-header" style="background: #7A1C1C; color: white;">
              <h3 style="margin: 0; color: white; display: flex; align-items: center; font-size: 1.1rem;"><i class="fas fa-exclamation-triangle me-2" style="color: #FCD34D;"></i>Confirmer la suppression</h3>
              <button class="btn-close" style="filter: brightness(0) invert(1);" (click)="closeDeleteTestimonialModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
              <p style="color: #475569; font-size: 0.95rem; line-height: 1.5; margin-bottom: 0;">
                Êtes-vous sûr de vouloir supprimer le témoignage de <strong>{{ testimonialToDelete.clientName }}</strong> ?
              </p>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 0.75rem;">
              <button type="button" class="btn btn-outline" (click)="closeDeleteTestimonialModal()">Annuler</button>
              <button type="button" class="btn" style="background: #DC2626; color: white;" (click)="confirmDeleteTestimonial()">
                <i class="fas fa-trash me-1"></i> Supprimer
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      font-family: 'Poppins', sans-serif;
    }
    .dashboard-container {
      display: flex;
      min-height: 100vh;
      background-color: #F8FAFC;
      overflow: hidden;
    }
    /* Sidebar - plus fine et plus compacte */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background-color: #7A1C1C;
      color: #FFFFFF;
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      max-height: 100vh;
      overflow-y: auto;
      border-right: 1px solid rgba(197, 168, 128, 0.15);
      box-sizing: border-box;
    }
    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 1.15rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid rgba(230, 218, 186, 0.15);
    }
    .sidebar-logo img {
      height: 32px;
    }
    .brand-title {
      font-family: 'Playfair Display', serif;
      font-size: 0.96rem;
      font-weight: 800;
      color: #FFFFFF;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      display: block;
    }
    .brand-subtitle {
      font-family: 'Dancing Script', cursive;
      color: #C5A880;
      font-size: 0.8rem;
      display: block;
    }
    .sidebar-menu {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex-grow: 1;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      padding: 0.52rem 0.75rem;
      border-radius: 6px;
      color: #EBE4D5;
      font-weight: 500;
      font-size: 0.78rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .sidebar-link i {
      font-size: 0.84rem;
    }
    .sidebar-link:hover {
      background-color: rgba(255, 255, 255, 0.08);
      color: #FFFFFF;
    }
    .sidebar-link.active {
      background-color: #DC2626;
      color: #FFFFFF;
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.25);
    }
    .sidebar-footer {
      border-top: 1px solid rgba(230, 218, 186, 0.15);
      padding-top: 0.85rem;
      margin-top: auto;
    }
    .user-badge-container {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background-color: #FDFBF7;
      color: #7A1C1C;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .user-info {
      display: flex;
      flex-direction: column;
    }
    .user-name {
      color: #FFFFFF;
      font-weight: 700;
      font-size: 0.82rem;
      line-height: 1.2;
    }
    .user-role {
      color: #C5A880;
      font-size: 0.62rem;
      letter-spacing: 0.06em;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 0.1rem;
    }
    .logout-link {
      color: #FCA5A5;
      font-size: 0.78rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      text-decoration: none;
      padding-top: 0.6rem;
      border-top: 1px solid rgba(197, 168, 128, 0.15);
      transition: color 0.2s;
      cursor: pointer;
    }
    .logout-link:hover {
      color: #F87171;
    }

    /* Main content - padding réduit pour une vue plus ramassée */
    .main-content {
      flex: 1 1 0;
      min-width: 0;
      padding: 1.35rem 1.75rem;
      overflow-y: auto;
      height: 100vh;
      box-sizing: border-box;
    }
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .dashboard-title h1 {
      font-family: 'Playfair Display', serif;
      font-size: 1.55rem;
      color: #7A1C1C;
      font-weight: 700;
      margin: 0;
    }
    .dashboard-title p {
      color: #64748B;
      font-size: 0.8rem;
      margin: 0.2rem 0 0 0;
    }
    .btn-create-event {
      background: linear-gradient(135deg, #EF4444 0%, #B91C1C 50%, #7F1D1D 100%);
      color: white;
      padding: 0.55rem 1.35rem;
      border-radius: 50px;
      font-weight: 700;
      font-size: 0.78rem;
      text-transform: uppercase;
      border: 1px solid rgba(255,255,255,0.15);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.25s ease;
    }
    .btn-create-event:hover {
      background: linear-gradient(135deg, #F87171 0%, #DC2626 50%, #991B1B 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.45);
    }

    /* Month Selector */
    .month-selector-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 0.35rem 0.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
      width: 250px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
      margin-bottom: 1.25rem;
    }
    .month-nav-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s;
    }
    .month-nav-btn:hover {
      background: #F1F5F9;
      color: #1E293B;
    }
    .month-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: 'Playfair Display', serif;
      font-size: 1rem;
      font-weight: 700;
      color: #7A1C1C;
    }
    .calendar-icon {
      color: #DC2626;
      font-size: 0.9rem;
    }

    /* 6 KPI Cards Grid - cartes et polices affinées */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    @media (max-width: 1100px) {
      .kpi-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
    .kpi-card {
      border-radius: 12px;
      padding: 1rem 1rem 0 1rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
    }
    .kpi-header {
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 0.65rem;
      text-transform: uppercase;
    }
    .kpi-body {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-bottom: 0.85rem;
    }
    .kpi-icon-box {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }
    .kpi-stat {
      display: flex;
      flex-direction: column;
    }
    .kpi-number {
      font-family: 'Playfair Display', serif;
      font-size: 1.55rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.15rem;
    }
    .kpi-sub {
      font-size: 0.72rem;
      opacity: 0.9;
    }
    .kpi-footer {
      padding: 0.5rem 1rem;
      margin: 0 -1rem;
      font-size: 0.72rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    /* KPI Card color variants */
    .card-dark-maroon {
      background: linear-gradient(135deg, #5A1C1C 0%, #431212 100%);
      color: #FFFFFF;
    }
    .card-dark-maroon .kpi-header { color: #E8DFD1; }
    .card-dark-maroon .kpi-icon-box { background: rgba(255,255,255,0.14); color: #FFFFFF; }
    .card-dark-maroon .kpi-footer { background: rgba(0,0,0,0.25); color: #E5E7EB; }

    .card-bright-red {
      background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);
      color: #FFFFFF;
    }
    .card-bright-red .kpi-header { color: #FEE2E2; }
    .card-bright-red .kpi-icon-box { background: rgba(255,255,255,0.2); color: #FFFFFF; }
    .card-bright-red .kpi-footer { background: rgba(0,0,0,0.2); color: #FEE2E2; }

    .card-gold {
      background: linear-gradient(135deg, #A4935E 0%, #8C7C4B 100%);
      color: #FFFFFF;
    }
    .card-gold .kpi-header { color: #F8F6F0; }
    .card-gold .kpi-icon-box { background: rgba(255,255,255,0.2); color: #FFFFFF; }
    .card-gold .kpi-footer { background: rgba(0,0,0,0.18); color: #F8F6F0; }

    .card-white {
      background: #FFFFFF;
      color: #1E293B;
      border: 1px solid #E2E8F0;
    }
    .card-white .kpi-header { color: #7A1C1C; }
    .card-white .kpi-number { color: #7A1C1C; }
    .card-white .kpi-sub { color: #64748B; }
    .card-white .kpi-icon-box { background: #F1F5F9; color: #7A1C1C; }
    .card-white .kpi-footer {
      background: #F8FAFC;
      color: #475569;
      border-top: 1px solid #E2E8F0;
    }

    .card-navy {
      background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
      color: #FFFFFF;
    }
    .card-navy .kpi-header { color: #E2E8F0; }
    .card-navy .kpi-icon-box { background: rgba(255,255,255,0.12); color: #FFFFFF; }
    .card-navy .kpi-footer { background: rgba(0,0,0,0.3); color: #E2E8F0; }

    .card-amber {
      background: linear-gradient(135deg, #D97706 0%, #B45309 100%);
      color: #FFFFFF;
    }
    .card-amber .kpi-header { color: #FEF3C7; }
    .card-amber .kpi-icon-box { background: rgba(255,255,255,0.2); color: #FFFFFF; }
    .card-amber .kpi-footer { background: rgba(0,0,0,0.2); color: #FEF3C7; }

    /* Dashboard Bottom Grid */
    .dashboard-bottom-grid {
      display: grid;
      grid-template-columns: 1.75fr 1.15fr;
      gap: 1rem;
      margin-top: 1.25rem;
    }
    @media (max-width: 1024px) {
      .dashboard-bottom-grid {
        grid-template-columns: 1fr;
      }
    }
    .chart-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 1.15rem 1.25rem;
      box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
    }
    .chart-header {
      margin-bottom: 0.85rem;
    }
    .chart-title {
      display: flex;
      align-items: center;
      font-family: 'Playfair Display', serif;
      font-size: 1rem;
      font-weight: 700;
      color: #7A1C1C;
      margin-bottom: 0.2rem;
    }
    .chart-subtitle {
      color: #64748B;
      font-size: 0.78rem;
      margin: 0;
    }
    .chart-filter-pills {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .chart-pill-btn {
      background: #F8FAFC;
      color: #475569;
      border: 1px solid #E2E8F0;
      border-radius: 50px;
      padding: 0.28rem 0.85rem;
      font-size: 0.72rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chart-pill-btn:hover {
      background: #F1F5F9;
      color: #1E293B;
      border-color: #CBD5E1;
    }
    .chart-pill-btn.active {
      background: #7A1C1C;
      color: #FFFFFF;
      border-color: #7A1C1C;
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(122, 28, 28, 0.25);
    }
    .svg-chart-container {
      width: 100%;
      margin-top: auto;
    }
    .svg-chart {
      width: 100%;
      height: auto;
      max-height: 180px;
      overflow: visible;
    }

    /* Right Stacked Cards */
    .right-stacked-cards {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .side-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 1.15rem 1.25rem;
      box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.03);
      display: flex;
      flex-direction: column;
    }
    .side-card-title {
      display: flex;
      align-items: center;
      font-family: 'Playfair Display', serif;
      font-size: 0.92rem;
      font-weight: 700;
      color: #7A1C1C;
      margin-bottom: 0.85rem;
    }
    .conflict-box {
      background: #FDFBF7;
      border: 1px solid #EBE4D5;
      border-radius: 10px;
      padding: 0.85rem 0.75rem;
      margin-bottom: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-around;
    }
    .conflict-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .conflict-num {
      font-family: 'Playfair Display', serif;
      font-size: 1.55rem;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 0.2rem;
    }
    .green-text { color: #059669; }
    .orange-text { color: #D97706; }
    .conflict-label {
      font-size: 0.65rem;
      font-weight: 700;
      color: #64748B;
      letter-spacing: 0.06em;
    }
    .conflict-divider {
      width: 1px;
      height: 36px;
      background: #EBE4D5;
    }
    .side-card-link {
      display: inline-flex;
      align-items: center;
      color: #7A1C1C;
      font-weight: 700;
      font-size: 0.76rem;
      text-decoration: none;
      letter-spacing: 0.03em;
      cursor: pointer;
      transition: transform 0.2s;
      margin-top: auto;
    }
    .side-card-link:hover {
      transform: translateX(3px);
    }
    .recent-requests-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      margin-bottom: 0.85rem;
    }
    .recent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.55rem;
      border-bottom: 1px solid #F1F5F9;
    }
    .recent-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .recent-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .recent-name {
      font-weight: 600;
      font-size: 0.82rem;
      color: #1E293B;
    }
    .recent-right {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .recent-badge {
      background: #F1F5F9;
      color: #64748B;
      padding: 0.15rem 0.55rem;
      border-radius: 4px;
      font-size: 0.68rem;
      font-weight: 500;
    }
    .recent-date {
      color: #94A3B8;
      font-size: 0.72rem;
      min-width: 48px;
      text-align: right;
    }

    /* Panels & Tables */
    /* Panels & Tables */
    .panel {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 1.15rem 1.35rem;
      box-shadow: 0 4px 15px -2px rgba(0, 0, 0, 0.04);
      margin-bottom: 1.25rem;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      border-bottom: 1px solid #E2E8F0;
      padding-bottom: 0.65rem;
    }
    .panel-title {
      font-family: 'Playfair Display', serif;
      font-size: 1.1rem;
      font-weight: 700;
      color: #7A1C1C;
      margin: 0;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
    }
    .admin-table th {
      text-align: left;
      padding: 0.4rem 0.6rem;
      font-size: 0.62rem;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      white-space: nowrap;
    }
    .admin-table td {
      padding: 0.45rem 0.6rem;
      border-bottom: 1px solid #F1F5F9;
      font-size: 0.70rem;
      color: #1E293B;
      vertical-align: middle;
      white-space: nowrap;
    }
    .admin-table tr:hover td {
      background: #F8FAFC;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.2rem 0.6rem;
      font-size: 0.70rem;
      font-weight: 700;
      border-radius: 9999px;
      white-space: nowrap;
    }
    .badge-pending { background-color: #FEF3C7; color: #D97706; }
    .badge-quoted { background-color: #DBEAFE; color: #2563EB; }
    .badge-accepted { background-color: #D1FAE5; color: #059669; }
    .badge-rejected { background-color: #FEE2E2; color: #DC2626; }
    .badge-aboutis { background-color: #EDE9FE; color: #5B21B6; }

    .form-control {
      width: 100%;
      padding: 0.38rem 0.65rem;
      border: 1.5px solid #CBD5E1;
      border-radius: 5px;
      font-size: 0.78rem;
      font-family: 'Poppins', sans-serif;
      color: #1E293B;
      background: #FFFFFF;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
      -webkit-appearance: none;
      appearance: none;
    }
    .form-control:focus {
      outline: none;
      border-color: #7A1C1C;
      box-shadow: 0 0 0 3px rgba(122, 28, 28, 0.1);
    }

    .btn {
      padding: 0.3rem 0.7rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .btn-sm {
      padding: 0.18rem 0.45rem;
      font-size: 0.65rem;
    }
    .btn-primary {
      background-color: #7A1C1C;
      color: white;
    }
    .btn-accent {
      background-color: #DC2626;
      color: white;
    }
    .btn-outline {
      border-color: #CBD5E1;
      background-color: white;
      color: #475569;
    }

    /* Modals styling */
    .custom-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      padding: 1rem;
    }
    .custom-modal-box {
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.25);
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: translateY(-15px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .modal-header {
      padding: 1.15rem 1.35rem;
      border-bottom: 1px solid #E2E8F0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #F8FAFC;
      border-top-left-radius: 12px;
      border-top-right-radius: 12px;
    }
    .modal-body {
      padding: 1.35rem;
      flex: 1;
      overflow-y: auto;
    }
    .modal-footer {
      padding: 1rem 1.35rem;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
      border-bottom-left-radius: 12px;
      border-bottom-right-radius: 12px;
    }
    .btn-close {
      background: transparent;
      border: none;
      font-size: 1.15rem;
      color: #64748B;
      cursor: pointer;
      transition: color 0.2s;
    }
    .btn-close:hover {
      color: #DC2626;
    }
    `
  ]
})
export class GestionnaireComponent implements OnInit {
  activeTab: 'dashboard' | 'requests' | 'agenda' | 'mediatheque' | 'cms' | 'clients' | 'staff' | 'sync' = 'dashboard';
  cmsFilterTab: 'FAQS' | 'TESTIMONIALS' | 'ALL' = 'FAQS';
  requests: any[] = [];
  clients: any[] = [];
  totalRevenue = 0;
  conversionRate = 0;
  syncStatus = "Connecté (Dernière sync : Aujourd'hui à 11h15)";

  currentYear = new Date().getFullYear();
  currentMonthIndex = new Date().getMonth(); // Par défaut : mois en cours
  currentMonth = '';
  selectedChartFilter = 'Toutes';
  chartTabs = ['Toutes', 'La Diva', 'Traiteur', 'Événements', 'Food Truck', 'À Emporter'];


  staffList: any[] = [];
  events: any[] = [];
  faqs: any[] = [];
  mediaList: any[] = [];
  devisList: any[] = [];

  // Modals state
  showCreateEventModal = false;
  showDevisModal = false;
  isDevisModified = false;
  isDevisReadonly = false;
  showEditModal = false;
  showFaqModal = false;
  showMediaModal = false;
  showTraceabilityModal = false;
  showTestimonialModal = false;

  // Search & Filter
  clientSearchQuery = '';
  selectedClientForEvent: any = null;
  selectedStaffIdsForEvent: string[] = [];
  selectedStaffListForEvent: any[] = [];
  staffSearchQuery = '';
  eventForm = {
    title: '',
    type: 'salle-diva',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    guests: 100,
    location: 'Salle La Diva, Dakar',
    signatureGastronomique: 'Menu Signature Kiki Traiteur',
    requestId: ''
  };

  // Editing items
  selectedClient: any = null;
  showDeleteModal = false;
  faqForm = { id: '', question: '', answer: '', category: 'Général' };
  isEditingFaq = false;
  showDeleteFaqModal = false;
  faqToDelete: any = null;
  mediaForm = { title: '', url: '', type: 'image', eventId: '' };
  selectedEventFilterForMedia = 'ALL';
  currentTraceRequest: any = null;
  currentTraceDevis: any = null;
  currentTraceEvent: any = null;
  showRequestDetailsModal = false;
  currentDetailRequest: any = null;

  // Testimonials
  testimonials: any[] = [];
  testimonialForm = { id: '', text: '', clientName: '', clientTitle: '', stars: 5 };
  isEditingTestimonial = false;
  showDeleteTestimonialModal = false;
  testimonialToDelete: any = null;

  // Devis Modal
  isNewDevis = false;
  isDevisSending = false;       // spinner envoi email
  isClientsLoading = false;

  currentDetailDevis: any = null;
  showRejectConfirmModal = false;
  requestToReject: any = null;
  isDevisDownloading = false;   // spinner téléchargement PDF
  currentDevisId: number | null = null; // ID du devis en base (pour sendMail et pdf)
  selectedClientForDevis: any = null;
  devisSearchClientQuery = '';
  devisForm = {
    requestId: '',
    clientEmail: '',
    clientName: '',
    clientId: '',
    prestationId: 'salle-diva',
    signatureGastronomique: 'Menu Signature Kiki Traiteur',
    guests: 50,
    location: 'Salle La Diva, Dakar',
    date: new Date().toISOString().split('T')[0],
    time: '19:00',
    items: [{ desc: 'Prestation Traiteur - Forfait de base', qty: 1, unitPrice: 15000 }],
    tvaRate: 0,
    discount: 0,
    status: 'sent',
    history: [] as Array<{ date: string; action: string }>
  };

  // Calendar filters & view (Image 5)
  calendarView = 'Mois';
  currentCalendarDate: Date = new Date(2026, 6, 28);
  currentCalendarMonth = 'Juillet 2026';
  isEventFromDevis = false;
  showEventDetailsModal = false;
  selectedDetailEvent: any = null;
  calendarPrestationFilter = 'ALL';
  calendarClientFilter = '';
  calendarResourceFilter = 'ALL';
  calendarStaffFilter = '';

  // Requests filters & pagination (Image 4)
  requestClientFilter = '';
  requestPrestationFilter = 'ALL';
  selectedRequestStatusFilter = 'ALL';
  requestPage = 1;
  requestPageSize = 10;
  clientPage = 1;
  clientPageSize = 10;
  staffPage = 1;
  staffPageSize = 10;
  faqPage = 1;
  faqPageSize = 10;
  mediaPage = 1;
  mediaPageSize = 10;
  eventListPage = 1;
  eventListPageSize = 10;

  statusFiltersList = [
    { label: 'Tous', value: 'ALL' },
    { label: 'En attente', value: 'pending' },
    { label: 'Accepté', value: 'accepted' },
    { label: 'Devis envoyé', value: 'sent' },
    { label: 'Aboutis', value: 'aboutis' },
    { label: 'Refusé', value: 'rejected' }
  ];

  constructor(
    private dataService: KikiDataService,
    private router: Router,
    private gestionnaireApiService: GestionnaireApiService
  ) {}

  ngOnInit(): void {
    this.updateCurrentMonthLabel();
    this.loadData();
  }

  loadData(): void {
    this.requests = [];
    this.clients = [];
    this.staffList = this.dataService.getStaff();
    this.events = [];
    this.faqs = [];
    this.mediaList = this.dataService.getMedia();
    this.devisList = [];
    this.testimonials = [];

    this.updateLocalMetrics();

    this.gestionnaireApiService.getAllDemandes().subscribe({
      next: (data) => {
        // L'API retourne un PageResponse {content: [...], totalElements, ...}
        // On extrait le tableau .content, ou on traite directement si c'est un tableau (fallback)
        const items: any[] = Array.isArray(data) ? data : (data && (data as any).content ? (data as any).content : []);
        this.dataService.showToast(`API Gestionnaire: ${items.length} demande(s) chargée(s)`);

        if (items.length > 0) {
          this.requests = items.map((d: any) => ({
            id: String(d.id),
            clientId: String(d.clientId || ''),
            prestationId: d.prestationId,
            date: d.date || '',
            time: d.time || '',
            guests: d.guests || 50,
            isInstitution: !!d.isInstitution,
            organization: d.organization || d.clientOrganization || '',
            status: d.status || 'pending',
            dateSubmitted: d.dateSubmitted ? String(d.dateSubmitted).split('T')[0] : '',
            message: d.message || '',
            clientName: d.clientName || 'Client inconnu',
            clientEmail: d.clientEmail || '',
            clientPhone: d.clientPhone || '',
            clientType: d.clientType || 'particulier',
            cuisine: d.cuisine || 'Non spécifié',
            prestationTitle: d.prestationTitle || d.prestationId,
            location: d.location || d.locationType || ''
          }));

          const clientMap = new Map<string, any>(this.clients.map(c => [String(c.id), c]));
          items.forEach((d: any) => {
            const cid = String(d.clientId || '');
            if (cid && !clientMap.has(cid)) {
              clientMap.set(cid, {
                id: cid,
                name: d.clientName || 'Client inconnu',
                email: d.clientEmail || '',
                phone: d.clientPhone || '',
                type: d.clientType || (d.isInstitution ? 'institution' : 'particular'),
                organization: d.organization || d.clientOrganization || ''
              });
            }
          });
          if (clientMap.size > 0) {
            this.clients = Array.from(clientMap.values());
          }

          // Generate confirmed events from requests for calendar / events view
          this.events = this.requests
            .filter(r => r.status === 'accepted' || r.status === 'approved' || r.status === 'aboutis' || r.status === 'confirmé')
            .map(r => ({
              id: 'ev_' + r.id,
              title: 'Événement - ' + r.prestationTitle,
              type: r.prestationId,
              date: r.date || new Date().toISOString().split('T')[0],
              time: r.time || '12:00',
              guests: r.guests || 50,
              clientId: r.clientId,
              clientName: r.clientName,
              location: r.location || 'Dakar',
              staffIds: [],
              requestId: r.id,
              signatureGastronomique: 'Menu Signature Kiki Traiteur',
              status: 'confirmé',
              createdDate: r.dateSubmitted
            }));

          this.updateLocalMetrics();
        }
      },
      error: (err) => console.warn('API Gestionnaire getAllDemandes non accessible', err)
    });

    this.gestionnaireApiService.getAllClients().subscribe({
      next: (data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          const clientMap = new Map<string, any>(this.clients.map(c => [String(c.id), c]));
          data.forEach(c => {
             const cid = String(c.id);
             if (cid) {
                 clientMap.set(cid, {
                    id: cid,
                    name: c.name || c.nom || 'Client',
                    email: c.email || '',
                    phone: c.phone || c.telephone || '',
                    type: c.clientType || 'particular',
                    organization: c.organization || c.clientOrganization || ''
                 });
             }
          });
          this.clients = Array.from(clientMap.values());
        }
      },
      error: (err) => console.warn('Erreur chargement clients NeonDB', err)
    });

    this.gestionnaireApiService.getAllDevis().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.devisList = data;
        }
      },
      error: (err) => console.warn('Erreur chargement devis NeonDB', err)
    });

    this.gestionnaireApiService.getFaqs().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.faqs = data.map(f => ({
            id: String(f.id),
            question: f.question,
            answer: f.reponse || f.answer,
            category: f.categorie || f.category || 'Général'
          }));
        } else {
          this.faqs = [];
        }
      },
      error: (err) => {
        console.warn('Erreur chargement FAQs depuis NeonDB', err);
        this.faqs = [];
      }
    });

    this.gestionnaireApiService.getTestimonials().subscribe({
      next: (data: any[]) => {
        if (data && Array.isArray(data)) {
          this.testimonials = data.map(t => ({
            id: String(t.id),
            text: t.temoignage || t.content || '',
            clientName: t.nomClient || t.clientName || '',
            clientTitle: t.titreFonction || t.clientRole || '',
            stars: t.note || t.rating || 5,
            createdAt: ''
          }));
        } else {
          this.testimonials = [];
        }
      },
      error: (err: any) => {
        console.warn('Erreur chargement Témoignages depuis NeonDB', err);
        this.testimonials = [];
      }
    });

    this.gestionnaireApiService.getDashboardStats().subscribe({
      next: (stats) => {
        if (stats) {
          this.totalRevenue = Number(stats.totalRevenue) || 0;
          this.conversionRate = Math.round(Number(stats.conversionRate) || 0);
        }
      },
      error: (err) => console.warn('API Gestionnaire stats non accessible', err)
    });
  }

  updateLocalMetrics(): void {
    this.totalRevenue = this.requests
      .filter(r => r.status === 'accepted' || r.status === 'approved')
      .reduce((acc, r) => acc + (this.getUnitPrice(r.prestationId) * (r.guests || 50)), 0);
  }

  updateCurrentMonthLabel(): void {
    const monthsFr = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    this.currentMonth = `${monthsFr[this.currentMonthIndex]} ${this.currentYear}`;
  }

  prevMonth(): void {
    if (this.currentYear === 1997 && this.currentMonthIndex === 0) {
      return;
    }
    if (this.currentMonthIndex === 0) {
      this.currentMonthIndex = 11;
      this.currentYear--;
    } else {
      this.currentMonthIndex--;
    }
    this.updateCurrentMonthLabel();
  }

  nextMonth(): void {
    if (this.currentMonthIndex === 11) {
      this.currentMonthIndex = 0;
      this.currentYear++;
    } else {
      this.currentMonthIndex++;
    }
    this.updateCurrentMonthLabel();
  }

  onMonthInputChange(event: any): void {
    const val = event.target.value;
    if (val) {
      const parts = val.split('-');
      if (parts.length === 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (y >= 1997) {
          this.currentYear = y;
          this.currentMonthIndex = m;
          this.updateCurrentMonthLabel();
        }
      }
    }
  }

  getMonthInputValue(): string {
    const mStr = (this.currentMonthIndex + 1) < 10 ? `0${this.currentMonthIndex + 1}` : `${this.currentMonthIndex + 1}`;
    return `${this.currentYear}-${mStr}`;
  }

  getRequestsForCurrentMonth(): any[] {
    if (!this.requests || !Array.isArray(this.requests)) return [];
    return this.requests.filter(r => {
      const dStr = r.dateSubmitted || r.date || '';
      if (!dStr) {
        return this.currentYear === new Date().getFullYear() && this.currentMonthIndex === new Date().getMonth();
      }
      try {
        const parts = String(dStr).split('T')[0].split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10) - 1;
          return y === this.currentYear && m === this.currentMonthIndex;
        }
      } catch {
        // ignore
      }
      return false;
    });
  }

  getRequestsThisMonthCount(): number {
    return this.getRequestsForCurrentMonth().length;
  }

  getAcceptedCount(): number {
    return this.getRequestsForCurrentMonth().filter(r => r.status === 'accepted' || r.status === 'approved').length;
  }

  getPendingRealisationCount(): number {
    return this.getRequestsForCurrentMonth().filter(r => r.status === 'quoted' || r.status === 'pending' || r.status === 'sent').length;
  }

  getConversionRate(): number {
    const reqs = this.getRequestsForCurrentMonth();
    if (reqs.length === 0) return 0;
    const acc = reqs.filter(r => r.status === 'accepted' || r.status === 'approved').length;
    return Math.round((acc / reqs.length) * 100);
  }

  getClientsCount(): string {
    const reqs = this.getRequestsForCurrentMonth();
    if (reqs.length === 0) return '0';
    const clientIds = new Set(reqs.map(r => r.clientId));
    return String(clientIds.size);
  }

  getClientsBreakdown(): string {
    const reqs = this.getRequestsForCurrentMonth();
    if (reqs.length === 0) return '0 Particulier / 0 Entreprise';
    const part = reqs.filter(r => this.getClientType(r.clientId) === 'Particulier').length;
    const ent = reqs.filter(r => this.getClientType(r.clientId) === 'Entreprise').length;
    return `${part} Particuliers / ${ent} Entreprises`;
  }

  getPendingValidationCount(): number {
    return this.getRequestsForCurrentMonth().filter(r => r.status === 'pending' || !r.status).length;
  }

  getActiveConflictsCount(): number {
    const reqs = this.getRequestsForCurrentMonth();
    if (reqs.length === 0) return 0;
    return reqs.filter(r => r.status === 'pending' && reqs.filter(o => o.id !== r.id && o.date === r.date).length > 0).length > 0 ? 1 : 0;
  }

  getRoomBlockedCount(): number {
    const reqs = this.getRequestsForCurrentMonth();
    return reqs.filter(r => (r.prestationId === 'salle-diva' || r.prestationTitle === 'Salle La Diva') && (r.status === 'accepted' || r.status === 'approved')).length;
  }

  getRecentRequestsFeed(): any[] {
    const reqs = this.getRequestsForCurrentMonth();
    return reqs.slice(0, 5).map(r => ({
      name: r.clientName && r.clientName !== r.clientId ? r.clientName : this.getClientName(r.clientId),
      badge: this.getPrestationName(r.prestationId) || r.prestationId,
      date: r.dateSubmitted ? String(r.dateSubmitted).split('T')[0] : (r.date ? r.date : "Aujourd'hui"),
      dotColor: r.status === 'accepted' ? '#059669' : (r.status === 'rejected' ? '#DC2626' : '#D97706')
    }));
  }

  getChartMaxVal(): number {
    const data = this.getChartData();
    const m = Math.max(...data, 3);
    return m;
  }

  getChartYLabel3(): number {
    return this.getChartMaxVal();
  }

  getChartYLabel2(): number {
    return Math.round(this.getChartMaxVal() * 2 / 3);
  }

  getChartYLabel1(): number {
    return Math.round(this.getChartMaxVal() / 3);
  }

  valToY(val: number): number {
    const max = this.getChartMaxVal();
    if (max <= 0) return 170;
    const ratio = Math.min(1, Math.max(0, val / max));
    return Math.round(170 - (ratio * 150));
  }

  getChartMonthList(): { year: number, monthIndex: number, label: string }[] {
    const monthsFrShort = ['Janv.', 'Févr.', 'Mars.', 'Avr.', 'Mai.', 'Juin.', 'Juil.', 'Août.', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    const list = [];
    for (let i = 5; i >= 0; i--) {
      let y = this.currentYear;
      let m = this.currentMonthIndex - i;
      while (m < 0) {
        m += 12;
        y--;
      }
      list.push({
        year: y,
        monthIndex: m,
        label: monthsFrShort[m]
      });
    }
    return list;
  }

  matchesChartFilter(r: any, tab: string): boolean {
    if (!tab || tab === 'Toutes') return true;
    const pid = String(r.prestationId || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const pTitle = String(r.prestationTitle || this.getPrestationName(r.prestationId) || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const combined = `${pid} ${pTitle}`;

    const loc = String(r.location || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const normTab = tab.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    switch (tab) {
      case 'La Diva':
        return combined.includes('diva') || combined.includes('salle') || loc.includes('diva') || loc.includes('salle');
      case 'Traiteur':
        return combined.includes('traiteur') || combined.includes('restauration') || combined.includes('buffet') || combined.includes('repas');
      case 'Événements':
        return combined.includes('evenement') || combined.includes('event') || combined.includes('organisation');
      case 'Décoration':
        return combined.includes('decor') || combined.includes('design');
      case 'Location':
        return combined.includes('location') || combined.includes('materiel');
      case 'Food Truck':
        return combined.includes('food') || combined.includes('truck') || combined.includes('foodtruck');
      case 'À Emporter':
        return combined.includes('emporter') || combined.includes('takeaway') || combined.includes('livraison');
      default:
        return combined.includes(normTab);
    }
  }

  getChartData(): number[] {
    if (!this.requests || !Array.isArray(this.requests)) {
      return [0, 0, 0, 0, 0, 0];
    }
    const monthList = this.getChartMonthList();
    return monthList.map(item => {
      return this.requests.filter(r => {
        const dStr = r.dateSubmitted || r.date || '';
        let matchMonth = false;
        if (!dStr) {
          matchMonth = item.year === new Date().getFullYear() && item.monthIndex === new Date().getMonth();
        } else {
          try {
            const parts = String(dStr).split('T')[0].split('-');
            if (parts.length >= 2) {
              const y = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10) - 1;
              matchMonth = y === item.year && m === item.monthIndex;
            }
          } catch {
            matchMonth = false;
          }
        }
        if (!matchMonth) return false;
        return this.matchesChartFilter(r, this.selectedChartFilter);
      }).length;
    });
  }

  getChartPath(): string {
    const pts = this.getChartData();
    const coords = [
      { x: 60, y: this.valToY(pts[0]) },
      { x: 150, y: this.valToY(pts[1]) },
      { x: 240, y: this.valToY(pts[2]) },
      { x: 330, y: this.valToY(pts[3]) },
      { x: 420, y: this.valToY(pts[4]) },
      { x: 510, y: this.valToY(pts[5]) }
    ];
    return `M ${coords[0].x},${coords[0].y} L ${coords[1].x},${coords[1].y} L ${coords[2].x},${coords[2].y} L ${coords[3].x},${coords[3].y} L ${coords[4].x},${coords[4].y} L ${coords[5].x},${coords[5].y}`;
  }

  getChartAreaPath(): string {
    return `${this.getChartPath()} L 510,170 L 60,170 Z`;
  }

  getChartPoints(): any[] {
    const pts = this.getChartData();
    const monthList = this.getChartMonthList();
    const xs = [60, 150, 240, 330, 420, 510];
    return xs.map((x, idx) => ({
      x,
      y: this.valToY(pts[idx]),
      label: monthList[idx].label,
      isLast: idx === 5
    }));
  }

  getTitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return 'Tableau de bord';
      case 'requests': return 'Demandes de devis';
      case 'agenda': return 'Calendrier interne';
      case 'mediatheque': return 'Médiathèque';
      case 'cms': return 'CMS & Contenus';
      case 'clients': return 'Clients';
      case 'staff': return 'Personnel';
      case 'sync': return 'GOOGLE SYNC & SEC';
    }
  }

  getSubtitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return "Vue d'ensemble de l'activité de Kiki Traiteur.";
      case 'requests': return 'Traitement commercial et validation des devis.';
      case 'agenda': return 'Organisation interne et planification logistique.';
      case 'mediatheque': return 'Galerie photos, catalogues et documents Kiki Traiteur.';
      case 'cms': return 'Gestion des textes, cartes, plats et contenus en ligne.';
      case 'clients': return 'Profils et historique des clients Kiki Traiteur.';
      case 'staff': return "Equipes culinaires et maîtres d'hôtel.";
      case 'sync': return 'Paramètres de liaison Google Agenda et sécurité.';
    }
  }

  getClientName(clientId: string): string {
    const r = this.requests.find(item => String(item.clientId) === String(clientId) && item.clientName && item.clientName !== 'Client inconnu' && item.clientName !== clientId);
    if (r && r.clientName) {
      return r.clientName;
    }
    const c = this.clients.find(item => String(item.id) === String(clientId));
    return c ? c.name : (clientId ? `Client #${clientId}` : 'Client inconnu');
  }

  getClientOrg(clientId: string): string {
    const r = this.requests.find(item => String(item.clientId) === String(clientId));
    if (r && r.organization) return r.organization;
    const c = this.clients.find(item => String(item.id) === String(clientId));
    return (c && c.organization) ? c.organization : 'Particulier';
  }

  getPrestationName(id: string): string {
    const names: Record<string, string> = {
      'traiteur': 'Service Traiteur Prestige',
      'evenements': "Organisation d'Événements",
      'salle-diva': 'Salle La Diva',
      'decoration': 'Design & Décoration',
      'location': 'Location de Matériel',
      'takeaway': 'Plats à Emporter',
      'foodtruck': 'Food Truck Gourmet'
    };
    return names[id] || id;
  }

  getUnitPrice(id: string): number {
    const prices: Record<string, number> = {
      'traiteur': 15000,
      'evenements': 20000,
      'salle-diva': 25000,
      'decoration': 5000,
      'location': 3000,
      'takeaway': 8000,
      'foodtruck': 12000
    };
    return prices[id] || 15000;
  }

  isPendingStatus(status: string): boolean {
    return !status || status === 'pending' || status === 'new' || status === 'en_attente' ||
           (!this.isSentStatus(status) && !this.isAcceptedStatus(status) && !this.isAboutisStatus(status) && !this.isRejectedStatus(status));
  }

  isAcceptedStatus(status: string): boolean {
    return status === 'accepted' || status === 'approved';
  }

  isSentStatus(status: string): boolean {
    return status === 'sent' || status === 'quoted' || status === 'devis_envoye';
  }

  isAboutisStatus(status: string): boolean {
    return status === 'aboutis' || status === 'conclue' || status === 'event_created';
  }

  isRejectedStatus(status: string): boolean {
    return status === 'rejected' || status === 'refuse';
  }

  getStatusLabel(status: string): string {
    if (this.isSentStatus(status)) return 'Devis envoyé';
    if (this.isAcceptedStatus(status)) return 'Accepté';
    if (this.isAboutisStatus(status)) return 'Aboutis';
    if (this.isRejectedStatus(status)) return 'Refusé';
    return 'En attente';
  }

  getBadgeClass(status: string): string {
    if (this.isSentStatus(status)) return 'badge-quoted';
    if (this.isAcceptedStatus(status)) return 'badge-accepted';
    if (this.isAboutisStatus(status)) return 'badge-aboutis';
    if (this.isRejectedStatus(status)) return 'badge-rejected';
    return 'badge-pending';
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('fr-FR');
    } catch {
      return d;
    }
  }

  getAcceptedRequests(): any[] {
    return this.requests.filter(r => r.status === 'accepted');
  }

  quoteRequest(id: string): void {
    this.dataService.updateRequestStatus(id, 'quoted');
    this.dataService.showToast('Devis émis au client avec succès.');
    this.loadData();
  }

  setStatus(id: string, st: string): void {
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0) {
      this.gestionnaireApiService.updateStatus(numId, st).subscribe({
        next: () => {
          this.dataService.showToast(`Statut actualisé en : ${this.getStatusLabel(st)}`);
          this.loadData(); // On recharge depuis l'API, pas besoin de updateRequestStatus mock
        },
        error: (err) => {
          console.error("Erreur de mise à jour du statut", err);
          this.dataService.showToast(`Erreur API: impossible de mettre à jour le statut.`, true);
        }
      });
    }
  }

  deleteRequest(id: string): void {
    if (confirm('Supprimer cette demande du système ERP ?')) {
      this.dataService.deleteRequest(id);
      this.dataService.showToast('Demande supprimée.');
      this.loadData();
    }
  }

  triggerSync(): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.syncStatus = `Synchronisé à l'instant (${timeStr})`;
    this.dataService.showToast('Google Agenda synchronisé avec les réceptions Kiki Traiteur.');
  }

  logout(): void {
    this.dataService.showToast('Déconnexion du module Gestionnaire ERP.');
    this.router.navigate(['/auth'], { queryParams: { type: 'staff' } });
  }

  // --- CREATE EVENT MODAL & HELPERS ---
  openCreateEventModal(req?: any, fromDevis: boolean = false): void {
    if (req && req.status === 'pending') {
      this.dataService.showToast("Vous devez d'abord envoyer un devis avant de créer un événement !", true);
      return;
    }
    this.isEventFromDevis = fromDevis || (!!req);
    this.selectedClientForEvent = null;
    this.selectedStaffIdsForEvent = [];
    this.selectedStaffListForEvent = [];
    this.clientSearchQuery = '';
    this.staffSearchQuery = '';
    if (req) {
      const client = this.clients.find(c => c.id === req.clientId);
      if (client) {
        this.selectedClientForEvent = client;
      }
      this.eventForm = {
        title: req.prestationTitle ? `${req.prestationTitle} - ${client ? client.name : ''}` : `Événement ${client ? client.name : ''}`,
        type: req.prestationId || 'salle-diva',
        date: req.date || new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: req.guests || 100,
        location: req.location || 'Salle La Diva, Dakar',
        signatureGastronomique: 'Menu Signature Kiki Traiteur',
        requestId: req.id || ''
      };
    } else {
      this.eventForm = {
        title: '',
        type: 'salle-diva',
        date: new Date().toISOString().split('T')[0],
        time: '19:00',
        guests: 100,
        location: 'Salle La Diva, Dakar',
        signatureGastronomique: 'Menu Signature Kiki Traiteur',
        requestId: ''
      };
    }
    this.showCreateEventModal = true;
  }

  closeCreateEventModal(): void {
    this.showCreateEventModal = false;
  }

  getFilteredClients(): any[] {
    if (!this.clientSearchQuery || !this.clientSearchQuery.trim()) {
      return this.clients.slice(0, 5);
    }
    const q = this.clientSearchQuery.toLowerCase();
    return this.clients.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  selectClientForEvent(c: any): void {
    this.selectedClientForEvent = c;
    this.clientSearchQuery = '';
  }

  removeSelectedClient(): void {
    this.selectedClientForEvent = null;
  }

  getFilteredStaffForSearch(): any[] {
    const query = this.staffSearchQuery.toLowerCase().trim();
    return this.staffList.filter(s => {
      const notSelected = !this.selectedStaffIdsForEvent.includes(s.id);
      if (!query) return notSelected;
      return notSelected && (s.name.toLowerCase().includes(query) || s.role.toLowerCase().includes(query));
    });
  }

  addStaffToEvent(s: any): void {
    if (!this.selectedStaffIdsForEvent.includes(s.id)) {
      this.selectedStaffIdsForEvent.push(s.id);
      this.selectedStaffListForEvent.push(s);
    }
    this.staffSearchQuery = '';
  }

  removeStaffFromEvent(staffId: string): void {
    this.selectedStaffIdsForEvent = this.selectedStaffIdsForEvent.filter(id => id !== staffId);
    this.selectedStaffListForEvent = this.selectedStaffListForEvent.filter(st => st.id !== staffId);
  }

  toggleStaffSelection(staffId: string): void {
    const idx = this.selectedStaffIdsForEvent.indexOf(staffId);
    if (idx > -1) {
      this.selectedStaffIdsForEvent.splice(idx, 1);
      this.selectedStaffListForEvent = this.selectedStaffListForEvent.filter(st => st.id !== staffId);
    } else {
      this.selectedStaffIdsForEvent.push(staffId);
      const s = this.staffList.find(st => st.id === staffId);
      if (s) this.selectedStaffListForEvent.push(s);
    }
  }

  isStaffSelected(staffId: string): boolean {
    return this.selectedStaffIdsForEvent.includes(staffId);
  }

  getStaffName(staffId: string): string {
    const s = this.staffList.find(item => item.id === staffId);
    return s ? s.name : staffId;
  }

  getStaffRole(staffId: string): string {
    const s = this.staffList.find(item => item.id === staffId);
    return s ? s.role : 'Staff';
  }

  getEventSignature(ev: any): string {
    if (ev.signatureGastronomique) return ev.signatureGastronomique;
    if (ev.requestId) {
      const dev = this.dataService.getDevisByRequest(ev.requestId);
      if (dev && dev.signatureGastronomique) return dev.signatureGastronomique;
      const req = this.requests.find(r => r.id === ev.requestId);
      if (req && req.signatureGastronomique) return req.signatureGastronomique;
    }
    return 'Menu Signature Kiki Traiteur';
  }

  // --- INTERNAL CALENDAR AGENDA HELPERS (IMAGE 5) ---
  getMonthNameFr(m: number): string {
    const names = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return names[m] || 'Juillet';
  }

  getCalendarHeaderLabel(): string {
    const y = this.currentCalendarDate.getFullYear();
    const m = this.currentCalendarDate.getMonth();
    const mName = this.getMonthNameFr(m);
    if (this.calendarView === 'Mois' || this.calendarView === 'Événements') {
      return `${mName} ${y}`;
    }
    if (this.calendarView === 'Semaine') {
      const d = new Date(this.currentCalendarDate);
      const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
      const start = new Date(d);
      start.setDate(d.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const sMonth = this.getMonthNameFr(start.getMonth()).toLowerCase();
      const eMonth = this.getMonthNameFr(end.getMonth()).toLowerCase();
      if (start.getMonth() === end.getMonth()) {
        return `${start.getDate()} - ${end.getDate()} ${sMonth} ${end.getFullYear()}`;
      }
      return `${start.getDate()} ${sMonth} - ${end.getDate()} ${eMonth} ${end.getFullYear()}`;
    }
    if (this.calendarView === 'Jour') {
      const day = this.currentCalendarDate.getDate();
      return `${day} ${mName.toLowerCase()} ${y}`;
    }
    return `${mName} ${y}`;
  }

  prevCalendarMonth(): void {
    if (this.calendarView === 'Mois' || this.calendarView === 'Événements') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() - 1, 1);
    } else if (this.calendarView === 'Semaine') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() - 7);
    } else if (this.calendarView === 'Jour') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() - 1);
    }
    this.currentCalendarMonth = this.getCalendarHeaderLabel();
  }

  nextCalendarMonth(): void {
    if (this.calendarView === 'Mois' || this.calendarView === 'Événements') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 1);
    } else if (this.calendarView === 'Semaine') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() + 7);
    } else if (this.calendarView === 'Jour') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() + 1);
    }
    this.currentCalendarMonth = this.getCalendarHeaderLabel();
  }

  getEndTime(time: string): string {
    if (!time) return '23:00';
    const parts = time.split(':');
    let h = parseInt(parts[0], 10);
    h = (h + 4) % 24;
    return `${h < 10 ? '0' + h : h}:${parts[1] || '00'}`;
  }

  getEventBlockBg(ev: any): string {
    if (ev.type === 'salle-diva') return '#FEE2E2';
    if (ev.type === 'traiteur') return '#FEF3C7';
    if (ev.type === 'evenements') return '#EDE9FE';
    return '#E0E7FF';
  }

  getEventBlockColor(ev: any): string {
    if (ev.type === 'salle-diva') return '#991B1B';
    if (ev.type === 'traiteur') return '#92400E';
    if (ev.type === 'evenements') return '#5B21B6';
    return '#3730A3';
  }

  openEventDetailsModal(ev: any): void {
    this.selectedDetailEvent = ev;
    this.showEventDetailsModal = true;
  }

  closeEventDetailsModal(): void {
    this.showEventDetailsModal = false;
    this.selectedDetailEvent = null;
  }

  getCalendarGridDays(): any[] {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startDayOfWeek = (firstDay.getDay() + 6) % 7; // Lun = 0 ... Dim = 6

    const days: any[] = [];
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        dayNumber: prevMonthDays - i,
        isCurrentMonth: false,
        events: []
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const mm = (month + 1) < 10 ? '0' + (month + 1) : '' + (month + 1);
      const dd = i < 10 ? '0' + i : '' + i;
      const dayStr = `${year}-${mm}-${dd}`;
      const dayEvs = this.getFilteredEventsForCalendar().filter(e => e.date === dayStr);
      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        events: dayEvs
      });
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextNum = 1;
    while (days.length < totalCells) {
      days.push({
        dayNumber: nextNum++,
        isCurrentMonth: false,
        events: []
      });
    }

    return days;
  }

  getCalendarWeekDays(): any[] {
    const d = new Date(this.currentCalendarDate);
    const dayOfWeek = (d.getDay() + 6) % 7; // Lun = 0
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);

    const days: any[] = [];
    const names = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    for (let i = 0; i < 7; i++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + i);
      const yy = cur.getFullYear();
      const mm = (cur.getMonth() + 1) < 10 ? '0' + (cur.getMonth() + 1) : '' + (cur.getMonth() + 1);
      const dd = cur.getDate() < 10 ? '0' + cur.getDate() : '' + cur.getDate();
      const dayStr = `${yy}-${mm}-${dd}`;
      const dayEvs = this.getFilteredEventsForCalendar().filter(e => e.date === dayStr);
      days.push({
        dayName: names[i],
        dayNumber: cur.getDate(),
        events: dayEvs
      });
    }
    return days;
  }

  getCalendarDayView(): any {
    const cur = this.currentCalendarDate;
    const yy = cur.getFullYear();
    const mm = (cur.getMonth() + 1) < 10 ? '0' + (cur.getMonth() + 1) : '' + (cur.getMonth() + 1);
    const dd = cur.getDate() < 10 ? '0' + cur.getDate() : '' + cur.getDate();
    const dayStr = `${yy}-${mm}-${dd}`;
    const dayEvs = this.getFilteredEventsForCalendar().filter(e => e.date === dayStr);
    return {
      dayNumber: cur.getDate(),
      events: dayEvs
    };
  }

  getEventCardMonth(dateStr: string): string {
    if (!dateStr) return 'JUIL.';
    const parts = dateStr.split('-');
    const m = parseInt(parts[1], 10) - 1;
    const abbrevs = ['JANV.', 'FÉVR.', 'MARS.', 'AVR.', 'MAI.', 'JUIN.', 'JUIL.', 'AOÛT.', 'SEPT.', 'OCT.', 'NOV.', 'DÉC.'];
    return abbrevs[m] || 'JUIL.';
  }

  getEventCardDay(dateStr: string): string {
    if (!dateStr) return '19';
    const parts = dateStr.split('-');
    return '' + parseInt(parts[2], 10);
  }

  getFilteredEventsForCalendar(): any[] {
    let list = [...this.events];
    if (this.calendarPrestationFilter !== 'ALL') {
      list = list.filter(e => e.type === this.calendarPrestationFilter);
    }
    if (this.calendarClientFilter.trim()) {
      const q = this.calendarClientFilter.toLowerCase().trim();
      list = list.filter(e => (e.clientName || '').toLowerCase().includes(q));
    }
    if (this.calendarStaffFilter.trim()) {
      const q = this.calendarStaffFilter.toLowerCase().trim();
      list = list.filter(e => {
        if (!e.staffIds || e.staffIds.length === 0) return false;
        return e.staffIds.some((id: string) => this.getStaffName(id).toLowerCase().includes(q));
      });
    }
    return list;
  }

  // --- REQUESTS FILTERS & PAGINATION HELPERS ---
  selectRequestStatusFilter(status: string): void {
    this.selectedRequestStatusFilter = status;
    this.requestPage = 1;
  }

  getRequestCountByStatus(status: string): number {
    if (status === 'ALL') return this.requests.length;
    if (status === 'pending') return this.requests.filter(r => this.isPendingStatus(r.status)).length;
    if (status === 'accepted') return this.requests.filter(r => this.isAcceptedStatus(r.status)).length;
    if (status === 'sent') return this.requests.filter(r => this.isSentStatus(r.status)).length;
    if (status === 'aboutis') return this.requests.filter(r => this.isAboutisStatus(r.status)).length;
    if (status === 'rejected') return this.requests.filter(r => this.isRejectedStatus(r.status)).length;
    return this.requests.filter(r => r.status === status).length;
  }

  getClientType(clientId: string): string {
    const r = this.requests.find(item => String(item.clientId) === String(clientId));
    if (r) {
      if (r.clientType === 'entreprise' || r.clientType === 'Entreprise' || r.isInstitution || r.organization) {
        return 'Entreprise';
      }
      if (r.clientType === 'particulier' || r.clientType === 'Particulier') {
        return 'Particulier';
      }
    }
    const c = this.clients.find(item => String(item.id) === String(clientId));
    if (!c) return 'Particulier';
    return c.organization ? 'Entreprise' : 'Particulier';
  }

  matchesPrestationId(r: any, targetId: string): boolean {
    if (!targetId || targetId === 'ALL') return true;
    if (r.prestationId === targetId) return true;
    const pid = String(r.prestationId || '').toLowerCase();
    const tid = String(targetId).toLowerCase();
    if (pid.includes(tid) || tid.includes(pid)) return true;
    if (tid === 'traiteur' && (pid.includes('restauration') || pid.includes('buffet') || pid.includes('repas'))) return true;
    if (tid === 'salle-diva' && (pid.includes('salle') || pid.includes('diva') || String(r.location || '').toLowerCase().includes('diva') || String(r.location || '').toLowerCase().includes('salle'))) return true;
    if (tid === 'evenements' && (pid.includes('evenement') || pid.includes('event'))) return true;
    return false;
  }

  getFilteredRequests(): any[] {
    let list = [...this.requests];
    if (this.selectedRequestStatusFilter !== 'ALL') {
      const sf = this.selectedRequestStatusFilter;
      if (sf === 'pending') list = list.filter(r => this.isPendingStatus(r.status));
      else if (sf === 'accepted') list = list.filter(r => this.isAcceptedStatus(r.status));
      else if (sf === 'sent') list = list.filter(r => this.isSentStatus(r.status));
      else if (sf === 'aboutis') list = list.filter(r => this.isAboutisStatus(r.status));
      else if (sf === 'rejected') list = list.filter(r => this.isRejectedStatus(r.status));
      else list = list.filter(r => r.status === sf);
    }
    if (this.requestPrestationFilter !== 'ALL') {
      list = list.filter(r => this.matchesPrestationId(r, this.requestPrestationFilter));
    }
    if (this.requestClientFilter.trim()) {
      const q = this.requestClientFilter.toLowerCase().trim();
      list = list.filter(r => this.getClientName(r.clientId).toLowerCase().includes(q));
    }
    return list;
  }

  getFilteredRequestsForPage(): any[] {
    const filtered = this.getFilteredRequests();
    const start = (this.requestPage - 1) * this.requestPageSize;
    return filtered.slice(start, start + this.requestPageSize);
  }

  getRequestTotalPages(): number {
    return Math.ceil(this.getFilteredRequests().length / this.requestPageSize) || 1;
  }

  getRequestPageArray(): (number | string)[] {
    return this.getPaginationArray(this.requestPage, this.getRequestTotalPages());
  }

  // --- Pagination Clients ---
  getClientsForPage(): any[] {
    const start = (this.clientPage - 1) * this.clientPageSize;
    return this.clients.slice(start, start + this.clientPageSize);
  }
  getClientTotalPages(): number {
    return Math.max(1, Math.ceil(this.clients.length / this.clientPageSize));
  }
  getClientPageArray(): (number | string)[] {
    return this.getPaginationArray(this.clientPage, this.getClientTotalPages());
  }

  // --- Pagination Staff ---
  getStaffForPage(): any[] {
    const start = (this.staffPage - 1) * this.staffPageSize;
    return this.staffList.slice(start, start + this.staffPageSize);
  }
  getStaffTotalPages(): number {
    return Math.max(1, Math.ceil(this.staffList.length / this.staffPageSize));
  }
  getStaffPageArray(): (number | string)[] {
    return this.getPaginationArray(this.staffPage, this.getStaffTotalPages());
  }

  // --- Pagination FAQ ---
  getFaqsForPage(): any[] {
    const start = (this.faqPage - 1) * this.faqPageSize;
    return this.faqs.slice(start, start + this.faqPageSize);
  }
  getFaqTotalPages(): number {
    return Math.max(1, Math.ceil(this.faqs.length / this.faqPageSize));
  }
  getFaqPageArray(): (number | string)[] {
    return this.getPaginationArray(this.faqPage, this.getFaqTotalPages());
  }

  // --- Pagination Medias ---
  getMediasForPage(): any[] {
    const start = (this.mediaPage - 1) * this.mediaPageSize;
    return this.mediaList.slice(start, start + this.mediaPageSize);
  }
  getMediaTotalPages(): number {
    return Math.max(1, Math.ceil(this.mediaList.length / this.mediaPageSize));
  }
  getMediaPageArray(): (number | string)[] {
    return this.getPaginationArray(this.mediaPage, this.getMediaTotalPages());
  }

  // --- Pagination Événements Liste ---
  getEventsForPage(): any[] {
    const list = this.getFilteredEventsForCalendar();
    const start = (this.eventListPage - 1) * this.eventListPageSize;
    return list.slice(start, start + this.eventListPageSize);
  }
  getEventTotalPages(): number {
    return Math.max(1, Math.ceil(this.getFilteredEventsForCalendar().length / this.eventListPageSize));
  }
  getEventPageArray(): (number | string)[] {
    return this.getPaginationArray(this.eventListPage, this.getEventTotalPages());
  }

  openEditRequestModal(req: any): void {
    this.dataService.showToast(`Édition rapide de la demande #${req.id} (Fonctionnalité active)`);
  }

  acceptRequest(req: any): void {
    this.setStatus(req.id, 'accepted');
    this.dataService.showToast(`Demande #${req.id} validée ! Ouverture de la création de devis...`);
    this.openDevisModal(req);
  }

  submitCreateEvent(): void {
    if (!this.selectedClientForEvent) {
      this.dataService.showToast('Veuillez rechercher et sélectionner un client.', true);
      return;
    }
    if (!this.eventForm.title.trim()) {
      this.dataService.showToast("Veuillez saisir un nom d'événement.", true);
      return;
    }

    const newEv = this.dataService.addEvent({
      title: this.eventForm.title,
      type: this.eventForm.type,
      date: this.eventForm.date,
      time: this.eventForm.time,
      guests: this.eventForm.guests,
      clientId: this.selectedClientForEvent.id,
      clientName: this.selectedClientForEvent.name,
      clientPhone: this.selectedClientForEvent.phone,
      location: this.eventForm.location,
      staffIds: this.selectedStaffIdsForEvent,
      signatureGastronomique: this.eventForm.signatureGastronomique || 'Menu Signature Kiki Traiteur',
      requestId: this.eventForm.requestId
    });

    if (this.eventForm.requestId) {
      this.dataService.updateRequestStatus(this.eventForm.requestId, 'aboutis');
      // Record history in devis if exists
      const d = this.dataService.getDevisByRequest(this.eventForm.requestId);
      if (d) {
        this.dataService.updateDevis(d.id, { status: 'conclue' }, `Événement confirmé et ajouté à l'agenda (#${newEv.id})`);
      }
    }

    this.dataService.showToast('Événement créé avec succès et enrégistré dans le calendrier !');
    this.showCreateEventModal = false;
    this.loadData();
    this.activeTab = 'agenda';
  }

  // --- DEVIS WORKFLOW (SEND MAIL, EDIT, CREATE EVENT) ---
  openCreateDevisModal(): void {
    this.isNewDevis = true;
    this.selectedClientForDevis = null;
    this.devisSearchClientQuery = '';
    this.devisForm = {
      requestId: '',
      clientEmail: '',
      clientName: '',
      clientId: '',
      prestationId: 'salle-diva',
      signatureGastronomique: 'Menu Signature Kiki Traiteur',
      guests: 50,
      location: 'Salle La Diva, Dakar',
      date: new Date().toISOString().split('T')[0],
      time: '19:00',
      items: [{ desc: 'Prestation Traiteur - Forfait de base', qty: 1, unitPrice: 15000 }],
      tvaRate: 0,
      discount: 0,
      status: 'sent',
      history: [
        { date: new Date().toISOString().split('T')[0], action: "Création d'un nouveau devis" }
      ]
    };
    this.showDevisModal = true;
  }

  getFilteredClientsForDevis(): any[] {
    const query = this.devisSearchClientQuery.toLowerCase().trim();
    if (!query) return this.clients.slice(0, 5);
    return this.clients.filter(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query));
  }

  selectClientForDevis(c: any): void {
    this.selectedClientForDevis = c;
    this.devisSearchClientQuery = '';
    this.devisForm.clientId = c.id;
    this.devisForm.clientName = c.name;
    this.devisForm.clientEmail = c.email;
  }

  openDevisModal(req: any, isReadonly = false): void {
    this.isNewDevis = false;
    this.isDevisModified = false;
    this.isDevisReadonly = isReadonly;
    this.currentDevisId = null;

    const client = this.clients.find(c => String(c.id) === String(req.clientId));
    const cEmail = req.clientEmail || (client ? client.email : 'client@gmail.com');
    const cName = req.clientName || (client ? client.name : 'Client');
    const cId = client ? client.id : req.clientId || '';

    // D'abord, essayer de charger le devis depuis l'API
    const numId = Number(req.id);
    if (!isNaN(numId) && numId > 0) {
      this.gestionnaireApiService.getDevisByDemandeId(numId).subscribe({
        next: (apiDevis) => {
          if (apiDevis && apiDevis.id) {
            this.currentDevisId = apiDevis.id;
            this.devisForm = {
              requestId: String(apiDevis.demandeId || req.id),
              clientEmail: apiDevis.clientEmail || cEmail,
              clientName: apiDevis.clientName || cName,
              clientId: cId,
              prestationId: apiDevis.prestationId || req.prestationId || 'salle-diva',
              signatureGastronomique: apiDevis.signatureGastronomique || 'Menu Signature Kiki Traiteur',
              guests: apiDevis.guests || req.guests || 50,
              location: apiDevis.location || req.location || 'Salle La Diva, Dakar',
              date: apiDevis.date || req.date || new Date().toISOString().split('T')[0],
              time: apiDevis.time || req.time || '19:00',
              items: apiDevis.items && apiDevis.items.length ? [...apiDevis.items] : [{ desc: 'Prestation Traiteur', qty: 1, unitPrice: 15000 }],
              tvaRate: apiDevis.tvaRate || 0,
              discount: apiDevis.discount || 0,
              status: apiDevis.status || req.status,
              history: []
            };
          } else {
            // Pas de devis en base → formulaire vierge avec données de la demande
            this._initDevisFormFromRequest(req, cEmail, cName, cId);
          }
          this.showDevisModal = true;
        },
        error: () => {
          // Fallback local si l'API n'est pas dispo
          const d = this.dataService.getDevisByRequest(req.id);
          this._initDevisFormFromLocal(d, req, cEmail, cName, cId);
          this.showDevisModal = true;
        }
      });
      return;
    }

    const d = this.dataService.getDevisByRequest(req.id);
    this._initDevisFormFromLocal(d, req, cEmail, cName, cId);
    this.showDevisModal = true;
  }

  private _initDevisFormFromRequest(req: any, cEmail: string, cName: string, cId: any): void {
    this.devisForm = {
      requestId: req.id,
      clientEmail: cEmail,
      clientName: cName,
      clientId: cId,
      prestationId: req.prestationId || 'salle-diva',
      signatureGastronomique: req.signatureGastronomique || 'Menu Signature Kiki Traiteur',
      guests: req.guests || 50,
      location: req.location || 'Salle La Diva, Dakar',
      date: req.date || new Date().toISOString().split('T')[0],
      time: req.time || '19:00',
      items: [
        { desc: `Service ${this.getPrestationName(req.prestationId)}`, qty: 1, unitPrice: this.getUnitPrice(req.prestationId) },
        { desc: `Forfait Menu Gastronomique (${req.guests} convives)`, qty: 1, unitPrice: (req.guests || 50) * 6500 }
      ],
      tvaRate: 0,
      discount: 0,
      status: req.status || 'sent',
      history: [{ date: new Date().toISOString().split('T')[0], action: 'Devis initial créé par le gestionnaire' }]
    };
  }

  private _initDevisFormFromLocal(d: any, req: any, cEmail: string, cName: string, cId: any): void {
    if (d) {
      this.devisForm = {
        requestId: d.requestId,
        clientEmail: cEmail,
        clientName: cName,
        clientId: cId,
        prestationId: req.prestationId || 'salle-diva',
        signatureGastronomique: (d as any).signatureGastronomique || req.signatureGastronomique || 'Menu Signature Kiki Traiteur',
        guests: req.guests || 50,
        location: req.location || 'Salle La Diva, Dakar',
        date: req.date || new Date().toISOString().split('T')[0],
        time: (d as any).time || req.time || '19:00',
        items: d.items && d.items.length ? [...d.items] : [{ desc: 'Prestation Traiteur - Forfait de base', qty: 1, unitPrice: 15000 }],
        tvaRate: 0,
        discount: d.discount,
        status: d.status || req.status,
        history: d.history || []
      };
    } else {
      this.devisForm = {
        requestId: req.id,
        clientEmail: cEmail,
        clientName: cName,
        clientId: cId,
        prestationId: req.prestationId || 'salle-diva',
        signatureGastronomique: req.signatureGastronomique || 'Menu Signature Kiki Traiteur',
        guests: req.guests || 50,
        location: req.location || 'Salle La Diva, Dakar',
        date: req.date || new Date().toISOString().split('T')[0],
        time: req.time || '19:00',
        items: [
          { desc: `Service ${this.getPrestationName(req.prestationId)}`, qty: 1, unitPrice: this.getUnitPrice(req.prestationId) },
          { desc: `Forfait Menu Gastronomique (${req.guests} convives)`, qty: 1, unitPrice: (req.guests || 50) * 6500 }
        ],
        tvaRate: 0,
        discount: 0,
        status: req.status || 'sent',
        history: [
          { date: new Date().toISOString().split('T')[0], action: 'Devis initial créé par le gestionnaire' }
        ]
      };
    }
    this.showDevisModal = true;
  }

  onDevisFormChange(): void {
    this.isDevisModified = true;
  }

  closeDevisModal(): void {
    this.showDevisModal = false;
  }

  addDevisItem(): void {
    this.devisForm.items.push({ desc: 'Nouvelle prestation', qty: 1, unitPrice: 5000 });
    this.onDevisFormChange();
  }

  removeDevisItem(index: number): void {
    if (this.devisForm.items.length > 1) {
      this.devisForm.items.splice(index, 1);
      this.onDevisFormChange();
    }
  }

  getDevisSubtotal(): number {
    return this.devisForm.items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  }

  getDevisTotal(): number {
    const sub = this.getDevisSubtotal();
    const afterDisc = sub - (sub * ((this.devisForm.discount || 0) / 100));
    return afterDisc;
  }

  canShowCreateEventButton(devisForm: any): boolean {
    if (!devisForm) return false;
    const s = String(devisForm.status || '').toLowerCase();
    // Tant que le devis est au statut "accepted" ou "accepté" ou "pending" (non encore envoyé au client), on NE DOIT PAS afficher le bouton Créer un événement
    if (s === 'accepted' || s === 'accepté' || s === 'pending' || s === 'en attente') {
      return false;
    }
    // Seulement après envoi du devis par mail ('sent', 'envoyé', 'quoted', 'aboutis', 'conclue')
    return s === 'sent' || s === 'envoyé' || s === 'quoted' || s === 'aboutis' || s === 'conclue' || s === 'émis';
  }

  sendDevisByEmail(): void {
    let reqId = this.devisForm.requestId;
    this.isDevisSending = true;

    if (this.isNewDevis || !reqId) {
      if (!this.selectedClientForDevis) {
        this.dataService.showToast('Veuillez sélectionner un client pour ce devis.', true);
        this.isDevisSending = false;
        return;
      }
      
      const newDemande = {
        clientName: this.selectedClientForDevis.name,
        clientEmail: this.selectedClientForDevis.email,
        clientPhone: this.selectedClientForDevis.phone || '+221 77 000 00 00',
        prestationId: this.devisForm.prestationId || 'salle-diva',
        guests: this.devisForm.guests || 50,
        location: this.devisForm.location || 'Salle La Diva, Dakar',
        date: this.devisForm.date || new Date().toISOString().split('T')[0],
        time: (this.devisForm as any).time || '19:00',
        message: 'Demande créée automatiquement pour devis direct'
      };

      // 1. Créer la demande via l'API
      this.gestionnaireApiService.createDemande(newDemande).subscribe({
        next: (createdDemande) => {
          this.devisForm.requestId = createdDemande.id;
          this.proceedWithDevisCreationAndSend(createdDemande.id);
        },
        error: (err) => {
          this.isDevisSending = false;
          console.error("Erreur lors de la création de la demande :", err);
          this.dataService.showToast("Erreur lors de la création de la demande côté serveur.", true);
        }
      });
    } else {
      // Demande existante
      this.proceedWithDevisCreationAndSend(reqId);
    }
  }

  private proceedWithDevisCreationAndSend(reqId: string | number): void {
    const devisPayload = {
      demandeId: Number(reqId) || 0,
      devisRef: this.currentDevisId ? undefined : `#DEV-${reqId}-${Date.now()}`,
      clientName: this.devisForm.clientName,
      clientEmail: this.devisForm.clientEmail,
      prestationId: this.devisForm.prestationId,
      signatureGastronomique: (this.devisForm as any).signatureGastronomique || 'Menu Signature Kiki Traiteur',
      tvaRate: 0,
      discount: this.devisForm.discount || 0,
      guests: this.devisForm.guests,
      location: this.devisForm.location,
      date: this.devisForm.date,
      time: (this.devisForm as any).time,
      status: 'sent',
      items: this.devisForm.items || []
    };

    // Étape 2 : Créer/mettre à jour le devis en base
    this.gestionnaireApiService.createOrUpdateDevis(devisPayload).subscribe({
      next: (savedDevis) => {
        this.currentDevisId = savedDevis?.id || this.currentDevisId;
        
        if (this.currentDevisId) {
          // Étape 3 : Appeler l'API d'envoi d'email avec le PDF
          this.gestionnaireApiService.sendDevisEmail(this.currentDevisId).subscribe({
            next: () => {
              this.isDevisSending = false;
              this.dataService.showToast(`✅ Devis envoyé par email à ${this.devisForm.clientEmail} !`);
              this.setStatus(String(reqId), 'sent');
              this.showDevisModal = false;
              // Recharger les données API
              this.loadData();
            },
            error: (err) => {
              this.isDevisSending = false;
              console.error('Erreur API envoi email', err);
              this.dataService.showToast(`Devis enregistré, mais erreur lors de l'envoi de l'email.`, true);
              this.showDevisModal = false;
              this.loadData();
            }
          });
        } else {
          this.isDevisSending = false;
          this.dataService.showToast(`✅ Devis enregistré !`);
          this.setStatus(String(reqId), 'sent');
          this.showDevisModal = false;
          // Recharger les données API
          this.loadData();
        }
      },
      error: (e) => {
        this.isDevisSending = false;
        console.error('Erreur API création devis', e);
        this.dataService.showToast(`Erreur lors de l'enregistrement du devis.`, true);
      }
    });
  }

  createDevisDirectly(): void {
    let reqId = this.devisForm.requestId;
    if (this.isNewDevis || !reqId) {
      if (!this.selectedClientForDevis && !this.devisForm.clientId) {
        this.dataService.showToast('Veuillez sélectionner un client pour ce devis.', true);
        return;
      }
      const clientId = this.selectedClientForDevis ? this.selectedClientForDevis.id : this.devisForm.clientId;
      const newReq = this.dataService.addRequest({
        clientId: clientId,
        prestationId: this.devisForm.prestationId || 'salle-diva',
        signatureGastronomique: (this.devisForm as any).signatureGastronomique || 'Menu Signature Kiki Traiteur',
        guests: this.devisForm.guests || 50,
        location: this.devisForm.location || 'Salle La Diva, Dakar',
        date: this.devisForm.date || new Date().toISOString().split('T')[0],
        time: (this.devisForm as any).time || '19:00',
        message: 'Devis avec ' + ((this.devisForm as any).signatureGastronomique || 'Menu Signature Kiki Traiteur'),
        status: 'sent'
      });
      reqId = newReq.id;
      this.devisForm.requestId = reqId;
    }

    const existing = this.dataService.getDevisByRequest(reqId);
    const actionMsg = `Devis créé (${(this.devisForm as any).signatureGastronomique || 'Menu Signature Kiki Traiteur'})`;
    if (existing) {
      this.dataService.updateDevis(existing.id, {
        items: this.devisForm.items,
        tvaRate: 0,
        discount: this.devisForm.discount,
        signatureGastronomique: (this.devisForm as any).signatureGastronomique || 'Menu Signature Kiki Traiteur',
        status: 'sent'
      }, actionMsg);
    } else {
      this.dataService.addDevis({
        requestId: reqId,
        items: this.devisForm.items,
        tvaRate: 0,
        discount: this.devisForm.discount,
        signatureGastronomique: (this.devisForm as any).signatureGastronomique || 'Menu Signature Kiki Traiteur',
        status: 'sent'
      });
    }
    if (reqId) {
      this.dataService.updateRequestStatus(reqId, 'sent');
    }
    this.dataService.showToast('Devis créé et enregistré avec succès.');
    this.showDevisModal = false;
    this.loadData();
  }

  concludeDevisAndCreateEvent(): void {
    let reqId = this.devisForm.requestId;
    if (this.isNewDevis || !reqId) {
      if (!this.selectedClientForDevis) {
        this.dataService.showToast('Veuillez sélectionner un client pour ce devis.', true);
        return;
      }
      const newReq = this.dataService.addRequest({
        clientId: this.selectedClientForDevis.id,
        prestationId: this.devisForm.prestationId || 'salle-diva',
        guests: this.devisForm.guests || 50,
        location: this.devisForm.location || 'Salle La Diva, Dakar',
        date: this.devisForm.date || new Date().toISOString().split('T')[0],
        time: (this.devisForm as any).time || '19:00',
        status: 'aboutis'
      });
      reqId = newReq.id;
      this.devisForm.requestId = reqId;
      this.dataService.addDevis({
        requestId: reqId,
        items: this.devisForm.items,
        tvaRate: 0,
        discount: this.devisForm.discount,
        status: 'conclue'
      });
    } else {
      const existing = this.dataService.getDevisByRequest(reqId);
      if (existing) {
        this.dataService.updateDevis(existing.id, { status: 'conclue' }, 'Devis accepté par le client et conclu');
      }
      this.dataService.updateRequestStatus(reqId, 'aboutis');
    }
    this.showDevisModal = false;
    this.loadData();
    const req = this.requests.find(r => r.id === reqId);
    if (req) {
      this.openCreateEventModal(req, true);
    }
  }

  acceptDevisAndCreateEvent(req: any): void {
    const numId = Number(req.id);
    // Appel API pour mettre à jour le statut en "aboutis"
    if (!isNaN(numId) && numId > 0) {
      this.gestionnaireApiService.updateStatus(numId, 'aboutis').subscribe({
        next: () => {
          this.dataService.updateRequestStatus(req.id, 'aboutis');
          this.dataService.showToast("✅ Devis accepté ! Statut mis à jour en 'Aboutis'. Créez maintenant l'événement dans l'agenda.");
          this.loadData();
          this.openCreateEventModal(req);
        },
        error: () => {
          // Fallback local
          this.dataService.updateRequestStatus(req.id, 'aboutis');
          this.dataService.showToast("Devis accepté (mode local). Créez l'événement dans l'agenda.");
          this.loadData();
          this.openCreateEventModal(req);
        }
      });
    } else {
      this.dataService.updateRequestStatus(req.id, 'aboutis');
      this.dataService.showToast("Devis accepté ! Ouverture de la création d'événement...");
      this.loadData();
      this.openCreateEventModal(req);
    }
  }

  /**
   * Télécharge le PDF du devis pour une demande donnée
   * Ouvre le PDF dans un nouvel onglet
   */
  downloadDevisPdfForRequest(req: any): void {
    if (this.currentDevisId) {
      this._downloadPdf(this.currentDevisId);
      return;
    }
    const numId = Number(req.id);
    if (!isNaN(numId) && numId > 0) {
      this.isDevisDownloading = true;
      this.gestionnaireApiService.getDevisByDemandeId(numId).subscribe({
        next: (devis) => {
          if (devis && devis.id) {
            this._downloadPdf(devis.id);
          } else {
            this.isDevisDownloading = false;
            this.dataService.showToast('Aucun devis trouvé pour cette demande.', true);
          }
        },
        error: () => {
          this.isDevisDownloading = false;
          this.dataService.showToast('Impossible de récupérer le devis depuis le serveur.', true);
        }
      });
    } else {
      this.dataService.showToast('ID de demande invalide.', true);
    }
  }

  _downloadPdf(devisId: number): void {
    this.isDevisDownloading = true;
    this.gestionnaireApiService.downloadDevisPdf(devisId).subscribe({
      next: (blob) => {
        this.isDevisDownloading = false;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Devis_KikiTraiteur_${devisId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.dataService.showToast('📥 PDF du devis téléchargé avec succès !');
      },
      error: () => {
        this.isDevisDownloading = false;
        this.dataService.showToast('Erreur lors du téléchargement du PDF.', true);
      }
    });
  }

  rejectDevisFromModal(): void {
    const reqId = this.devisForm.requestId;
    if (reqId) {
      const req = this.requests.find(r => r.id === reqId);
      this.showDevisModal = false;
      if (req) {
        this.rejectRequest(req);
      }
    }
  }

  rejectRequest(req: any): void {
    this.requestToReject = req;
    this.showRejectConfirmModal = true;
  }

  closeRejectModal(): void {
    this.showRejectConfirmModal = false;
    this.requestToReject = null;
  }

  confirmRejectRequest(): void {
    if (this.requestToReject) {
      const reqId = this.requestToReject.id;
      this.setStatus(reqId, 'rejected');
      this.dataService.showToast(`Demande #${reqId} refusée avec succès.`);
      this.closeRejectModal();
    }
  }

  openRequestDetailsModal(req: any): void {
    this.currentDetailRequest = req;
    this.showRequestDetailsModal = true;
    this.currentDetailDevis = null;

    // Charger les infos du devis associé s'il y en a un
    const numId = Number(req.id);
    if (!isNaN(numId) && numId > 0) {
      this.gestionnaireApiService.getDevisByDemandeId(numId).subscribe({
        next: (devis) => {
          if (devis && devis.id) {
            this.currentDetailDevis = devis;
          }
        },
        error: (e) => {
          // Normal si pas de devis
        }
      });
    }
  }

  getDetailDevisTotal(): number {
    if (!this.currentDetailDevis || !this.currentDetailDevis.items) return 0;
    const sub = this.currentDetailDevis.items.reduce((acc: any, item: any) => acc + (item.unitPrice || 0), 0);
    return sub - (sub * ((this.currentDetailDevis.discount || 0) / 100));
  }

  closeRequestDetailsModal(): void {
    this.showRequestDetailsModal = false;
    this.currentDetailRequest = null;
  }

  acceptRequestFromDetails(): void {
    if (this.currentDetailRequest) {
      this.acceptRequest(this.currentDetailRequest);
      this.closeRequestDetailsModal();
    }
  }

  rejectRequestFromDetails(): void {
    if (this.currentDetailRequest) {
      this.rejectRequest(this.currentDetailRequest);
      this.closeRequestDetailsModal();
    }
  }

  getClientEmail(clientId: string): string {
    const c = this.clients.find(item => item.id === clientId);
    return c ? c.email : 'client@gmail.com';
  }

  getClientPhone(clientId: string): string {
    const c = this.clients.find(item => item.id === clientId);
    return c ? c.phone : '+221 77 000 00 00';
  }

  getClientInitials(clientId: string): string {
    const name = this.getClientName(clientId) || 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // --- TRACEABILITY POPUP ---
  openTraceabilityModal(req: any): void {
    this.currentTraceRequest = req;
    this.currentTraceDevis = this.dataService.getDevisByRequest(req.id);
    this.currentTraceEvent = this.events.find(e => e.requestId === req.id);
    this.showTraceabilityModal = true;
  }

  closeTraceabilityModal(): void {
    this.showTraceabilityModal = false;
    this.currentTraceRequest = null;
    this.currentTraceDevis = null;
    this.currentTraceEvent = null;
  }

  // --- CLIENT EDITING & DELETION ---
  openAddClientModal(): void {
    this.selectedClient = { id: '', name: '', organization: '', email: '', phone: '' };
    this.showEditModal = true;
  }

  openEditModal(client: any): void {
    console.log("openEditModal called with:", client);
    this.selectedClient = { ...client };
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedClient = null;
  }

  openDeleteModal(client: any): void {
    console.log("openDeleteModal called with:", client);
    this.selectedClient = client;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedClient = null;
  }

  confirmDeleteClient(): void {
    if (this.selectedClient) {
      this.gestionnaireApiService.deleteClient(this.selectedClient.id).subscribe({
        next: () => {
          this.dataService.showToast('Client supprimé avec succès.');
          this.loadData();
          this.closeDeleteModal();
        },
        error: (err) => {
          console.error('Erreur deleteClient', err);
          this.dataService.showToast('Erreur lors de la suppression du client.', true);
          this.closeDeleteModal();
        }
      });
    }
  }

  saveClientChanges(): void {
    if (!this.selectedClient || !this.selectedClient.name.trim()) {
      this.dataService.showToast('Le nom du client est requis.', true);
      return;
    }
    const payload = {
      name: this.selectedClient.name,
      email: this.selectedClient.email,
      phone: this.selectedClient.phone,
      organization: this.selectedClient.organization
    };
    
    if (this.selectedClient.id) {
      this.gestionnaireApiService.updateClient(this.selectedClient.id, payload).subscribe({
        next: () => {
          this.dataService.showToast('Fiche client mise à jour.');
          this.showEditModal = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur updateClient', err);
          this.dataService.showToast('Erreur lors de la modification du client.', true);
        }
      });
    } else {
      this.gestionnaireApiService.createClient(payload).subscribe({
        next: () => {
          this.dataService.showToast('Nouveau client ajouté avec succès.');
          this.showEditModal = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur createClient', err);
          this.dataService.showToast('Erreur lors de la création du client.', true);
        }
      });
    }
  }

  // --- CMS FAQ CRUD ---
  openAddFaqModal(): void {
    this.faqForm = { id: '', question: '', answer: '', category: 'Général' };
    this.isEditingFaq = false;
    this.showFaqModal = true;
  }

  openEditFaqModal(faq: any): void {
    this.faqForm = { ...faq };
    this.isEditingFaq = true;
    this.showFaqModal = true;
  }

  closeFaqModal(): void {
    this.showFaqModal = false;
  }

  saveFaq(): void {
    if (!this.faqForm.question.trim() || !this.faqForm.answer.trim()) {
      this.dataService.showToast('Veuillez remplir la question et la réponse.', true);
      return;
    }
    const payload = {
      question: this.faqForm.question,
      answer: this.faqForm.answer,
      category: this.faqForm.category || 'Général'
    };
    if (this.isEditingFaq && this.faqForm.id) {
      const idx = this.faqs.findIndex(f => f.id === this.faqForm.id);
      if (idx !== -1) this.faqs[idx] = { ...this.faqs[idx], ...payload };
      this.gestionnaireApiService.updateFaq(this.faqForm.id, payload).subscribe({
        next: () => {
          this.dataService.showToast('FAQ modifiée avec succès dans NeonDB.');
          this.showFaqModal = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur updateFaq', err);
          this.dataService.showToast('Erreur de modification de la FAQ dans NeonDB.', true);
        }
      });
    } else {
      const newFaq = { id: Date.now().toString(), ...payload };
      this.faqs.unshift(newFaq);
      this.faqPage = 1;
      this.gestionnaireApiService.createFaq(payload).subscribe({
        next: () => {
          this.dataService.showToast('Nouvelle FAQ enrégistrée avec succès dans NeonDB.');
          this.showFaqModal = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur createFaq', err);
          this.dataService.showToast("Erreur d'enregistrement de la FAQ dans NeonDB.", true);
        }
      });
    }
    this.showFaqModal = false;
  }

  getBadgeStyle(category: string): any {
    const cat = (category || 'Général').toLowerCase().trim();
    if (cat.includes('réservation') || cat.includes('reservation')) return { 'background-color': '#EF4444', 'color': 'white' };
    if (cat.includes('salle') || cat.includes('diva')) return { 'background-color': '#10B981', 'color': 'white' };
    if (cat.includes('traiteur') || cat.includes('buffet')) return { 'background-color': '#EAB308', 'color': 'white' };
    if (cat.includes('paiement') || cat.includes('prix')) return { 'background-color': '#3B82F6', 'color': 'white' };
    return { 'background-color': '#8B5CF6', 'color': 'white' };
  }

  openDeleteFaqModal(faq: any): void {
    this.faqToDelete = faq;
    this.showDeleteFaqModal = true;
  }

  closeDeleteFaqModal(): void {
    this.showDeleteFaqModal = false;
    this.faqToDelete = null;
  }

  confirmDeleteFaq(): void {
    if (this.faqToDelete) {
      this.gestionnaireApiService.deleteFaq(this.faqToDelete.id).subscribe({
        next: () => {
          this.dataService.showToast('FAQ supprimée de NeonDB.');
          this.loadData();
          this.closeDeleteFaqModal();
        },
        error: (err) => {
          console.error('Erreur deleteFaq', err);
          this.dataService.showToast('Erreur lors de la suppression dans NeonDB.', true);
          this.closeDeleteFaqModal();
        }
      });
    }
  }

  // --- TESTIMONIALS CRUD ---
  openAddTestimonialModal(): void {
    this.testimonialForm = { id: '', text: '', clientName: '', clientTitle: '', stars: 5 };
    this.isEditingTestimonial = false;
    this.showTestimonialModal = true;
  }

  openEditTestimonialModal(t: any): void {
    this.testimonialForm = { id: t.id, text: t.text, clientName: t.clientName, clientTitle: t.clientTitle, stars: t.stars };
    this.isEditingTestimonial = true;
    this.showTestimonialModal = true;
  }

  closeTestimonialModal(): void {
    this.showTestimonialModal = false;
  }

  onSelectClientForTestimonial(event: any): void {
    const selectedName = event.target.value;
    const client = this.clients.find(c => c.name === selectedName);
    if (client && !this.testimonialForm.clientTitle) {
      this.testimonialForm.clientTitle = client.organization || 'Client Kiki Traiteur';
    }
  }

  saveTestimonial(): void {
    if (!this.testimonialForm.text.trim() || !this.testimonialForm.clientName.trim()) {
      this.dataService.showToast('Le témoignage et le nom du client sont requis.', true);
      return;
    }
    const payload = {
      content: this.testimonialForm.text,
      clientName: this.testimonialForm.clientName,
      role: this.testimonialForm.clientTitle || 'Client Kiki Traiteur',
      rating: Number(this.testimonialForm.stars) || 5
    };
    if (this.isEditingTestimonial && this.testimonialForm.id) {
      const idx = this.testimonials.findIndex(t => String(t.id) === String(this.testimonialForm.id));
      if (idx !== -1) {
        this.testimonials[idx].text = payload.content;
        this.testimonials[idx].clientName = payload.clientName;
        this.testimonials[idx].clientTitle = payload.role;
        this.testimonials[idx].stars = payload.rating;
      }
      this.gestionnaireApiService.updateTestimonial(this.testimonialForm.id, payload).subscribe({
        next: () => {
          this.dataService.showToast('Témoignage modifié avec succès dans NeonDB.');
          this.showTestimonialModal = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur updateTestimonial', err);
          this.dataService.showToast('Erreur de modification du témoignage dans NeonDB.', true);
        }
      });
    } else {
      const newTestimonial = { 
        id: Date.now().toString(), 
        text: payload.content, 
        clientName: payload.clientName, 
        clientTitle: payload.role, 
        stars: payload.rating 
      };
      this.testimonials.unshift(newTestimonial);
      this.gestionnaireApiService.createTestimonial(payload).subscribe({
        next: () => {
          this.dataService.showToast('Témoignage enrégistré avec succès dans NeonDB.');
          this.showTestimonialModal = false;
          this.loadData();
        },
        error: (err) => {
          console.error('Erreur createTestimonial', err);
          this.dataService.showToast("Erreur d'enregistrement du témoignage dans NeonDB.", true);
        }
      });
    }
    this.showTestimonialModal = false;
  }

  openDeleteTestimonialModal(t: any): void {
    this.testimonialToDelete = t;
    this.showDeleteTestimonialModal = true;
  }

  closeDeleteTestimonialModal(): void {
    this.showDeleteTestimonialModal = false;
    this.testimonialToDelete = null;
  }

  confirmDeleteTestimonial(): void {
    if (this.testimonialToDelete) {
      const id = this.testimonialToDelete.id;
      this.testimonials = this.testimonials.filter(t => String(t.id) !== String(id));
      this.gestionnaireApiService.deleteTestimonial(id).subscribe({
        next: () => {
          this.dataService.showToast('Témoignage supprimé de NeonDB.');
          this.loadData();
          this.closeDeleteTestimonialModal();
        },
        error: (err) => {
          console.error('Erreur deleteTestimonial', err);
          this.dataService.showToast('Erreur lors de la suppression dans NeonDB.', true);
          this.closeDeleteTestimonialModal();
        }
      });
    }
  }

  getStarsArray(n: number): number[] {
    return Array(Math.max(0, Math.min(5, n || 0))).fill(0);
  }

  // --- MEDIATHEQUE GROUPED BY EVENT ---
  getEventTitlesWithMedia(): string[] {
    const set = new Set<string>();
    this.mediaList.forEach(m => {
      set.add(m.eventTitle || 'Autres Événements');
    });
    return Array.from(set);
  }

  getMediaByEventTitle(title: string): any[] {
    if (title === 'ALL') return this.mediaList;
    return this.mediaList.filter(m => (m.eventTitle || 'Autres Événements') === title);
  }

  openAddMediaModal(): void {
    this.mediaForm = {
      title: '',
      url: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800',
      type: 'image',
      eventId: ''
    };
    this.showMediaModal = true;
  }

  closeMediaModal(): void {
    this.showMediaModal = false;
  }

  saveMedia(): void {
    if (!this.mediaForm.title.trim() || !this.mediaForm.url.trim()) {
      this.dataService.showToast("Le titre et l'URL sont requis.", true);
      return;
    }
    let eventTitle = 'Autres Événements';
    if (this.mediaForm.eventId) {
      const ev = this.events.find(e => e.id === this.mediaForm.eventId);
      if (ev) eventTitle = ev.title;
    }
    this.dataService.addMedia({
      title: this.mediaForm.title,
      url: this.mediaForm.url,
      type: this.mediaForm.type as any,
      eventId: this.mediaForm.eventId,
      eventTitle: eventTitle
    });
    this.dataService.showToast('Média ajouté à la médiathèque.');
    this.showMediaModal = false;
    this.loadData();
  }

  deleteMedia(id: string): void {
    if (confirm('Supprimer ce visuel de la médiathèque ?')) {
      this.dataService.deleteMedia(id);
      this.dataService.showToast('Média supprimé.');
      this.loadData();
    }
  }

  getPaginationArray(currentPage: number, totalPages: number): (number | string)[] {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i == 1 || i == totalPages || i >= currentPage - delta && i < currentPage + delta + 1) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }
}
