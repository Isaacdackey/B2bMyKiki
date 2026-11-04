import { B2bNavComponent } from '../shared/b2b-nav.component';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { PlatB2B } from '../shared/b2b.models';

@Component({
  selector: 'app-b2b-commande',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent],
  templateUrl: './b2b-commande.component.html',
  styleUrls: ['./b2b-commande.component.css']
})
export class B2bCommandeComponent {
  b2b = inject(B2bStateService);

  // Onglet de filtrage pour le mode SUBVENTIONNE
  activeTab = signal<'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON' | 'SUPPLEMENT'>('ENTREE');

  // Filtre catalogue pour le mode AUTONOME
  filterAutonome = signal<'TOUT' | 'PLAT' | 'ENTREE' | 'DESSERT' | 'BOISSON'>('TOUT');
  termeRecherche = signal<string>('');

  // Numéro Wave pour le salarié autonome
  wavePhone = signal<string>('+221 77 654 32 10');

  // Modal de confirmation / checkout
  showConfirmationModal = signal(false);
  orderPlaced = signal(false);
  isWaveProcessing = signal(false);

  // Liste des plats filtrés pour l'onglet actif (Mode Subventionné)
  activePlats = computed(() => {
    const tab = this.activeTab();
    if (tab === 'SUPPLEMENT') return [];
    return this.b2b.catalogueJour().filter(p => p.categorie === tab);
  });

  // Liste des plats filtrés (Mode Autonome)
  platsAutonome = computed(() => {
    const filter = this.filterAutonome();
    const query = this.termeRecherche().trim().toLowerCase();
    let plats = this.b2b.catalogueJour();

    if (filter !== 'TOUT') {
      plats = plats.filter(p => p.categorie === filter);
    }

    if (query) {
      plats = plats.filter(p => 
        p.nom.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    return plats;
  });

  isPlatSelected(plat: PlatB2B): boolean {
    const s = this.b2b.selection();
    if (plat.categorie === 'ENTREE') return s.entree?.id === plat.id;
    if (plat.categorie === 'PLAT') return s.plat?.id === plat.id;
    if (plat.categorie === 'DESSERT') return s.dessert?.id === plat.id;
    if (plat.categorie === 'BOISSON') return s.boisson?.id === plat.id;
    return false;
  }

  validerCommande() {
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      if (!this.b2b.isFormuleComplete()) return;
    } else {
      if (this.b2b.panierAutonome().length === 0) return;
    }
    this.showConfirmationModal.set(true);
  }

  confirmerPaiementEtEnvoi() {
    if (this.b2b.modeProfil() === 'AUTONOME' || this.b2b.resteAPayerEmploye() > 0) {
      this.isWaveProcessing.set(true);
      setTimeout(() => {
        this.isWaveProcessing.set(false);
        this.orderPlaced.set(true);
        setTimeout(() => {
          this.showConfirmationModal.set(false);
          this.orderPlaced.set(false);
          this.b2b.viderPanierAutonome();
          this.b2b.reinitialiserSelection();
        }, 3500);
      }, 1500);
    } else {
      this.orderPlaced.set(true);
      setTimeout(() => {
        this.showConfirmationModal.set(false);
        this.orderPlaced.set(false);
        this.b2b.reinitialiserSelection();
      }, 3500);
    }
  }
}
