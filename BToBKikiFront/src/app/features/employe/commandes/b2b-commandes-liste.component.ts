import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { B2bPeriodFilterComponent, PeriodeFilterChange } from '../../../b2b/shared/b2b-period-filter.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { CommandeHistoriqueB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-b2b-commandes-liste',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, B2bPeriodFilterComponent],
  template: `
    <div class="b2b-wrapper">

      <main class="cmd-main">
        <!-- En-tête -->
        <header class="cmd-header-card">
          <div>
            <h1 class="cmd-title">Mes Commandes &amp; Suivi</h1>
            <p class="cmd-subtitle">
              {{ b2b.currentEmploye().prenom }} {{ b2b.currentEmploye().nom }} •
              {{ b2b.modeProfil() === 'SUBVENTIONNE' ? 'Conventionné (' + b2b.currentEmploye().tauxSubvention + '%)' : 'Autonome • Paiement Wave' }}
            </p>
          </div>
          <app-b2b-period-filter
            defaultPeriode="MOIS"
            referenceDate="2026-11-12"
            (periodChange)="onPeriodeChange($event)">
          </app-b2b-period-filter>
        </header>

        <!-- Filtres Statut + Recherche -->
        <section class="cmd-filters-bar">
          <div class="kiki-scroll-row-wrap" style="flex: 1 1 320px; min-width: 0;">
            <div class="cmd-status-pills kiki-scroll-row" style="flex-wrap: nowrap;">
              <button type="button" class="cmd-pill" style="flex-shrink: 0; white-space: nowrap;" [class.active]="filtreStatut() === 'TOUTES'" (click)="filtreStatut.set('TOUTES'); page.set(1)">
                Toutes ({{ mesCommandes().length }})
              </button>
              <button type="button" class="cmd-pill" style="flex-shrink: 0; white-space: nowrap;" [class.active]="filtreStatut() === 'VALIDE'" (click)="filtreStatut.set('VALIDE'); page.set(1)">
                Validées
              </button>
              <button type="button" class="cmd-pill" style="flex-shrink: 0; white-space: nowrap;" [class.active]="filtreStatut() === 'EN_PREPARATION'" (click)="filtreStatut.set('EN_PREPARATION'); page.set(1)">
                En préparation
              </button>
              <button type="button" class="cmd-pill" style="flex-shrink: 0; white-space: nowrap;" [class.active]="filtreStatut() === 'LIVRE'" (click)="filtreStatut.set('LIVRE'); page.set(1)">
                Livrées
              </button>
            </div>
          </div>

          <div class="cmd-search-box">
            <i class="fa-solid fa-magnifying-glass" style="color: #721513; font-size: 0.8rem;"></i>
            <input
              type="text"
              [ngModel]="recherche()"
              (ngModelChange)="recherche.set($event); page.set(1)"
              placeholder="Rechercher une commande ou un plat..."
              class="cmd-search-input" />
          </div>
        </section>

        <!-- Liste des Commandes (Tableau desktop -> Cards mobile) -->
        <section class="cmd-list-card">
          @if (commandesPaginees().length === 0) {
            <div class="cmd-empty">
              <i class="fa-solid fa-receipt" style="font-size: 2rem; color: #C5A880; margin-bottom: 0.65rem;"></i>
              <p style="margin: 0 0 0.9rem; font-weight: 700; color: #6E5A56;">Aucune commande trouvée sur cette période.</p>
              <a routerLink="/b2b/commande" class="cmd-btn-primary">
                <i class="fa-solid fa-utensils"></i> Commander un repas
              </a>
            </div>
          } @else {
            <table class="cmd-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Date</th>
                  <th>Plat / Formule</th>
                  <th style="text-align: center;">Statut</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (cmd of commandesPaginees(); track cmd.id) {
                  <tr>
                    <td data-label="Référence">
                      <code class="cmd-code">{{ cmd.id }}</code>
                    </td>
                    <td data-label="Date">
                      <div style="font-weight: 700; color: #2C1810;">{{ cmd.date }}</div>
                      <div style="font-size: 0.72rem; color: #6E5A56;">{{ cmd.heure }}</div>
                    </td>
                    <td data-label="Plat">
                      <div style="font-weight: 700; color: #721513;">{{ cmd.platNom }}</div>
                      <div style="font-size: 0.72rem; color: #6E5A56;">{{ cmd.formuleNom }}</div>
                    </td>
                    <td data-label="Statut" style="text-align: center;">
                      @if (cmd.statut === 'LIVRE') {
                        <span class="cmd-badge livre"><i class="fa-solid fa-circle-check"></i> Livrée</span>
                      } @else if (cmd.statut === 'EN_PREPARATION') {
                        <span class="cmd-badge scanne"><i class="fa-solid fa-fire-burner"></i> En préparation</span>
                      } @else {
                        <span class="cmd-badge encours"><i class="fa-solid fa-check"></i> Validée</span>
                      }
                    </td>
                    <td data-label="Actions" style="text-align: right;">
                      <div class="cmd-actions-row">
                        <button type="button" class="cmd-btn-outline" (click)="commandeDetail.set(cmd)">
                          <i class="fa-regular fa-eye"></i> Détails
                        </button>
                        <button type="button" class="cmd-btn-qr" (click)="ouvrirQr(cmd)">
                          <i class="fa-solid fa-qrcode"></i> QR Code
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Pagination -->
            <div class="cmd-pagination">
              <span style="font-size: 0.78rem; color: #6E5A56;">
                Page <strong>{{ page() }}</strong> / {{ totalPages() }} ({{ commandesFiltrees().length }} commande(s))
              </span>
              <div style="display: flex; gap: 0.35rem; align-items: center;">
                <button type="button" class="cmd-page-btn" [disabled]="page() <= 1" (click)="page.set(page() - 1)">
                  <i class="fa-solid fa-chevron-left"></i>
                </button>
                @for (p of pagesArray(); track p) {
                  <button type="button" class="cmd-page-num" [class.active]="page() === p" (click)="page.set(p)">
                    {{ p }}
                  </button>
                }
                <button type="button" class="cmd-page-btn" [disabled]="page() >= totalPages()" (click)="page.set(page() + 1)">
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
              </div>
            </div>
          }
        </section>
      </main>

      <!-- MODAL DÉTAILS COMMANDE -->
      @if (commandeDetail(); as det) {
        <div class="cmd-modal-overlay" (click)="commandeDetail.set(null)">
          <div class="cmd-modal-card" (click)="$event.stopPropagation()">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <code class="cmd-code">{{ det.id }}</code>
                <h3 style="margin: 0.35rem 0 0; font-size: 1.2rem; color: #721513; font-weight: 900;">Détails de la commande</h3>
              </div>
              <button type="button" (click)="commandeDetail.set(null)" style="background: none; border: none; font-size: 1.2rem; color: #6E5A56; cursor: pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div class="cmd-detail-grid">
              <div class="cmd-detail-item"><span>Date &amp; Heure</span><strong>{{ det.date }} • {{ det.heure }}</strong></div>
              <div class="cmd-detail-item"><span>Statut</span><strong>{{ det.statut === 'LIVRE' ? 'Livrée' : det.statut === 'EN_PREPARATION' ? 'En préparation' : 'Validée' }}</strong></div>
              <div class="cmd-detail-item cmd-detail-full"><span>Site de retrait</span><strong>{{ det.siteNom }}</strong></div>
              <div class="cmd-detail-item cmd-detail-full"><span>Formule &amp; Plat principal</span><strong>{{ det.formuleNom }} — {{ det.platNom }}</strong></div>
              <div class="cmd-detail-item"><span>Montant total</span><strong>{{ det.prixTotal | number }} FCFA</strong></div>
              <div class="cmd-detail-item"><span>Prise en charge</span><strong style="color: #606C38;">{{ det.partEntreprise | number }} FCFA</strong></div>
              <div class="cmd-detail-item cmd-detail-full" style="display: flex; justify-content: space-between; align-items: center;">
                <span style="margin: 0;">Reste / Payé</span>
                <strong style="color: #721513; font-size: 0.95rem;">{{ det.partEmploye | number }} FCFA</strong>
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 1.25rem; flex-wrap: wrap;">
              <button type="button" class="cmd-btn-outline" (click)="commandeDetail.set(null)">Fermer</button>
              <button type="button" class="cmd-btn-qr" (click)="ouvrirQr(det); commandeDetail.set(null)">
                <i class="fa-solid fa-qrcode"></i> Afficher le QR Code
              </button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL QR CODE RETRAIT -->
      @if (commandeQr(); as qrCmd) {
        <div class="cmd-modal-overlay" (click)="commandeQr.set(null)">
          <div class="cmd-modal-card" (click)="$event.stopPropagation()" style="max-width: 400px; text-align: center;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <code class="cmd-code">{{ qrCmd.id }}</code>
              <button type="button" (click)="commandeQr.set(null)" style="background: none; border: none; font-size: 1.2rem; color: #6E5A56; cursor: pointer;">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <h3 style="margin: 0 0 0.25rem; font-size: 1.25rem; color: #721513; font-weight: 900;">QR Code de Retrait</h3>
            <p style="margin: 0 0 1rem; font-size: 0.8rem; color: #6E5A56;">Présentez ce code au comptoir lors de la récupération.</p>

            <div style="background: #FAF8F4; border: 2px solid #721513; border-radius: 18px; padding: 1.25rem; display: inline-block; margin-bottom: 1rem;">
              <svg viewBox="0 0 25 25" width="180" height="180" shape-rendering="crispEdges">
                <rect width="25" height="25" fill="#FFFFFF"/>
                @for (row of qrMatrix(); track $index; let r = $index) {
                  @for (cell of row; track $index; let c = $index) {
                    @if (cell) {
                      <rect [attr.x]="c" [attr.y]="r" width="1" height="1" fill="#721513"/>
                    }
                  }
                }
              </svg>
            </div>

            <div style="font-size: 0.82rem; font-weight: 800; color: #2C1810; margin-bottom: 1rem;">
              {{ qrCmd.platNom }} • {{ qrCmd.date }}
            </div>

            <button type="button" class="cmd-btn-primary" style="width: 100%; justify-content: center;" (click)="commandeQr.set(null)">
              Fermer
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .b2b-wrapper {
      background-color: #FAF8F4;
      min-height: 100dvh;
      padding: 1.25rem clamp(1rem, 2vw, 2rem) 5rem;
      margin-left: var(--b2b-sidebar-w, 300px);
      transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    @media (max-width: 1023px) {
      .b2b-wrapper { margin-left: 0 !important; padding: 1rem 1rem 5rem; }
    }
    .cmd-main { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.25rem; }
    .cmd-header-card {
      background: #FFFFFF; border: 1.5px solid #EDE7DC; border-radius: 18px; padding: 1.25rem 1.5rem;
      display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;
      box-shadow: 0 4px 16px rgba(114, 21, 19, 0.04);
    }
    .cmd-title { margin: 0; font-size: 1.45rem; font-weight: 900; color: #721513; }
    .cmd-subtitle { margin: 0.2rem 0 0; font-size: 0.82rem; color: #6E5A56; font-weight: 600; }
    .cmd-filters-bar {
      background: #FFFFFF; border: 1.5px solid #EDE7DC; border-radius: 16px; padding: 0.9rem 1.2rem;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;
    }
    .cmd-status-pills { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .cmd-pill {
      border: 1.5px solid #EDE7DC; background: #FAF8F4; color: #6E5A56; border-radius: 9999px;
      padding: 0.38rem 0.85rem; font-size: 0.76rem; font-weight: 800; cursor: pointer;
    }
    .cmd-pill.active { background: #721513; color: #FFFFFF; border-color: #721513; }
    .cmd-search-box {
      display: flex; align-items: center; gap: 0.5rem; background: #FAF8F4; border: 1.5px solid #EDE7DC;
      border-radius: 9999px; padding: 0.4rem 0.9rem; flex: 1 1 220px; max-width: 300px;
    }
    .cmd-search-input { border: none; outline: none; background: transparent; font-size: 0.8rem; width: 100%; font-weight: 600; }
    .cmd-list-card { background: #FFFFFF; border: 1.5px solid #EDE7DC; border-radius: 18px; overflow: hidden; }
    .cmd-table { width: 100%; border-collapse: collapse; }
    .cmd-table th {
      background: #FAF8F4; color: #721513; font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
      padding: 0.85rem 1.1rem; text-align: left; border-bottom: 1.5px solid #EDE7DC;
    }
    .cmd-table td { padding: 0.85rem 1.1rem; border-bottom: 1px solid #FAF5EA; font-size: 0.85rem; }
    .cmd-code { background: #FAF5EA; color: #721513; font-weight: 800; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.76rem; }
    .cmd-badge { padding: 0.28rem 0.7rem; border-radius: 9999px; font-size: 0.72rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.3rem; }
    .cmd-badge.livre { background: rgba(96, 108, 56, 0.14); color: #606C38; }
    .cmd-badge.scanne { background: rgba(192, 86, 33, 0.14); color: #C05621; }
    .cmd-badge.encours { background: rgba(114, 21, 19, 0.1); color: #721513; }
    .cmd-actions-row { display: inline-flex; gap: 0.45rem; justify-content: flex-end; flex-wrap: wrap; }
    .cmd-btn-outline {
      background: #FAF8F4; border: 1.5px solid #EDE7DC; color: #721513; border-radius: 9999px;
      padding: 0.35rem 0.8rem; font-size: 0.74rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;
    }
    .cmd-btn-qr {
      background: #721513; border: 1.5px solid #721513; color: #FFFFFF; border-radius: 9999px;
      padding: 0.35rem 0.8rem; font-size: 0.74rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 0.3rem;
    }
    .cmd-btn-primary {
      background: #721513; color: #FFFFFF; border: none; border-radius: 9999px; padding: 0.55rem 1.2rem;
      font-size: 0.82rem; font-weight: 800; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem; cursor: pointer;
    }
    .cmd-empty { padding: 3rem 1.5rem; text-align: center; }
    .cmd-pagination {
      padding: 0.85rem 1.15rem; background: #FAF8F4; border-top: 1px solid #EDE7DC;
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;
    }
    .cmd-page-btn, .cmd-page-num {
      width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid #EDE7DC; background: #FFFFFF;
      color: #721513; font-weight: 800; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
    }
    .cmd-page-num.active { background: #721513; color: #FFFFFF; border-color: #721513; }
    .cmd-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .cmd-modal-overlay {
      position: fixed; inset: 0; background: rgba(51, 39, 36, 0.65); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 99999; padding: 1rem;
    }
    .cmd-modal-card {
      background: #FFFFFF; border-radius: 20px; max-width: 520px; width: 100%; padding: 1.5rem;
      border: 1.5px solid #EDE7DC; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.2);
    }
    .cmd-detail-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.65rem; background: #FAF8F4;
      border: 1.5px solid #EDE7DC; border-radius: 16px; padding: 0.9rem; font-size: 0.82rem;
    }
    .cmd-detail-item {
      background: #FFFFFF; border: 1px solid #EDE7DC; border-radius: 10px; padding: 0.6rem 0.75rem; min-width: 0;
    }
    .cmd-detail-full { grid-column: 1 / -1; }
    .cmd-detail-grid span { display: block; font-size: 0.66rem; color: #6E5A56; font-weight: 700; text-transform: uppercase; margin-bottom: 0.15rem; }
    .cmd-detail-grid strong { color: #2C1810; font-weight: 800; word-break: break-word; }
    @media (max-width: 767px) {
      .cmd-search-box { max-width: 100%; width: 100%; }
      .cmd-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; padding: 0.75rem; }
      .cmd-pagination { justify-content: center; text-align: center; }
      .cmd-pagination > span { display: none; }
      .cmd-table thead { display: none; }
      .cmd-table tbody { display: flex; flex-direction: column; gap: 0.85rem; padding: 0.75rem; background: #FAF8F4; }
      .cmd-table tbody tr {
        display: flex; flex-direction: column; background: #FFFFFF; border: 1.5px solid #EDE7DC;
        border-radius: 16px; padding: 0.9rem 1rem; gap: 0.35rem;
      }
      .cmd-table tbody td {
        display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0;
        border-bottom: 1px dashed #EDE7DC; text-align: right;
      }
      .cmd-table tbody td:last-child { border-bottom: none; padding-top: 0.6rem; justify-content: flex-end; }
      .cmd-table tbody td::before {
        content: attr(data-label); font-size: 0.7rem; font-weight: 800; color: #721513; text-transform: uppercase; text-align: left;
      }
      .cmd-table tbody td[data-label="Statut"]::before,
      .cmd-table tbody td[data-label="Actions"]::before {
        display: none;
        content: none;
      }
    }
  `]
})
export class B2bCommandesListeComponent {
  b2b = inject(B2bStateService);

