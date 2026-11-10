import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { B2bStateService } from '../shared/b2b-state.service';
import { B2bNavComponent } from '../shared/b2b-nav.component';

@Component({
  selector: 'app-b2b-panier',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, B2bNavComponent],
  templateUrl: './b2b-panier.component.html',
  styleUrls: ['./b2b-panier.component.css']
})
export class B2bPanierComponent {
  b2b = inject(B2bStateService);
  router = inject(Router);

  showConfirmationModal = signal(false);
  orderPlaced = signal(false);
  isWaveProcessing = signal(false);
  wavePhone = signal<string>('+221 77 654 32 10');
  qrDataString = signal<string>('');

  validerCommande() {
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      if (!this.b2b.isFormuleComplete()) return;
    } else {
      if (this.b2b.panierAutonome().length === 0) return;
    }
    this.showConfirmationModal.set(true);
  }

  confirmerPaiementEtEnvoi() {
    const matricule = this.b2b.currentEmploye().matricule;
    const site = this.b2b.siteActuel();
    const dateStr = new Date().toISOString().slice(0, 10);
    const code = `KT-${matricule}-${site.id}-${dateStr}`;
    this.qrDataString.set(code);

    if (this.b2b.modeProfil() === 'AUTONOME') {
      this.isWaveProcessing.set(true);
      setTimeout(() => {
        this.isWaveProcessing.set(false);
        this.orderPlaced.set(true);
      }, 1500);
    } else {
      this.orderPlaced.set(true);
    }
  }

  fermerModalSucces() {
    this.showConfirmationModal.set(false);
    this.orderPlaced.set(false);
    this.router.navigate(['/b2b/commande']);
  }

  qrMatrix = computed(() => {
    const data = this.qrDataString() || 'KIKI-B2B-PASS';
    return this.generateQrMatrix(data);
  });

  private generateQrMatrix(data: string): boolean[][] {
    const size = 25;
    const matrix: boolean[][] = Array(size).fill(false).map(() => Array(size).fill(false));

    const drawFinder = (startX: number, startY: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[startY + r][startX + c] = true;
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(size - 7, 0);
    drawFinder(0, size - 7);

    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash |= 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8)) continue;
        if (r === 6 || c === 6) continue;
        const pseudoRandom = Math.sin(hash++ + r * 13 + c * 37);
        matrix[r][c] = (pseudoRandom - Math.floor(pseudoRandom)) > 0.52;
      }
    }

    return matrix;
  }
}

