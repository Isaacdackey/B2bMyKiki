import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { KikiDataService } from './services/kiki-data.service';
import { GestionnaireApiService } from './services/gestionnaire-api.service';
import { CmsComponent } from './gestionnaire/components/cms/cms.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CmsComponent],
  template: `
    <div class="dashboard-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-logo" style="display: flex; justify-content: center; padding: 1rem 0;">
          <img src="assets/images/KIKI TRAITEUR Logo Blanc.png" alt="Kiki Traiteur Logo" style="max-width: 60px; height: auto; display: block;" onerror="this.style.display='none'">
        </div>

        <ul class="sidebar-menu">
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'dashboard'" (click)="activeTab = 'dashboard'">
              <i class="fas fa-chart-line me-2"></i> Tableau de Bord
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'requests'" (click)="activeTab = 'requests'">
              <i class="fas fa-file-invoice-dollar me-2"></i> Demandes & Devis
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'agenda'" (click)="activeTab = 'agenda'">
              <i class="fas fa-calendar-alt me-2"></i> Agenda & Planning
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'clients'" (click)="activeTab = 'clients'">
              <i class="fas fa-users me-2"></i> Fichier Clients
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'cms'" (click)="activeTab = 'cms'">
              <i class="fas fa-desktop me-2"></i> Site Web & CMS
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sidebar-link" [class.active]="activeTab === 'settings'" (click)="activeTab = 'settings'">
              <i class="fas fa-cog me-2"></i> Paramètres
            </a>
          </li>
        </ul>

        <div class="sidebar-footer">
          <div class="user-badge">
            <div class="user-avatar">PK</div>
            <div class="user-info">
              <span class="user-name">Pierre Kiki</span>
              <span class="user-role">Administrateur</span>
            </div>
          </div>
          <a href="javascript:void(0)" (click)="logout()" class="sidebar-link" style="color: #FCA5A5; border-top: 1px solid rgba(197, 168, 128, 0.1); margin-top: 0.5rem; padding-top: 1rem;">
            🚪 Déconnexion
          </a>
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
          <div style="margin-left:auto; display:flex; gap:0.6rem; align-items:center;">
            <a routerLink="/devis" class="btn btn-accent" style="color: white;"><i class="fas fa-plus me-1"></i> Créer une demande</a>
          </div>
        </div>

        <!-- CMS SECTION -->
        <app-cms *ngIf="activeTab === 'cms'"></app-cms>

        <!-- TAB 1: DASHBOARD -->
        <section *ngIf="activeTab === 'dashboard'" class="dashboard-section active">
          <!-- STATS CARDS -->
          <div class="stats-grid">
            
            <div class="stat-card animate-fade-up stagger-1" style="background: #5C2018; color: white;" *ngIf="!isLoadingStats">
              <div class="stat-icon" style="background: rgba(255, 255, 255, 0.1); color: white;">
                <i class="fas fa-inbox"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label" style="color: rgba(255, 255, 255, 0.8);">DEMANDES REÇUES</span>
                <span class="stat-value" style="color: white;">{{dashboardStats.totalRequests}}</span>
                <span class="stat-trend" style="color: rgba(255, 255, 255, 0.6); font-weight: normal; font-size: 0.85rem;">pour ce mois</span>
              </div>
              <div style="width: 100%; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 1rem; padding-top: 0.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.7); grid-column: span 2;">
                <i class="fas fa-layer-group me-1"></i>Toutes prestations confondues
              </div>
            </div>
            <div class="stat-card" *ngIf="isLoadingStats" style="display: flex; justify-content: center; align-items: center; background: #5C2018;">
               <div class="spinner-border" style="width: 2rem; height: 2rem; color: white; border: 3px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>

            <div class="stat-card animate-fade-up stagger-2" style="background: #DC2626; color: white;" *ngIf="!isLoadingStats">
              <div class="stat-icon" style="background: rgba(255, 255, 255, 0.2); color: white;">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label" style="color: rgba(255, 255, 255, 0.8);">DEMANDES ABOUTIES</span>
                <span class="stat-value" style="color: white;">{{dashboardStats.acceptedRequests}}</span>
                <span class="stat-trend" style="color: rgba(255, 255, 255, 0.8); font-weight: normal; font-size: 0.85rem;">réservations validées</span>
              </div>
              <div style="width: 100%; border-top: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.1); margin: 1rem -1.5rem -1.5rem -1.5rem; padding: 0.7rem 1.5rem; font-size: 0.8rem; color: white; grid-column: span 2;">
                <i class="fas fa-handshake me-1"></i>Devis signés et confirmés
              </div>
            </div>
            <div class="stat-card" *ngIf="isLoadingStats" style="display: flex; justify-content: center; align-items: center; background: #DC2626;">
               <div class="spinner-border" style="width: 2rem; height: 2rem; color: white; border: 3px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>

            <div class="stat-card animate-fade-up stagger-3" style="background: #A1A178; color: white;" *ngIf="!isLoadingStats">
              <div class="stat-icon" style="background: rgba(255, 255, 255, 0.2); color: white;">
                <i class="fas fa-hourglass-half"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label" style="color: rgba(255, 255, 255, 0.9);">EN ATTENTE DE RÉALISATION</span>
                <span class="stat-value" style="color: white;">{{dashboardStats.pendingRequests}}</span>
                <span class="stat-trend" style="color: rgba(255, 255, 255, 0.9); font-weight: normal; font-size: 0.85rem;">à confirmer ce mois-ci</span>
              </div>
              <div style="width: 100%; border-top: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.1); margin: 1rem -1.5rem -1.5rem -1.5rem; padding: 0.7rem 1.5rem; font-size: 0.8rem; color: white; grid-column: span 2;">
                <i class="fas fa-clock me-1"></i>Statuts : En attente / Devis émis
              </div>
            </div>
            <div class="stat-card" *ngIf="isLoadingStats" style="display: flex; justify-content: center; align-items: center; background: #A1A178;">
               <div class="spinner-border" style="width: 2rem; height: 2rem; color: white; border: 3px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>

            <div class="stat-card animate-fade-up stagger-4" style="background: white; border: 1px solid #E2E8F0;" *ngIf="!isLoadingStats">
              <div class="stat-icon" style="background: #F8FAFC; color: #475569; border: 1px solid #E2E8F0;">
                <i class="fas fa-percent"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label" style="color: #7A1C1C;">TAUX DE CONVERSION</span>
                <span class="stat-value" style="color: #1E293B;">{{dashboardStats.conversionRate}} <small style="font-size: 1.2rem; font-weight: 500; color: #64748B;">%</small></span>
                <span class="stat-trend" style="color: #64748B; font-weight: normal; font-size: 0.85rem;">abouties / reçues</span>
              </div>
              <div style="width: 100%; border-top: 1px solid #E2E8F0; background: #F8FAFC; margin: 1rem -1.5rem -1.5rem -1.5rem; padding: 0.7rem 1.5rem; font-size: 0.8rem; color: #475569; grid-column: span 2;">
                <i class="fas fa-chart-line me-1"></i>Performance commerciale mensuelle
              </div>
            </div>
            <div class="stat-card" *ngIf="isLoadingStats" style="display: flex; justify-content: center; align-items: center; background: white; border: 1px solid #E2E8F0;">
               <div class="spinner-border" style="width: 2rem; height: 2rem; color: #7A1C1C; border: 3px solid rgba(122, 28, 28, 0.3); border-top-color: #7A1C1C; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>

            <div class="stat-card animate-fade-up stagger-5" style="background: #1E293B; color: white;" *ngIf="!isLoadingStats">
              <div class="stat-icon" style="background: rgba(255, 255, 255, 0.1); color: white;">
                <i class="fas fa-users"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label" style="color: rgba(255, 255, 255, 0.8);">CLIENTS & ENTREPRISES</span>
                <span class="stat-value" style="color: white;">{{dashboardStats.totalClients}}</span>
                <span class="stat-trend" style="color: rgba(255, 255, 255, 0.7); font-weight: normal; font-size: 0.85rem;">inscrits dans l'ERP</span>
              </div>
              <div style="width: 100%; border-top: 1px solid rgba(0,0,0,0.2); background: #0F172A; margin: 1rem -1.5rem -1.5rem -1.5rem; padding: 0.7rem 1.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.9); grid-column: span 2;">
                <i class="fas fa-user me-1"></i>{{dashboardStats.particuliersCount}} Particulier / {{dashboardStats.entreprisesCount}} Entreprise
              </div>
            </div>
            <div class="stat-card" *ngIf="isLoadingStats" style="display: flex; justify-content: center; align-items: center; background: #1E293B;">
               <div class="spinner-border" style="width: 2rem; height: 2rem; color: white; border: 3px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>

            <div class="stat-card animate-fade-up stagger-6" style="background: #D97706; color: white;" *ngIf="!isLoadingStats">
              <div class="stat-icon" style="background: rgba(255, 255, 255, 0.2); color: white;">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div class="stat-details">
                <span class="stat-label" style="color: rgba(255, 255, 255, 0.9);">EN ATTENTE DE VALIDATION</span>
                <span class="stat-value" style="color: white;">{{dashboardStats.urgentRequests}}</span>
                <span class="stat-trend" style="color: rgba(255, 255, 255, 0.9); font-weight: normal; font-size: 0.85rem;">demandes urgentes</span>
              </div>
              <div style="width: 100%; border-top: 1px solid rgba(0,0,0,0.1); background: rgba(0,0,0,0.15); margin: 1rem -1.5rem -1.5rem -1.5rem; padding: 0.7rem 1.5rem; font-size: 0.8rem; color: white; grid-column: span 2;">
                <i class="fas fa-bolt me-1"></i>Action requise du gestionnaire
              </div>
            </div>
            <div class="stat-card" *ngIf="isLoadingStats" style="display: flex; justify-content: center; align-items: center; background: #D97706;">
               <div class="spinner-border" style="width: 2rem; height: 2rem; color: white; border: 3px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>

          </div>

          <!-- Recent requests table -->
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Demandes de devis récentes</h2>
              <button class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem;" (click)="activeTab = 'requests'">Voir tout</button>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID Demande</th>
                    <th>Client</th>
                    <th>Prestation</th>
                    <th>Date Événement</th>
                    <th>Invités</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of requests | slice:0:5">
                    <td><strong>#{{ req.id }}</strong></td>
                    <td>{{ req.clientName && req.clientName !== req.clientId ? req.clientName : getClientName(req.clientId) }}</td>
                    <td>{{ getPrestationName(req.prestationId) }}</td>
                    <td>{{ formatDate(req.date) }}</td>
                    <td>{{ req.guests }} pers.</td>
                    <td>
                      <span class="badge" [ngClass]="getBadgeClass(req.status)">
                        {{ getStatusLabel(req.status) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- TAB 2: REQUESTS -->
        <section *ngIf="activeTab === 'requests'" class="dashboard-section active">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Toutes les demandes de prestations</h2>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Prestation</th>
                    <th>Date Soumise</th>
                    <th>Date Événement</th>
                    <th>Invités</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of requests">
                    <td><strong>#{{ req.id }}</strong></td>
                    <td>
                      <strong>{{ req.clientName && req.clientName !== req.clientId ? req.clientName : getClientName(req.clientId) }}</strong><br>
                      <small style="color:#666;">{{ getClientOrg(req.clientId) }}</small>
                    </td>
                    <td>{{ getPrestationName(req.prestationId) }}</td>
                    <td>{{ formatDate(req.submittedDate) }}</td>
                    <td>{{ formatDate(req.date) }}</td>
                    <td>{{ req.guests }} pers.</td>
                    <td>
                      <span class="badge" [ngClass]="getBadgeClass(req.status)">
                        {{ getStatusLabel(req.status) }}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                        <button *ngIf="req.status === 'pending'" class="btn btn-sm btn-primary" (click)="quoteRequest(req.id)">
                          <i class="fas fa-file-signature"></i> Chiffrer Devis
                        </button>
                        <button *ngIf="req.status !== 'accepted'" class="btn btn-sm" style="background:#059669; color:white;" (click)="setStatus(req.id, 'accepted')" title="Valider">
                          <i class="fas fa-check"></i>
                        </button>
                        <button *ngIf="req.status !== 'rejected'" class="btn btn-sm" style="background:#DC2626; color:white;" (click)="setStatus(req.id, 'rejected')" title="Rejeter">
                          <i class="fas fa-times"></i>
                        </button>
                        <button class="btn btn-sm btn-outline" (click)="deleteRequest(req.id)" title="Supprimer">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- TAB 3: AGENDA -->
        <section *ngIf="activeTab === 'agenda'" class="dashboard-section active">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Planning des Réceptions & Événements</h2>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Événement</th>
                    <th>Client</th>
                    <th>Invités</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let req of getAcceptedRequests()">
                    <td><strong>{{ formatDate(req.date) }}</strong></td>
                    <td>{{ getPrestationName(req.prestationId) }}</td>
                    <td>{{ req.clientName && req.clientName !== req.clientId ? req.clientName : getClientName(req.clientId) }}</td>
                    <td>{{ req.guests }} pers.</td>
                    <td><span class="badge badge-accepted">Confirmé</span></td>
                  </tr>
                  <tr *ngIf="getAcceptedRequests().length === 0">
                    <td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                      Aucun événement confirmé dans le planning pour l'instant.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- TAB 4: CLIENTS -->
        <section *ngIf="activeTab === 'clients'" class="dashboard-section active">
          <div class="panel">
            <div class="panel-header">
              <h2 class="panel-title">Fichier Clients Kiki Traiteur</h2>
            </div>
            <div class="table-responsive">
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom Complet</th>
                    <th>Société / Org</th>
                    <th>E-mail</th>
                    <th>Type</th>
                    <th style="width: 80px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of clients">
                    <td><strong>{{ c.id }}</strong></td>
                    <td>{{ c.name }}</td>
                    <td>{{ c.organization || '-' }}</td>
                    <td>{{ c.email }}</td>
                    <td>
                      <span class="badge" 
                            [style.background]="c.organization ? '#F59E0B' : '#10B981'" 
                            [style.color]="'#ffffff'"
                            style="padding: 0.4rem 0.8rem; font-weight: 700; border-radius: 50px; font-size: 0.75rem; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        {{ c.organization ? 'ENTREPRISE' : 'PARTICULIER' }}
                      </span>
                    </td>
                    <td>
                      <div style="display: flex; gap: 0.5rem; justify-content: center;">
                        <button type="button" class="btn btn-sm btn-outline" style="color: #10B981; border-color: #10B981;" (click)="openViewClientModal(c); $event.stopPropagation()" title="Voir Détails">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" (click)="openEditModal(c); $event.stopPropagation()" title="Modifier Client">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline" style="color: #EF4444; border-color: #FCA5A5;" (click)="openDeleteModal(c); $event.stopPropagation()" title="Supprimer Client">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <!-- PAGINATION CLIENTS -->
              <div *ngIf="clients.length > 0" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-top: 1px solid #f1f5f9; background: #f8fafc; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;">
                <div style="color: #64748B; font-size: 0.875rem;">
                  Affichage de <span style="font-weight: 600; color: #1e293b;">{{ (clientPage - 1) * clientPageSize + 1 }}</span> à 
                  <span style="font-weight: 600; color: #1e293b;">{{ clientPage * clientPageSize > clients.length ? clients.length : clientPage * clientPageSize }}</span> 
                  sur <span style="font-weight: 600; color: #1e293b;">{{ clients.length }}</span> clients
                </div>
                <div style="display: flex; gap: 0.25rem;">
                  <button class="btn btn-outline" style="padding: 0.4rem 0.75rem; border-color: #e2e8f0; color: #64748B;" 
                          [disabled]="clientPage === 1" (click)="clientPage = clientPage - 1">
                    <i class="fas fa-chevron-left"></i>
                  </button>
                  <button *ngFor="let p of getClientPageArray()" class="btn" 
                          [ngStyle]="{'background': p === clientPage ? '#9333EA' : 'transparent', 'color': p === clientPage ? 'white' : '#64748B', 'border-color': p === clientPage ? '#9333EA' : '#e2e8f0'}"
                          style="padding: 0.4rem 0.85rem; font-weight: 600;" (click)="clientPage = p">
                    {{ p }}
                  </button>
                  <button class="btn btn-outline" style="padding: 0.4rem 0.75rem; border-color: #e2e8f0; color: #64748B;" 
                          [disabled]="clientPage === getClientTotalPages()" (click)="clientPage = clientPage + 1">
                    <i class="fas fa-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- VIEW CLIENT MODAL (ADMIN) -->
        <div class="modal-overlay" *ngIf="showViewClientModal" (click)="$event.target === $event.currentTarget && closeViewClientModal()">
          <div class="modal-card">
            <div class="modal-card-header">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="background: #fef3c7; color: #d97706; padding: 0.4rem; border-radius: 8px; font-size: 1.1rem;">
                  <i class="fas fa-user-circle"></i>
                </div>
                <h3 class="modal-title" style="font-size: 1.1rem;">Profil Client (Admin)</h3>
              </div>
              <button class="modal-close-btn" (click)="closeViewClientModal()" title="Fermer">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="modal-card-body" *ngIf="viewingClient">
              <!-- En-tête Client -->
              <div style="display: flex; gap: 1.5rem; align-items: flex-start; padding-bottom: 1.5rem; border-bottom: 1px solid #f1f5f9; margin-bottom: 1.5rem;">
                <div class="client-avatar-lg" style="margin-top: 0.25rem;">
                  {{ viewingClient.name.charAt(0).toUpperCase() }}
                </div>
                <div style="flex: 1;">
                  <h4 style="margin: 0 0 0.4rem 0; font-size: 1.25rem; color: #1e293b; font-weight: 800; line-height: 1.2;">{{ viewingClient.name }}</h4>
                  <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                    <span class="badge" 
                          [style.background]="viewingClient.organization ? '#F59E0B' : '#10B981'" 
                          [style.color]="'#ffffff'"
                          style="font-size: 0.65rem; font-weight: 800; padding: 0.35rem 0.7rem; border-radius: 50px; letter-spacing: 0.5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      <i class="fas fa-building me-1" *ngIf="viewingClient.organization"></i>
                      <i class="fas fa-user me-1" *ngIf="!viewingClient.organization"></i>
                      {{ viewingClient.organization ? 'ENTREPRISE' : 'PARTICULIER' }}
                    </span>
                    <span *ngIf="viewingClient.organization" style="color: #64748b; font-size: 0.8rem; font-weight: 600;">
                      {{ viewingClient.organization }}
                    </span>
                  </div>
                  <div style="color: #475569; font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.4rem;">
                    <div *ngIf="viewingClient.email" style="display: flex; align-items: center; gap: 0.5rem;">
                      <i class="fas fa-envelope" style="color: #94a3b8; font-size: 0.9rem;"></i> 
                      <span>{{ viewingClient.email }}</span>
                    </div>
                    <div *ngIf="viewingClient.phone" style="display: flex; align-items: center; gap: 0.5rem;">
                      <i class="fas fa-phone-alt" style="color: #94a3b8; font-size: 0.9rem;"></i> 
                      <span>{{ viewingClient.phone }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Historique des Demandes -->
              <h5 style="margin: 0 0 1rem 0; color: #334155; font-size: 1rem; font-weight: 700;">
                <i class="fas fa-history" style="color: #721513; margin-right: 0.5rem;"></i>Historique des demandes
              </h5>
              
              <div *ngIf="clientRequests.length > 0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Date / Événement</th>
                      <th>Prestation</th>
                      <th>Invités</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let req of clientRequests">
                      <td>
                        <strong style="display: block; color: #1e293b;">{{ formatDate(req.date) }}</strong>
                        <span style="font-size: 0.8rem; color: #64748b;">Soumis le {{ formatDate(req.dateSubmitted) }}</span>
                      </td>
                      <td>{{ req.prestationTitle || getPrestationName(req.prestationId) }}</td>
                      <td>{{ req.guests }}</td>
                      <td>
                        <span class="status-badge-elegant" [ngClass]="'status-' + (req.status === 'aboutis' || req.status === 'accepted' ? 'aboutis' : req.status === 'rejected' ? 'rejected' : req.status === 'quoted' ? 'quoted' : 'pending')">
                          <i class="fas" [ngClass]="{'fa-check-circle': req.status === 'aboutis' || req.status === 'accepted', 'fa-clock': req.status === 'pending', 'fa-times-circle': req.status === 'rejected', 'fa-file-invoice': req.status === 'quoted'}"></i>
                          {{ getStatusLabel(req.status) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div *ngIf="clientRequests.length === 0" style="text-align: center; color: #94a3b8; font-size: 0.95rem; padding: 2rem 1rem; background: #f8fafc; border-radius: 12px; border: 1px dashed #cbd5e1;">
                <div style="font-size: 2rem; margin-bottom: 0.75rem; color: #cbd5e1;"><i class="fas fa-folder-open"></i></div>
                Aucune demande enregistrée pour ce client.
              </div>
            </div>
            
            <div class="modal-footer">
              <button class="btn btn-primary" style="padding: 0.6rem 2rem; border-radius: 8px;" (click)="closeViewClientModal()">Fermer</button>
            </div>
          </div>
        </div>

        <!-- EDIT CLIENT MODAL -->
        <div class="modal-overlay" *ngIf="showEditModal" (click)="$event.target === $event.currentTarget && closeEditModal()">
          <div class="modal-card">
            <div class="modal-card-header">
              <h3 class="modal-title">Modifier le Client</h3>
              <button type="button" class="modal-close-btn" (click)="closeEditModal()">&times;</button>
            </div>
            <div class="modal-card-body" *ngIf="selectedClient">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1rem;">
                <div>
                  <label style="display: block; font-weight: 600; font-size: 0.75rem; color: #64748B; margin-bottom: 0.5rem; text-transform: uppercase;">NOM DU CLIENT <span style="color: #DC2626;">*</span></label>
                  <input type="text" [(ngModel)]="selectedClient.name" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 8px; outline: none; transition: border-color 0.2s;">
                </div>
                <div>
                  <label style="display: block; font-weight: 600; font-size: 0.75rem; color: #64748B; margin-bottom: 0.5rem; text-transform: uppercase;">TYPE DE CLIENT <span style="color: #DC2626;">*</span></label>
                  <select [(ngModel)]="selectedClient.type" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 8px; outline: none; background: white; transition: border-color 0.2s;">
                    <option value="particulier">Particulier</option>
                    <option value="entreprise">Entreprise</option>
                    <option value="institution">Institution</option>
                  </select>
                </div>
                <div>
                  <label style="display: block; font-weight: 600; font-size: 0.75rem; color: #64748B; margin-bottom: 0.5rem; text-transform: uppercase;">EMAIL <span style="color: #DC2626;">*</span></label>
                  <input type="email" [(ngModel)]="selectedClient.email" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 8px; outline: none; transition: border-color 0.2s;">
                </div>
                <div>
                  <label style="display: block; font-weight: 600; font-size: 0.75rem; color: #64748B; margin-bottom: 0.5rem; text-transform: uppercase;">TÉLÉPHONE</label>
                  <input type="text" [(ngModel)]="selectedClient.phone" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 8px; outline: none; transition: border-color 0.2s;">
                </div>
                <div *ngIf="selectedClient.type === 'entreprise' || selectedClient.type === 'institution'" style="grid-column: span 2;">
                  <label style="display: block; font-weight: 600; font-size: 0.75rem; color: #64748B; margin-bottom: 0.5rem; text-transform: uppercase;">NOM DE L'ENTREPRISE / INSTITUTION <span style="color: #DC2626;">*</span></label>
                  <input type="text" [(ngModel)]="selectedClient.organization" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 8px; outline: none; transition: border-color 0.2s;">
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" style="padding: 0.6rem 1.5rem; border-radius: 8px;" (click)="closeEditModal()" [disabled]="isEditing">Annuler</button>
              <button type="button" class="btn btn-primary" style="padding: 0.6rem 1.5rem; border-radius: 8px; position: relative;" (click)="submitEditClient()" [disabled]="isEditing || !selectedClient?.name || !selectedClient?.email || ((selectedClient?.type === 'entreprise' || selectedClient?.type === 'institution') && !selectedClient?.organization)">
                <span [style.opacity]="isEditing ? '0' : '1'"><i class="fas fa-save me-2"></i> Enregistrer</span>
                <i *ngIf="isEditing" class="fas fa-spinner fa-spin" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- DELETE CLIENT MODAL -->
        <div class="modal-overlay" *ngIf="showDeleteModal" (click)="$event.target === $event.currentTarget && closeDeleteModal()">
          <div class="modal-card" style="max-width: 450px;">
            <div class="modal-card-header" style="background: #FEF2F2; border-bottom-color: #FEE2E2;">
              <h3 class="modal-title" style="color: #991B1B; display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
                Confirmation de suppression
              </h3>
              <button type="button" class="modal-close-btn" (click)="closeDeleteModal()">&times;</button>
            </div>
            <div class="modal-card-body" *ngIf="selectedClient" style="text-align: center; padding: 2rem 1.5rem;">
              <div style="font-size: 3rem; color: #EF4444; margin-bottom: 1rem;">
                <i class="fas fa-trash-alt"></i>
              </div>
              <p style="font-size: 1.1rem; color: #334155; margin-bottom: 0.5rem;">
                Êtes-vous sûr de vouloir supprimer le client <strong>{{ selectedClient.name }}</strong> ?
              </p>
              <p style="font-size: 0.9rem; color: #64748B;">
                Cette action est définitive et toutes les données associées seront effacées.
              </p>
            </div>
            <div class="modal-footer" style="background: #F8FAFC;">
              <button type="button" class="btn btn-outline" style="padding: 0.6rem 1.5rem; border-radius: 8px;" (click)="closeDeleteModal()" [disabled]="isDeleting">Annuler</button>
              <button type="button" class="btn btn-primary" style="padding: 0.6rem 1.5rem; border-radius: 8px; background: #EF4444; border-color: #EF4444; position: relative;" (click)="confirmDeleteClient()" [disabled]="isDeleting">
                <span [style.opacity]="isDeleting ? '0' : '1'"><i class="fas fa-trash me-2"></i> Supprimer</span>
                <i *ngIf="isDeleting" class="fas fa-spinner fa-spin" style="position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 5: SETTINGS -->
        <section *ngIf="activeTab === 'settings'" class="dashboard-section active">
          <div class="panel" style="max-width: 700px;">
            <div class="panel-header">
              <h2 class="panel-title">Paramètres de l'entreprise</h2>
            </div>
            <form (ngSubmit)="saveSettings()">
              <div class="form-group">
                <label>Nom de l'entreprise</label>
                <input type="text" class="form-control" [(ngModel)]="settings.companyName" name="companyName">
              </div>
              <div class="form-group">
                <label>Adresse du siège</label>
                <input type="text" class="form-control" [(ngModel)]="settings.address" name="address">
              </div>
              <div class="form-group-row">
                <div class="form-group">
                  <label>E-mail de contact</label>
                  <input type="email" class="form-control" [(ngModel)]="settings.email" name="email">
                </div>
                <div class="form-group">
                  <label>Téléphone</label>
                  <input type="text" class="form-control" [(ngModel)]="settings.phone" name="phone">
                </div>
              </div>
              <button type="submit" class="btn btn-primary" style="padding: 0.8rem 2rem;">Enregistrer les modifications</button>
            </form>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
    :host { display: block; }
    .admin-card-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .admin-card {
      background: var(--bg-white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
    }
    .admin-card-header {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 0.85rem;
      margin-bottom: 0.75rem;
    }
    .admin-card-value {
      font-size: 1.8rem;
      font-weight: 900;
      color: var(--primary-dark);
      margin-bottom: 0.5rem;
    }
    .admin-card-trend {
      font-size: 0.82rem;
      color: #64748B;
    }
    .admin-card-trend.up {
      color: #059669;
    }
    
    /* ── Modal Overlay avec Glassmorphism ── */
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px);
      display: flex; align-items: center; justify-content: center; z-index: 1050; padding: 1rem;
    }
    .modal-content, .modal-card {
      background: #ffffff; border-radius: 16px; width: 100%; max-width: 600px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex; flex-direction: column; overflow: hidden; max-height: 90vh;
    }
    .modal-header, .modal-card-header {
      padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #f8fafc;
    }
    .modal-title { margin: 0; font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .modal-close, .modal-close-btn { background: none; border: none; font-size: 1.5rem; line-height: 1; color: #64748b; cursor: pointer; transition: color 0.2s; }
    .modal-close-btn:hover { color: #ef4444; }
    .modal-body, .modal-card-body { padding: 1.5rem; overflow-y: auto; }
    .modal-footer { padding: 1.25rem 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 1rem; background: #f8fafc; }
    
    /* Badges */
    .status-badge-elegant { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
    .status-badge-elegant.status-aboutis { background: #10B981; color: white; }
    .status-badge-elegant.status-pending { background: #F59E0B; color: white; }
    .status-badge-elegant.status-rejected { background: #EF4444; color: white; }
    .status-badge-elegant.status-quoted { background: #64748B; color: white; }
    
    .history-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 1rem; }
    .history-table th { text-align: left; padding: 0.75rem 1rem; background: #f1f5f9; color: #475569; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
    .history-table td { padding: 1rem; font-size: 0.9rem; color: #334155; border-bottom: 1px solid #e2e8f0; }
    .client-avatar-lg { width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #721513, #e51d24); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; }
    `
  ]
})
export class AdminDashboardComponent implements OnInit {
  activeTab: 'dashboard' | 'requests' | 'agenda' | 'clients' | 'cms' | 'settings' = 'dashboard';
  requests: any[] = [];
  clients: any[] = [];
  