  dateDebut = signal<string>('2026-11-01');
  dateFin = signal<string>('2026-11-30');
  filtreStatut = signal<'TOUTES' | 'VALIDE' | 'EN_PREPARATION' | 'LIVRE'>('TOUTES');
  recherche = signal<string>('');
  page = signal<number>(1);
  pageSize = 6;

  commandeDetail = signal<CommandeHistoriqueB2B | null>(null);
  commandeQr = signal<CommandeHistoriqueB2B | null>(null);
  qrMatrix = signal<boolean[][]>([]);

  onPeriodeChange(ev: PeriodeFilterChange) {
    this.dateDebut.set(ev.dateDebut);
    this.dateFin.set(ev.dateFin);
    this.page.set(1);
  }

  mesCommandes = computed(() => {
    const emp = this.b2b.currentEmploye();
    const nomComplet = `${emp.prenom} ${emp.nom}`.toLowerCase();
    const toutes = this.b2b.historiqueCommandes();
    const propres = toutes.filter(
      c => c.matricule === emp.matricule || c.employeNom.toLowerCase().includes(emp.nom.toLowerCase()) || nomComplet.includes(c.employeNom.toLowerCase())
    );
    return propres.length > 0 ? propres : toutes;
  });

  commandesFiltrees = computed(() => {
    const st = this.filtreStatut();
    const q = this.recherche().trim().toLowerCase();
    const d1 = this.dateDebut();
    const d2 = this.dateFin();
    return this.mesCommandes().filter(c => {
      const matchStatut = st === 'TOUTES' || c.statut === st;
      const matchDate = (!d1 || c.date >= d1) && (!d2 || c.date <= d2);
      const matchQ = !q || c.id.toLowerCase().includes(q) || c.platNom.toLowerCase().includes(q);
      return matchStatut && matchDate && matchQ;
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.commandesFiltrees().length / this.pageSize)));
  pagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));
  commandesPaginees = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.commandesFiltrees().slice(start, start + this.pageSize);
  });

  ouvrirQr(cmd: CommandeHistoriqueB2B) {
    this.qrMatrix.set(this.buildQrMatrix(`${cmd.id}-${cmd.matricule}-${cmd.date}`));
    this.commandeQr.set(cmd);
  }

  private buildQrMatrix(seed: string): boolean[][] {
    const size = 25;
    const grid: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    const drawFinder = (r0: number, c0: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const border = r === 0 || r === 6 || c === 0 || c === 6;
          const center = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          grid[r0 + r][c0 + c] = border || center;
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);
    let h = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder = (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
        if (!inFinder) {
          h ^= r * 31 + c * 17;
          h = Math.imul(h, 16777619);
          grid[r][c] = (h >>> 0) % 2 === 0;
        }
      }
    }
    return grid;
  }
}
