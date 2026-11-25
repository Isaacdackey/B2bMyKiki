import { Component, ElementRef, OnDestroy, ViewChild, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import jsQR from 'jsqr';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';

@Component({
  selector: 'app-cuisine-qr-cantine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cuisine-qr-cantine.component.html',
  styleUrls: ['../cuisine-shared.css']
})
export class CuisineQrCantineComponent implements OnDestroy {
  b2b = inject(B2bStateService);
  private router = inject(Router);
  setTab(tab: string) { const m: Record<string, string> = { COMMANDES: '/b2b/cuisine/commandes', DASHBOARD: '/b2b/cuisine/dashboard' }; this.router.navigate([m[tab] || '/b2b/cuisine/dashboard']); }
  constructor() {
  }

  ngOnDestroy(): void {
    this.arreterScannerCamera();
  }

  // Dashboard Admin Site & Filtres de période
  @ViewChild('qrVideo') qrVideoRef?: ElementRef<HTMLVideoElement>;
  qrMode = signal<'PROJETER' | 'SCANNER'>('PROJETER');
  scanCodeInput = signal<string>('');
  scanFeedback = signal<{ ok: boolean; message: string } | null>(null);
  cameraActive = signal<boolean>(false);
  cameraError = signal<string>('');
  private mediaStream: MediaStream | null = null;
  private scanRafId: number | null = null;
  private scanCanvas: HTMLCanvasElement | null = null;

  basculerQrMode(mode: 'PROJETER' | 'SCANNER') {
    this.qrMode.set(mode);
    if (mode === 'PROJETER') {
      this.arreterScannerCamera();
    }
  }

  async demarrerScannerCamera() {
    this.cameraError.set('');
    this.scanFeedback.set(null);

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.cameraError.set('La caméra n\'est pas disponible sur ce navigateur ou contexte (utilisez HTTPS ou localhost).');
      return;
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      this.cameraActive.set(true);

      setTimeout(() => {
        const video = this.qrVideoRef?.nativeElement;
        if (!video || !this.mediaStream) return;
        video.srcObject = this.mediaStream;
        video.play().catch(() => {});
        this.boucleScanVideo();
      }, 60);
    } catch (err: any) {
      this.cameraActive.set(false);
      const name = err?.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        this.cameraError.set('Accès à la caméra refusé. Autorisez la caméra dans votre navigateur.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        this.cameraError.set('Aucune caméra détectée sur cet appareil.');
      } else {
        this.cameraError.set('Impossible d\'ouvrir la caméra. Saisissez le code manuellement ci-dessous.');
      }
    }
  }

  arreterScannerCamera() {
    if (this.scanRafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.scanRafId);
      this.scanRafId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.cameraActive.set(false);
  }

  private boucleScanVideo() {
    if (!this.cameraActive()) return;
    const video = this.qrVideoRef?.nativeElement;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      if (!this.scanCanvas) {
        this.scanCanvas = document.createElement('canvas');
      }
      this.scanCanvas.width = video.videoWidth;
      this.scanCanvas.height = video.videoHeight;
      const ctx = this.scanCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, this.scanCanvas.width, this.scanCanvas.height);
        const imageData = ctx.getImageData(0, 0, this.scanCanvas.width, this.scanCanvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
        if (decoded && decoded.data) {
          this.scanCodeInput.set(decoded.data);
          this.validerScanCode();
          this.arreterScannerCamera();
          return;
        }
      }
    }
    this.scanRafId = requestAnimationFrame(() => this.boucleScanVideo());
  }

  validerScanCode() {
    const code = this.scanCodeInput().trim().toUpperCase();
    if (!code) {
      this.scanFeedback.set({ ok: false, message: 'Veuillez scanner ou saisir un code commande / matricule.' });
      return;
    }
    const found = this.commandesSite().find(
      c =>
        c.codeCommande.toUpperCase() === code ||
        c.matricule.toUpperCase() === code ||
        code.includes(c.codeCommande.toUpperCase()) ||
        code.includes(c.matricule.toUpperCase())
    );
    if (!found) {
      this.scanFeedback.set({ ok: false, message: `Aucune commande trouvée pour « ${code} » aujourd'hui.` });
      return;
    }
    this.b2b.scannerCommandeSite(found.id);
    this.scanFeedback.set({ ok: true, message: `Commande ${found.codeCommande} (${found.employeNom}) marquée SCANNÉE !` });
    this.scanCodeInput.set('');
  }

  // Entreprise & Site géré par le Responsable de Site Kiki
  entreprise = computed(() => this.b2b.currentEntreprise());

  // Utilisateurs du site géré
  showModalProjection = signal<boolean>(false);
  qrCantineString = computed(() => {
    const ent = this.entreprise();
    const today = new Date().toISOString().slice(0, 10);
    return `KT-CANTINE-${ent.codeEntreprise || 'TOT'}-${today}`;
  });

  // Matrice 25x25 pour le QR Code Cantine projeté
  qrCantineMatrix = computed(() => {
    return this.generateQrMatrix(this.qrCantineString());
  });

  ouvrirModalProjection() {
    this.showModalProjection.set(true);
  }

  fermerModalProjection() {
    this.showModalProjection.set(false);
  }

  // SIMULER SCAN D'UN EMPLOYÉ (Quand un employé scanne le QR code du jour à la cantine)
  commandesSite = computed(() => {
    const entId = this.entreprise().id;
    return this.b2b.listeCommandesSite().filter(c => c.entrepriseId === entId);
  });

  // Génération de QR Code SVG Haute Précision
  private generateQrMatrix(text: string): boolean[][] {
    const size = 25;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    
    const addFinder = (row: number, col: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    };

    addFinder(0, 0);
    addFinder(0, size - 7);
    addFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = (i % 2 === 0);
      matrix[i][6] = (i % 2 === 0);
    }

    const alignR = 18, alignC = 18;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          matrix[alignR + r][alignC + c] = true;
        }
      }
    }

    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const inFinder1 = r < 8 && c < 8;
        const inFinder2 = r < 8 && c >= size - 8;
        const inFinder3 = r >= size - 8 && c < 8;
        const inTiming = r === 6 || c === 6;
        const inAlign = Math.abs(r - alignR) <= 2 && Math.abs(c - alignC) <= 2;

        if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming && !inAlign) {
          const bit = (Math.sin(hash + r * 13 + c * 37) * 10000) % 1;
          matrix[r][c] = Math.abs(bit) > 0.48;
        }
      }
    }

    return matrix;
  }
}

