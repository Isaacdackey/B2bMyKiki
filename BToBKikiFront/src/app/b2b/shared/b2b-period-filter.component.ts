import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export type PeriodeFilterType = 'JOUR' | 'SEMAINE' | 'MOIS' | 'ANNEE' | 'PERSONNALISE';

export interface PeriodeFilterChange {
  periode: PeriodeFilterType;
  dateDebut: string;
  dateFin: string;
}

@Component({
  selector: 'app-b2b-period-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="b2b-period-filter-wrap">
      <div class="b2b-period-pills-shell">
        <div class="b2b-period-pills" role="tablist" aria-label="Filtre de période">
          <button
            type="button"
            class="b2b-period-pill"
            [class.active]="periodeActive() === 'JOUR'"
            (click)="selectionnerPeriode('JOUR')">
            Jour
          </button>
          <button
            type="button"
            class="b2b-period-pill"
            [class.active]="periodeActive() === 'SEMAINE'"
            (click)="selectionnerPeriode('SEMAINE')">
            Semaine
          </button>
          <button
            type="button"
            class="b2b-period-pill"
            [class.active]="periodeActive() === 'MOIS'"
            (click)="selectionnerPeriode('MOIS')">
            Mois
          </button>
          <button
            type="button"
            class="b2b-period-pill"
            [class.active]="periodeActive() === 'ANNEE'"
            (click)="selectionnerPeriode('ANNEE')">
            Année
          </button>
          <button
            type="button"
            class="b2b-period-pill"
            [class.active]="periodeActive() === 'PERSONNALISE'"
            (click)="selectionnerPeriode('PERSONNALISE')">
            <i class="fa-regular fa-calendar-days" aria-hidden="true"></i>
            Personnalisé
          </button>
        </div>
      </div>

      @if (periodeActive() === 'PERSONNALISE') {
        <div class="b2b-custom-date-row">
          <div class="b2b-custom-date-field">
            <label class="b2b-custom-date-label">Du</label>
            <input
              type="date"
              class="b2b-custom-date-input"
              [ngModel]="dateDebut()"
              (ngModelChange)="onDateDebutChange($event)" />
          </div>
          <div class="b2b-custom-date-field">
            <label class="b2b-custom-date-label">Au</label>
            <input
              type="date"
              class="b2b-custom-date-input"
              [ngModel]="dateFin()"
              (ngModelChange)="onDateFinChange($event)" />
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      max-width: 100%;
      min-width: 0;
    }

    .b2b-period-filter-wrap {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.6rem;
      max-width: 100%;
      min-width: 0;
    }

    .b2b-period-pills {
      display: inline-flex;
      align-items: center;
      flex-wrap: nowrap;
      gap: 0.2rem;
      background: #FFFFFF;
      border: 1.5px solid #EDE7DC;
      border-radius: 9999px;
      padding: 0.25rem;
      box-shadow: 0 2px 10px rgba(114, 21, 19, 0.04);
      max-width: 100%;
    }

    .b2b-period-pill {
      border: none;
      background: transparent;
      color: #6E5A56;
      font-family: inherit;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 0.42rem 0.8rem;
      border-radius: 9999px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: background 0.18s ease, color 0.18s ease, transform 0.12s ease, box-shadow 0.18s ease;
      white-space: nowrap;
    }

    .b2b-period-pill:hover:not(.active) {
      background: #FAF5EA;
      color: #721513;
    }

    .b2b-period-pill.active {
      background: #721513;
      color: #FFFFFF;
      box-shadow: 0 4px 12px rgba(114, 21, 19, 0.22);
    }

    .b2b-period-pill:active {
      transform: scale(0.97);
    }

    .b2b-custom-date-row {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.65rem;
      background: #FFFFFF;
      border: 1.5px solid #EDE7DC;
      border-radius: 9999px;
      padding: 0.35rem 0.9rem;
      box-shadow: 0 4px 14px rgba(114, 21, 19, 0.05);
      animation: kikiSlideDownFade 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .b2b-custom-date-field {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .b2b-custom-date-label {
      font-size: 0.75rem;
      font-weight: 800;
      color: #721513;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .b2b-custom-date-input {
      border: 1.5px solid #EDE7DC;
      border-radius: 10px;
      padding: 0.35rem 0.6rem;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: 700;
      color: #2C1810;
      background: #FAF8F4;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease;
    }

    .b2b-custom-date-input:focus {
      border-color: #721513;
      background: #FFFFFF;
      box-shadow: 0 0 0 3px rgba(114, 21, 19, 0.1);
    }

    .b2b-custom-date-sep {
      color: #8C7E74;
      font-weight: 700;
    }

    @keyframes kikiSlideDownFade {
      from {
        opacity: 0;
        transform: translateY(-6px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @media (max-width: 768px) {
      :host {
        width: 100%;
      }
      .b2b-period-filter-wrap {
        align-items: stretch;
        width: 100%;
      }
      .b2b-period-pills-shell {
        position: relative;
        width: 100%;
        max-width: 100%;
      }
      .b2b-period-pills {
        width: 100%;
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        gap: 0.2rem;
        border-radius: 9999px;
        padding: 0.25rem 2rem 0.25rem 0.25rem;
        box-sizing: border-box;
      }
      .b2b-period-pills::-webkit-scrollbar {
        display: none;
      }
      .b2b-period-pills-shell::after {
        content: '›';
        position: absolute;
        top: 2px;
        bottom: 2px;
        right: 2px;
        width: 32px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 10px;
        border-radius: 0 9999px 9999px 0;
        font-size: 1.15rem;
        font-weight: 900;
        line-height: 1;
        color: #721513;
        background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.92) 45%, #FFFFFF 100%);
        pointer-events: none;
      }
      .b2b-period-pill {
        flex-shrink: 0;
        justify-content: center;
        min-height: 40px;
        padding: 0.48rem 0.78rem;
        font-size: 0.78rem;
        border-radius: 9999px;
      }
      .b2b-custom-date-row {
        width: 100%;
        max-width: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        gap: 0.5rem;
        border-radius: 16px;
        padding: 0.6rem 0.7rem;
        box-sizing: border-box;
        overflow: hidden;
      }
      .b2b-custom-date-field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
        width: 100%;
        min-width: 0;
        overflow: hidden;
      }
      .b2b-custom-date-label {
        font-size: 0.7rem;
      }
      .b2b-custom-date-input {
        width: 100%;
        max-width: 100%;
        min-width: 0;
        height: 40px;
        padding: 0.35rem 0.45rem;
        font-size: 0.78rem;
        box-sizing: border-box;
        -webkit-appearance: none;
        appearance: none;
      }
    }
  `]
})
export class B2bPeriodFilterComponent implements OnInit {
  @Input() defaultPeriode: PeriodeFilterType = 'JOUR';
  @Input() referenceDate: string = '';
  @Output() periodChange = new EventEmitter<PeriodeFilterChange>();

  periodeActive = signal<PeriodeFilterType>('JOUR');
  dateDebut = signal<string>('');
  dateFin = signal<string>('');

  ngOnInit(): void {
    this.selectionnerPeriode(this.defaultPeriode, true);
  }

  private getBaseDate(): Date {
    if (this.referenceDate) {
      const parsed = new Date(this.referenceDate + 'T00:00:00');
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }

  private formatIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  selectionnerPeriode(periode: PeriodeFilterType, emit = true): void {
    this.periodeActive.set(periode);
    const base = this.getBaseDate();

    if (periode === 'JOUR') {
      const iso = this.formatIso(base);
      this.dateDebut.set(iso);
      this.dateFin.set(iso);
    } else if (periode === 'SEMAINE') {
      const dayOfWeek = (base.getDay() + 6) % 7;
      const monday = new Date(base);
      monday.setDate(base.getDate() - dayOfWeek);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      this.dateDebut.set(this.formatIso(monday));
      this.dateFin.set(this.formatIso(sunday));
    } else if (periode === 'MOIS') {
      const first = new Date(base.getFullYear(), base.getMonth(), 1);
      const last = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      this.dateDebut.set(this.formatIso(first));
      this.dateFin.set(this.formatIso(last));
    } else if (periode === 'ANNEE') {
      const first = new Date(base.getFullYear(), 0, 1);
      const last = new Date(base.getFullYear(), 11, 31);
      this.dateDebut.set(this.formatIso(first));
      this.dateFin.set(this.formatIso(last));
    } else if (periode === 'PERSONNALISE') {
      if (!this.dateDebut() || !this.dateFin()) {
        const iso = this.formatIso(base);
        this.dateDebut.set(iso);
        this.dateFin.set(iso);
      }
    }

    if (emit) {
      this.emitChange();
    }
  }

  onDateDebutChange(val: string): void {
    this.dateDebut.set(val);
    if (this.dateFin() && val > this.dateFin()) {
      this.dateFin.set(val);
    }
    this.emitChange();
  }

  onDateFinChange(val: string): void {
    this.dateFin.set(val);
    if (this.dateDebut() && val < this.dateDebut()) {
      this.dateDebut.set(val);
    }
    this.emitChange();
  }

  private emitChange(): void {
    this.periodChange.emit({
      periode: this.periodeActive(),
      dateDebut: this.dateDebut(),
      dateFin: this.dateFin()
    });
  }
}
