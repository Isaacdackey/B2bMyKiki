import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { GestionnaireDataService } from '../../services/gestionnaire-data.service';
import { KikiDataService } from '../../../services/kiki-data.service';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent implements OnInit {
  events: any[] = [];
  staff: any[] = [];

  calendarView = 'Mois';
  currentCalendarDate: Date = new Date();
  currentCalendarMonth = '';
  calendarPrestationFilter = 'ALL';
  calendarClientFilter = '';
  calendarResourceFilter = 'ALL';
  calendarStaffFilter = '';
  eventListPage = 1;
  eventListPageSize = 10;

  // — Google Sync —
  syncStatus = "Connecté (Dernière sync : Aujourd'hui à 11h15)";
  synchroEnCours = false;

  showEventDetailsModal = false;
  selectedDetailEvent: any = null;
  showCreateEventModal = false;
  isEventFromDevis = false;
  selectedClientForEvent: any = null;
  selectedStaffIdsForEvent: string[] = [];
  selectedStaffListForEvent: any[] = [];
  clientSearchQuery = '';
  staffSearchQuery = '';
  eventForm: any = {
    title: '', type: 'salle-diva', date: new Date().toISOString().split('T')[0],
    time: '19:00', guests: 100, location: 'Salle La Diva, Dakar',
    signatureGastronomique: 'Menu Signature Kiki Traiteur', requestId: ''
  };

  triggerGoogleSync(): void {
    this.synchroEnCours = true;
    setTimeout(() => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      this.syncStatus = `Synchronisé à l'instant (${timeStr})`;
      this.synchroEnCours = false;
      this.dataService.showToast('Google Agenda synchronisé avec les réceptions Kiki Traiteur.');
    }, 600);
  }

  constructor(
    public gData: GestionnaireDataService, 
    private dataService: KikiDataService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.gData.loadAll();
    this.gData.events$.subscribe(e => this.events = e);
    this.gData.staff$.subscribe(s => this.staff = s);
    this.currentCalendarMonth = this.getCalendarHeaderLabel();

    this.route.queryParams.subscribe(params => {
      if (params['create'] === 'true') {
        this.openCreateEventModal();
        // Clear the param so it doesn't reopen on refresh
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { create: null },
          queryParamsHandling: 'merge'
        });
      }
    });
  }

  // --- CALENDAR HELPERS ---
  getMonthNameFr(m: number): string {
    return ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][m] || '';
  }

  getCalendarHeaderLabel(): string {
    const y = this.currentCalendarDate.getFullYear();
    const m = this.currentCalendarDate.getMonth();
    const mName = this.getMonthNameFr(m);
    if (this.calendarView === 'Mois' || this.calendarView === 'Événements') return `${mName} ${y}`;
    if (this.calendarView === 'Semaine') {
      const d = new Date(this.currentCalendarDate);
      const dow = (d.getDay() + 6) % 7;
      const start = new Date(d); start.setDate(d.getDate() - dow);
      const end = new Date(start); end.setDate(start.getDate() + 6);
      if (start.getMonth() === end.getMonth()) return `${start.getDate()} - ${end.getDate()} ${this.getMonthNameFr(end.getMonth()).toLowerCase()} ${end.getFullYear()}`;
      return `${start.getDate()} ${this.getMonthNameFr(start.getMonth()).toLowerCase()} - ${end.getDate()} ${this.getMonthNameFr(end.getMonth()).toLowerCase()} ${end.getFullYear()}`;
    }
    if (this.calendarView === 'Jour') return `${this.currentCalendarDate.getDate()} ${mName.toLowerCase()} ${y}`;
    return `${mName} ${y}`;
  }

  prevCalendarMonth(): void {
    if (this.calendarView === 'Mois' || this.calendarView === 'Événements') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() - 1, 1);
    } else if (this.calendarView === 'Semaine') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() - 7);
    } else {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() - 1);
    }
    this.currentCalendarMonth = this.getCalendarHeaderLabel();
  }

  nextCalendarMonth(): void {
    if (this.calendarView === 'Mois' || this.calendarView === 'Événements') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth() + 1, 1);
    } else if (this.calendarView === 'Semaine') {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() + 7);
    } else {
      this.currentCalendarDate = new Date(this.currentCalendarDate.getFullYear(), this.currentCalendarDate.getMonth(), this.currentCalendarDate.getDate() + 1);
    }
    this.currentCalendarMonth = this.getCalendarHeaderLabel();
  }

  getFilteredEventsForCalendar(): any[] {
    let list = [...this.events];
    if (this.calendarPrestationFilter !== 'ALL') list = list.filter(e => e.type === this.calendarPrestationFilter);
    if (this.calendarClientFilter.trim()) {
      const q = this.calendarClientFilter.toLowerCase();
      list = list.filter(e => (e.clientName || '').toLowerCase().includes(q));
    }
    if (this.calendarStaffFilter.trim()) {
      const q = this.calendarStaffFilter.toLowerCase();
      list = list.filter(e => e.staffIds?.some((id: string) => this.gData.getStaffName(id).toLowerCase().includes(q)));
    }
    return list;
  }

  getCalendarGridDays(): any[] {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let startDOW = (firstDay.getDay() + 6) % 7;
    const days: any[] = [];
    const prevDays = new Date(year, month, 0).getDate();
    for (let i = startDOW - 1; i >= 0; i--) days.push({ dayNumber: prevDays - i, isCurrentMonth: false, events: [] });
    for (let i = 1; i <= daysInMonth; i++) {
      const mm = (month + 1) < 10 ? '0' + (month + 1) : '' + (month + 1);
      const dd = i < 10 ? '0' + i : '' + i;
      days.push({ dayNumber: i, isCurrentMonth: true, events: this.getFilteredEventsForCalendar().filter(e => e.date === `${year}-${mm}-${dd}`) });
    }
    const total = Math.ceil(days.length / 7) * 7;
    let n = 1;
    while (days.length < total) days.push({ dayNumber: n++, isCurrentMonth: false, events: [] });
    return days;
  }

  getCalendarWeekDays(): any[] {
    const d = new Date(this.currentCalendarDate);
    const dow = (d.getDay() + 6) % 7;
    const start = new Date(d); start.setDate(d.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const cur = new Date(start); cur.setDate(start.getDate() + i);
      const yy = cur.getFullYear(), mm = (cur.getMonth() + 1) < 10 ? '0' + (cur.getMonth() + 1) : '' + (cur.getMonth() + 1), dd = cur.getDate() < 10 ? '0' + cur.getDate() : '' + cur.getDate();
      return { dayNumber: cur.getDate(), events: this.getFilteredEventsForCalendar().filter(e => e.date === `${yy}-${mm}-${dd}`) };
    });
  }

  getCalendarDayView(): any {
    const cur = this.currentCalendarDate;
    const yy = cur.getFullYear(), mm = (cur.getMonth() + 1) < 10 ? '0' + (cur.getMonth() + 1) : '' + (cur.getMonth() + 1), dd = cur.getDate() < 10 ? '0' + cur.getDate() : '' + cur.getDate();
    return { dayNumber: cur.getDate(), events: this.getFilteredEventsForCalendar().filter(e => e.date === `${yy}-${mm}-${dd}`) };
  }

  getEventsForPage(): any[] {
    const list = this.getFilteredEventsForCalendar();
    const start = (this.eventListPage - 1) * this.eventListPageSize;
    return list.slice(start, start + this.eventListPageSize);
  }

  getEventTotalPages(): number { return Math.max(1, Math.ceil(this.getFilteredEventsForCalendar().length / this.eventListPageSize)); }
  getEventPageArray(): (number | string)[] {
    return this.getPaginationArray(this.eventListPage, this.getEventTotalPages());
  }

  getEventCardMonth(dateStr: string): string {
    if (!dateStr) return 'JUIL.';
    const m = parseInt(dateStr.split('-')[1], 10) - 1;
    return ['JANV.','FÉVR.','MARS.','AVR.','MAI.','JUIN.','JUIL.','AOÛT.','SEPT.','OCT.','NOV.','DÉC.'][m] || 'JUIL.';
  }
  getEventCardDay(dateStr: string): string { return dateStr ? '' + parseInt(dateStr.split('-')[2], 10) : '19'; }

  getEndTime(time: string): string {
    if (!time) return '23:00';
    const parts = time.split(':'); let h = (parseInt(parts[0], 10) + 4) % 24;
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

  openEventDetailsModal(ev: any): void { this.selectedDetailEvent = ev; this.showEventDetailsModal = true; }
  closeEventDetailsModal(): void { this.showEventDetailsModal = false; this.selectedDetailEvent = null; }

  openCreateEventModal(): void {
    this.isEventFromDevis = false;
    this.selectedClientForEvent = null;
    this.selectedStaffIdsForEvent = [];
    this.selectedStaffListForEvent = [];
    this.eventForm = { title: '', type: 'salle-diva', date: new Date().toISOString().split('T')[0], time: '19:00', guests: 100, location: 'Salle La Diva, Dakar', signatureGastronomique: 'Menu Signature Kiki Traiteur', requestId: '' };
    this.showCreateEventModal = true;
  }
  closeCreateEventModal(): void { this.showCreateEventModal = false; }

  submitCreateEvent(): void {
    if (!this.selectedClientForEvent) { this.dataService.showToast('Veuillez sélectionner un client.', true); return; }
    this.dataService.addEvent({ ...this.eventForm, clientId: this.selectedClientForEvent.id, clientName: this.selectedClientForEvent.name, staffIds: this.selectedStaffIdsForEvent });
    this.dataService.showToast('Événement ajouté au calendrier !');
    this.showCreateEventModal = false;
    this.gData.loadAll();
  }

  getFilteredClients(): any[] { const q = this.clientSearchQuery.toLowerCase(); return q ? this.gData.clients.filter(c => c.name?.toLowerCase().includes(q)) : this.gData.clients.slice(0, 5); }
  selectClientForEvent(c: any): void { this.selectedClientForEvent = c; this.clientSearchQuery = ''; }
  removeSelectedClient(): void { this.selectedClientForEvent = null; }
  getFilteredStaffForSearch(): any[] { const q = this.staffSearchQuery.toLowerCase(); return this.staff.filter(s => !this.selectedStaffIdsForEvent.includes(s.id) && (!q || s.name.toLowerCase().includes(q) || s.role.toLowerCase().includes(q))); }
  addStaffToEvent(s: any): void { if (!this.selectedStaffIdsForEvent.includes(s.id)) { this.selectedStaffIdsForEvent.push(s.id); this.selectedStaffListForEvent.push(s); } this.staffSearchQuery = ''; }
  removeStaffFromEvent(id: string): void { this.selectedStaffIdsForEvent = this.selectedStaffIdsForEvent.filter(i => i !== id); this.selectedStaffListForEvent = this.selectedStaffListForEvent.filter(s => s.id !== id); }

  getStaffName = (id: string) => this.gData.getStaffName(id);
  getStaffRole = (id: string) => this.gData.getStaffRole(id);
  getClientType = (id: string) => this.gData.getClientType(id);
  getClientName = (id: string) => this.gData.getClientName(id);
  getClientEmail = (id: string) => this.gData.getClientEmail(id);
  getClientPhone = (id: string) => this.gData.getClientPhone(id);
  getClientOrg = (id: string) => this.gData.getClientOrg(id);
  getPrestationName = (id: string) => this.gData.getPrestationName(id);
  formatDate = (d: string) => this.gData.formatDate(d);

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