  showViewClientModal = false;
  viewingClient: any = null;
  clientRequests: any[] = [];

  showEditModal = false;
  selectedClient: any = null;
  isEditing = false;

  showDeleteModal = false;
  isDeleting = false;

  clientPage = 1;
  clientPageSize = 10;

  dashboardStats: any = {
    totalRequests: 0,
    acceptedRequests: 0,
    pendingRequests: 0,
    urgentRequests: 0,
    conversionRate: 0,
    totalClients: 0,
    particuliersCount: 0,
    entreprisesCount: 0
  };
  isLoadingStats = false;

  settings = {
    companyName: 'Kiki Traiteur SAS',
    address: 'Hann Maristes, Dakar, Sénégal',
    email: 'contact@kikitraiteursenegal.net',
    phone: '+221 33 832 29 66'
  };

  constructor(
    private dataService: KikiDataService,
    private router: Router,
    private gestionnaireApiService: GestionnaireApiService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // --- PAGINATION CLIENTS ---
  getClientsForPage(): any[] {
    const start = (this.clientPage - 1) * this.clientPageSize;
    return this.clients.slice(start, start + this.clientPageSize);
  }
  
  getClientTotalPages(): number {
    return Math.max(1, Math.ceil(this.clients.length / this.clientPageSize));
  }
  
  getClientPageArray(): number[] {
    return Array.from({ length: this.getClientTotalPages() }, (_, i) => i + 1);
  }

  loadData(): void {
    // Charger les clients via l'API
    this.gestionnaireApiService.getAllClients().subscribe({
      next: (data) => {
        if (data && Array.isArray(data)) {
          this.clients = data.map(c => ({
            id: String(c.id),
            name: c.name || c.nom || 'Client',
            email: c.email || '',
            phone: c.phone || c.telephone || '',
            type: c.clientType || c.type || 'particulier',
            organization: c.organization || c.clientOrganization || ''
          }));
          this.updateLocalMetrics();
        }
      },
      error: () => {
        this.clients = this.dataService.getClients();
        this.updateLocalMetrics();
      }
    });

    this.requests = []; // Réinitialiser en attendant la réponse API

    this.gestionnaireApiService.getAllDemandes().subscribe({
      next: (data) => {
        // data est un PageResponse {content: [...], totalElements, ...}
        const items = data && data.content ? data.content : [];
        console.log(`[AdminDashboard] getAllDemandes → ${items.length} demande(s) reçue(s)`);
        this.requests = items.map(d => ({
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
          prestationTitle: d.prestationTitle || d.prestationId,
          location: d.location || d.locationType || ''
        }));
        this.updateLocalMetrics();
      },
      error: (err) => console.warn('API Gestionnaire getAllDemandes non accessible pour AdminDashboard', err)
    });

    this.isLoadingStats = true;
    this.gestionnaireApiService.getDashboardStats().subscribe({
      next: (stats) => {
        if (stats) {
          this.dashboardStats = {
            totalRequests: Number(stats.totalRequests) || 0,
            acceptedRequests: Number(stats.acceptedRequests) || 0,
            pendingRequests: Number(stats.pendingRequests) || 0,
            urgentRequests: Number(stats.urgentRequests) || 0,
            conversionRate: Math.round(Number(stats.conversionRate) || 0),
            totalClients: Number(stats.totalClients) || 0,
            particuliersCount: Number(stats.particuliersCount) || 0,
            entreprisesCount: Number(stats.entreprisesCount) || 0
          };
        }
        this.isLoadingStats = false;
      },
      error: (err) => {
        console.warn('API Gestionnaire stats non accessible pour AdminDashboard', err);
        this.isLoadingStats = false;
      }
    });
  }

  updateLocalMetrics(): void {
    if (!this.dashboardStats || this.dashboardStats.totalRequests === 0) {
      const allReqs = this.requests || [];
      const totalRequests = allReqs.length;
      const acceptedRequests = allReqs.filter(r => 
        ['abouti', 'aboutis', 'confirmed', 'devis_confirme'].includes((r.status || '').toLowerCase())
      ).length;
      const pendingRequests = allReqs.filter(r => 
        ['acceptee', 'accepted', 'approved', 'proposition_envoyee', 'propositions_envoyees', 'envoyee', 'proposition_validee', 'selection_client'].includes((r.status || '').toLowerCase())
      ).length;
      const urgentRequests = allReqs.filter(r => 
        ['en_attente', 'pending', 'new', ''].includes((r.status || '').toLowerCase())
      ).length;
      const conversionRate = totalRequests > 0 ? Math.round((acceptedRequests / totalRequests) * 100) : 0;
      
      const totalClients = (this.clients || []).length;
      const particuliersCount = (this.clients || []).filter(c => (c.type || '').toLowerCase() === 'particulier').length;
      const entreprisesCount = (this.clients || []).filter(c => ['entreprise', 'institution'].includes((c.type || '').toLowerCase())).length;

      this.dashboardStats = {
        totalRequests,
        acceptedRequests,
        pendingRequests,
        urgentRequests,
        conversionRate,
        totalClients,
        particuliersCount,
        entreprisesCount
      };
    }
  }

  getTitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return 'Tableau de Bord Administration';
      case 'requests': return 'Demandes de devis & Commandes';
      case 'agenda': return 'Agenda & Planning Événements';
      case 'clients': return 'Fichier Clients';
      case 'cms': return 'Site Web & CMS';
      case 'settings': return 'Paramètres Kiki Traiteur';
      default: return 'Administration';
    }
  }

  getSubtitle(): string {
    switch (this.activeTab) {
      case 'dashboard': return 'Données analytiques et pilotage des activités traiteur.';
      case 'requests': return 'Gérez, chiffrer et validez les réceptions des clients.';
      case 'agenda': return 'Calendrier des prestations en cours et programmées.';
      case 'clients': return 'Liste complète de vos clients particuliers et entreprises.';
      case 'cms': return 'Gérez les FAQs et témoignages de votre site.';
      case 'settings': return 'Configuration de la société et adresses.';
      default: return '';
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
      'evenements': 'Organisation d\'Événements',
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

  getStatusLabel(status: string): string {
    switch (status) {
      case 'quoted': return 'Devis Prêt';
      case 'accepted': return 'Accepté';
      case 'rejected': return 'Refusé';
      default: return 'En attente';
    }
  }

  getBadgeClass(status: string): string {
    switch (status) {
      case 'quoted': return 'badge-quoted';
      case 'accepted': return 'badge-accepted';
      case 'rejected': return 'badge-rejected';
      default: return 'badge-pending';
    }
  }

  formatDate(d: string): string {
    if (!d) return '';
    try {
      return new Date(d).toLocaleDateString('fr-FR');
    } catch {
      return d;
    }
  }

  openViewClientModal(c: any): void {
    this.viewingClient = { ...c };
    this.clientRequests = this.requests.filter(req => String(req.clientId) === String(c.id));
    this.showViewClientModal = true;
  }
  
  closeViewClientModal(): void {
    this.showViewClientModal = false;
    this.viewingClient = null;
    this.clientRequests = [];
  }

  getAcceptedRequests(): any[] {
    return this.requests.filter(r => r.status === 'accepted');
  }

  quoteRequest(id: string): void {
    this.dataService.updateRequestStatus(id, 'quoted');
    this.dataService.showToast('Devis généré et envoyé au client ! Statut passé à : Devis Prêt.');
    this.loadData();
  }

  setStatus(id: string, st: string): void {
    const numId = Number(id);
    if (!isNaN(numId) && numId > 0) {
      this.gestionnaireApiService.updateStatus(numId, st).subscribe({
        next: () => {
          this.dataService.updateRequestStatus(id, st);
          this.dataService.showToast(`Statut de la demande mis à jour.`);
          this.loadData();
        },
        error: () => {
          this.dataService.updateRequestStatus(id, st);
          this.dataService.showToast(`Statut de la demande mis à jour.`);
          this.loadData();
        }
      });
    } else {
      this.dataService.updateRequestStatus(id, st);
      this.dataService.showToast(`Statut de la demande mis à jour.`);
      this.loadData();
    }
  }

  deleteRequest(id: string): void {
    if (confirm('Supprimer cette demande définitivement ?')) {
      this.dataService.deleteRequest(id);
      this.dataService.showToast('Demande supprimée.');
      this.loadData();
    }
  }

  saveSettings(): void {
    this.dataService.showToast('Paramètres de l\'entreprise enregistrés.');
  }

  logout(): void {
    this.dataService.showToast('Déconnexion Administrateur effectuée.');
    this.router.navigate(['/auth'], { queryParams: { type: 'staff' } });
  }

  deleteClient(c: any): void {
    this.openDeleteModal(c);
  }

  // --- GESTION DES MODALES CLIENT ---

  closeAllClientModals(): void {
    this.showViewClientModal = false;
    this.showEditModal = false;
    this.showDeleteModal = false;
  }

  openEditModal(client: any): void {
    console.log("openEditModal called with:", client);
    this.closeAllClientModals();
    this.selectedClient = { ...client };
    this.isEditing = false;
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedClient = null;
  }

  submitEditClient(): void {
    if (!this.selectedClient || this.isEditing) return;
    this.isEditing = true;
    
    this.gestionnaireApiService.updateClient(this.selectedClient.id, this.selectedClient).subscribe({
      next: () => {
        this.isEditing = false;
        this.closeEditModal();
        this.dataService.showToast('Client mis à jour avec succès.');
        this.loadData();
      },
      error: (err: any) => {
        this.isEditing = false;
        console.error("API Update Error:", err);
        let msg = 'Erreur lors de la mise à jour.';
        if (err.error && typeof err.error === 'string') {
          msg = err.error;
        } else if (err.error && err.error.message) {
          msg = err.error.message;
        } else if (err.message) {
          msg = err.message;
        }
        this.dataService.showToast(msg, true);
        this.closeEditModal();
      }
    });
  }

  openDeleteModal(client: any): void {
    console.log("openDeleteModal called with:", client);
    this.closeAllClientModals();
    this.selectedClient = { ...client };
    this.isDeleting = false;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedClient = null;
  }

  confirmDeleteClient(): void {
    if (!this.selectedClient || this.isDeleting) return;
    this.isDeleting = true;

    this.gestionnaireApiService.deleteClient(this.selectedClient.id).subscribe({
      next: () => {
        this.dataService.showToast('Client supprimé avec succès.');
        this.closeDeleteModal();
        this.loadData();
      },
      error: (err: any) => {
        this.isDeleting = false;
        console.error("Erreur suppression client:", err);
        let msg = 'Erreur lors de la suppression.';
        if (err.error && typeof err.error === 'string') {
          msg = err.error;
        } else if (err.error && err.error.message) {
          msg = err.error.message;
        }
        this.dataService.showToast(msg, true);
        this.closeDeleteModal();
      }
    });
  }
}
