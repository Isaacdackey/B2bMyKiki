import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of, catchError } from 'rxjs';
import { GestionnaireApiService, ConfigurationFideliteDto, ProduitDto } from '../../../services/gestionnaire-api.service';
import { KikiDataService } from '../../../services/kiki-data.service';

@Component({
  selector: 'app-fidelite-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fidelite.component.html',
  styleUrl: './fidelite.component.css'
})
export class FideliteComponent implements OnInit {
  chargementMets = true;
  enregistrement = false;
  recherchePlat = '';
  categorieActive = 'TOUTES';
  afficherUniquementSelectionnes = false;

  config: ConfigurationFideliteDto = {
    pointsBienvenue: 100,
    seuilMontantPanier: 5000,
    pointsGagnesParSeuil: 10,
    pointsRequisBonus: 500,
    descriptionBonus: 'Plat ou cocktail signature offert dès 500 points atteints.',
    produitIdsBonus: [],
    pointsAvisClient: 20,
    delaiApparitionAvisHeures: 0,
    dureeValiditeAvisJours: 7
  };

  produitsDisponibles: ProduitDto[] = [];

  constructor(
    private api: GestionnaireApiService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerDonnees();
  }

  chargerDonnees(): void {
    // 1. Récupération de la configuration fidélité
    this.api.getFideliteConfig().pipe(catchError(() => of(null))).subscribe({
      next: (cfg) => {
        if (cfg) {
          this.config = {
            ...this.config,
            ...cfg,
            produitIdsBonus: cfg.produitIdsBonus || (cfg.produitsBonus ? cfg.produitsBonus.map((p: any) => p.id) : ((cfg as any).produitsBonusIds ? (cfg as any).produitsBonusIds.split(',').filter((x: string) => !!x).map((x: string) => Number(x)) : []))
          };
        }
        this.cdr.detectChanges();
      }
    });

    // 2. Récupération des mets (carte 5 uniquement)
    this.chargementMets = true;
    this.api.getProduits().pipe(catchError(() => of([]))).subscribe({
      next: (prods) => {
        this.produitsDisponibles = (prods || []).filter((p: any) => !p.archive);
        this.chargementMets = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.chargementMets = false;
        this.cdr.detectChanges();
      }
    });
  }

  get categoriesDisponibles(): { nom: string; count: number }[] {
    const map = new Map<string, number>();
    for (const p of this.produitsDisponibles) {
      const cat = p.categorieNom || 'Non classé';
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.entries()).map(([nom, count]) => ({ nom, count }));
  }

  get produitsFiltres(): ProduitDto[] {
    let list = this.produitsDisponibles;

    // Filtre par sélectionnés uniquement
    if (this.afficherUniquementSelectionnes) {
      const selectionnesIds = this.config.produitIdsBonus || [];
      list = list.filter(p => selectionnesIds.includes(p.id));
    }

    // Filtre par catégorie
    if (this.categorieActive !== 'TOUTES') {
      list = list.filter(p => (p.categorieNom || 'Non classé') === this.categorieActive);
    }

    // Filtre par recherche texte
    if (this.recherchePlat.trim()) {
      const q = this.recherchePlat.toLowerCase().trim();
      list = list.filter(p => 
        (p.nom && p.nom.toLowerCase().includes(q)) || 
        (p.categorieNom && p.categorieNom.toLowerCase().includes(q))
      );
    }

    return list;
  }

  getPointsPourMontant(montant: number): number {
    const seuil = this.config.seuilMontantPanier || 5000;
    const pts = this.config.pointsGagnesParSeuil || 10;
    const tranches = Math.floor(montant / seuil);
    return tranches * pts;
  }

  estProduitBonus(produitId: number): boolean {
    return !!(this.config.produitIdsBonus && this.config.produitIdsBonus.includes(produitId));
  }

  toggleProduitBonus(produitId: number): void {
    if (!this.config.produitIdsBonus) {
      this.config.produitIdsBonus = [];
    }
    const idx = this.config.produitIdsBonus.indexOf(produitId);
    if (idx >= 0) {
      this.config.produitIdsBonus.splice(idx, 1);
    } else {
      this.config.produitIdsBonus.push(produitId);
    }
  }

  sauvegarder(): void {
    this.enregistrement = true;
    if (this.config.produitIdsBonus) {
      (this.config as any).produitsBonusIds = this.config.produitIdsBonus.join(',');
    }
    this.api.updateFideliteConfig(this.config).subscribe({
      next: (maj) => {
        this.enregistrement = false;
        this.config = {
          ...maj,
          produitIdsBonus: maj.produitIdsBonus || (maj.produitsBonus ? maj.produitsBonus.map(p => p.id) : ((maj as any).produitsBonusIds ? (maj as any).produitsBonusIds.split(',').filter((x: string) => !!x).map((x: string) => Number(x)) : []))
        };
        this.dataService.showToast('Paramètres de fidélité mis à jour avec succès !');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.enregistrement = false;
        this.dataService.showToast(err.error?.message || 'Erreur lors de la mise à jour des paramètres de fidélité.', true);
        this.cdr.detectChanges();
      }
    });
  }
}
