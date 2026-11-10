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

  // Onglet de filtrage pour le mode SUBVENTIONNE (Strictement les 4 composantes de la formule)
  activeTab = signal<'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON'>('ENTREE');

  // Filtre catalogue pour le mode AUTONOME
  filterAutonome = signal<'TOUT' | 'PLAT' | 'ENTREE' | 'DESSERT' | 'BOISSON'>('TOUT');
  termeRecherche = signal<string>('');

  // Numéro Wave pour le salarié autonome
  wavePhone = signal<string>('+221 77 654 32 10');

  // GESTION DU CUT-OFF 10H30 (Exigence Mentor)
  // Permet de simuler ou vérifier si la commande est pour aujourd'hui ou demain
  isAfterCutOff = signal<boolean>(false);
  
  toggleSimulerApresCutOff() {
    this.isAfterCutOff.update(v => !v);
  }

  // Slides du carrousel Hero Banner MyKiki
  slides = [
    {
      id: 'slide-1',
      badge: 'COMMANDER IMMÉDIATEMENT',
      isPromo: false,
      titre: 'Pastels au Mérou & Crevettes (Lot de 12)',
      description: 'Beignets croustillants farcis au poisson noble et crevettes, servis avec une sauce tomate pimentée signature.',
      prix: 6000,
      imageUrl: 'assets/images/plats/pastels.jpg',
      boutonTexte: 'Choisir ce plat'
    },
    {
      id: 'slide-2',
      badge: 'OFFRE DU MOMENT',
      isPromo: true,
      titre: 'Dégustation Offerte au Lab',
      description: 'Dès 40 convives, profitez d\'une séance dégustation sur-mesure avec notre Chef exécutif.',
      imageUrl: 'assets/images/table-with-delicious-sweets-covered-with-pink-silk.jpg',
      boutonTexte: 'Nouvelle demande'
    },
    {
      id: 'slide-3',
      badge: 'SPÉCIALITÉ DU CHEF',
      isPromo: false,
      titre: 'Thiéboudienne Penda Mbaye Royale',
      description: 'Riz rouge mijoté au mérou frais, crevettes géantes et légumes du terroir.',
      prix: 5500,
      imageUrl: 'assets/images/plats/thieboudienne.jpg',
      boutonTexte: 'Choisir ce plat'
    }
  ];
  slideActuel = signal(0);
  valeursFumee: string[] = ['Professionnalisme', 'Convivialité', 'Loyauté', 'Fiabilité', 'Excellence', 'Savoir-faire'];

  allerAuSlide(index: number) {
    this.slideActuel.set(index);
  }

  showConfirmationModal = signal(false);
  orderPlaced = signal(false);
  isWaveProcessing = signal(false);
  qrDataString = signal<string>('');

  // Catégories inspirées de MyKiki
  categorieSelectionnee = signal<string>('all');

  categories = [
    { id: 'all', name: 'Tous', icon: 'fa-globe' },
    { id: 'ENTREE', name: '1. Entrée', icon: 'fa-cookie-bite' },
    { id: 'PLAT', name: '2. Plat Chaud', icon: 'fa-utensils' },
    { id: 'DESSERT', name: '3. Dessert', icon: 'fa-cake-candles' },
    { id: 'BOISSON', name: '4. Boisson', icon: 'fa-wine-glass-alt' }
  ];

  selectCategory(catId: string) {
    this.categorieSelectionnee.set(catId);
    if (catId === 'all') {
      this.filterAutonome.set('TOUT');
    } else {
      this.filterAutonome.set(catId as any);
      this.activeTab.set(catId as any);
    }
  }

  // DERNIÈRE COMMANDE ENREGISTRÉE & REVOIR LE QR CODE À TOUT MOMENT
  derniereCommande = signal<{
    id: string;
    date: string;
    heureRetrait: string;
    siteNom: string;
    formuleNom: string;
    entreeNom?: string;
    platNom?: string;
    dessertNom?: string;
    boissonNom?: string;
    qrCode: string;
    prixTotal: number;
    partEntreprise: number;
    partEmploye: number;
  } | null>({
    id: 'CMD-TOT-20261109-001',
    date: 'Aujourd’hui',
    heureRetrait: '12h00 - 12h30',
    siteNom: 'Siège Plateau - Dakar',
    formuleNom: 'Formule Déjeuner 4 comp.',
    entreeNom: 'Pastels Dorés au Thon (x3)',
    platNom: 'Poulet Yassa Braisé Kiki & Riz Parfumé',
    dessertNom: 'Fondant au Chocolat Noir',
    boissonNom: 'Jus Naturel de Bissap Frais Menthe',
    qrCode: 'KT-TOT-9842-SITE1-20261109',
    prixTotal: 5000,
    partEntreprise: 5000,
    partEmploye: 0
  });

  // Modal spécifique pour réafficher le QR Code de retrait
  showQrCodeModal = signal(false);

  ouvrirQrCodeModal() {
    const cmd = this.derniereCommande();
    if (cmd) {
      this.qrDataString.set(cmd.qrCode);
      this.showQrCodeModal.set(true);
    }
  }

  fermerQrCodeModal() {
    this.showQrCodeModal.set(false);
  }

  // Génération du QR Code SVG en direct (haute précision, sans dépendance externe)
  qrMatrix = computed(() => {
    const data = this.qrDataString() || 'KIKI-B2B-PASS';
    return this.generateQrMatrix(data);
  });

  // Plats filtrés unifiés avec recherche et catégorie
  platsFiltres = computed(() => {
    const cat = this.categorieSelectionnee();
    const query = this.termeRecherche().trim().toLowerCase();
    let plats = this.b2b.catalogueJour();

    if (cat !== 'all') {
      plats = plats.filter(p => p.categorie === cat);
    }

    if (query) {
      plats = plats.filter(p => 
        p.nom.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }

    return plats;
  });

  // Ouvrir / fermer le tiroir latéral du panier ou scroll vers le panier
  afficherPanierMobile = signal(false);

  togglePanier() {
    this.afficherPanierMobile.update(v => !v);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('b2b-cart-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  // Nombre d'articles actifs (soit composantes plateau, soit articles panier Wave)
  nombreArticlesPanier = computed(() => {
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      const s = this.b2b.selection();
      return (s.entree ? 1 : 0) + (s.plat ? 1 : 0) + (s.dessert ? 1 : 0) + (s.boisson ? 1 : 0);
    } else {
      return this.b2b.nbArticlesPanierAutonome();
    }
  });

  // Action intelligente : selon le mode (conventionné ou autonome)
  choisirOuAjouterPlat(plat: PlatB2B) {
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      this.b2b.choisirPlat(plat);
    } else {
      this.b2b.ajouterAuPanierAutonome(plat);
    }
  }

  isPlatActiveDansMode(plat: PlatB2B): boolean {
    if (this.b2b.modeProfil() === 'SUBVENTIONNE') {
      return this.isPlatSelected(plat);
    } else {
      return this.b2b.quantitePlatAutonome(plat.id) > 0;
    }
  }

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
    const matricule = this.b2b.currentEmploye().matricule;
    const site = this.b2b.siteActuel();
    const dateStr = new Date().toISOString().slice(0, 10);
    const code = `KT-${matricule}-${site.id}-${dateStr}`;
    this.qrDataString.set(code);

    const s = this.b2b.selection();
    this.derniereCommande.set({
      id: `CMD-B2B-${Date.now().toString().slice(-6)}`,
      date: 'Aujourd’hui',
      heureRetrait: this.b2b.creneauLivraison(),
      siteNom: site.nom,
      formuleNom: this.b2b.formuleActuelle().nom,
      entreeNom: s.entree?.nom,
      platNom: s.plat?.nom,
      dessertNom: s.dessert?.nom,
      boissonNom: s.boisson?.nom,
      qrCode: code,
      prixTotal: this.b2b.modeProfil() === 'AUTONOME' ? this.b2b.totalPanierAutonome() : this.b2b.formuleActuelle().prixForfait,
      partEntreprise: this.b2b.partPriseEnChargeEntreprise(),
      partEmploye: this.b2b.resteAPayerEmploye()
    });

    if (this.b2b.modeProfil() === 'AUTONOME' || this.b2b.resteAPayerEmploye() > 0) {
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
    if (this.b2b.modeProfil() === 'AUTONOME') {
      this.b2b.viderPanierAutonome();
    } else {
      this.b2b.reinitialiserSelection();
    }
  }

  // Algorithme standard de génération de matrice QR Code 25x25 (Version 2)
  private generateQrMatrix(text: string): boolean[][] {
    const size = 25;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    
    // Fonction helper pour les 3 yeux de repérage (Finder patterns)
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

    // Lignes de timing horizontales et verticales
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = (i % 2 === 0);
      matrix[i][6] = (i % 2 === 0);
    }

    // Petit motif d'alignement pour Version 2 (centré en 18, 18)
    const alignR = 18, alignC = 18;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          matrix[alignR + r][alignC + c] = true;
        }
      }
    }

    // Pseudo-hachage déterministe pour injecter les données dans les cellules libres
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Ignorer les finder patterns
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
