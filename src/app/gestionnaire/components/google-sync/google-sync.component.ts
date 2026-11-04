import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KikiDataService } from '../../../services/kiki-data.service';

@Component({
  selector: 'app-google-sync',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './google-sync.component.html'
})
export class GoogleSyncComponent implements OnInit {
  syncStatus = "Connecté (Dernière sync : Aujourd'hui à 11h15)";

  constructor(private dataService: KikiDataService) {}

  ngOnInit(): void {}

  triggerSync(): void {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.syncStatus = `Synchronisé à l'instant (${timeStr})`;
    this.dataService.showToast('Google Agenda synchronisé avec les réceptions Kiki Traiteur.');
  }
}
