import { Component, OnInit, ViewEncapsulation, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { GestionnaireApiService, CategorieDto, ProduitDto } from '../../../services/gestionnaire-api.service';
import { CloudinaryService } from '../../../services/cloudinary.service';
import { KikiDataService } from '../../../services/kiki-data.service';

/** Choix de délai proposés, en heures — le métier raisonne en jours ou en heures. */
interface OptionDelai { valeur: number; libelle: string; }

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalogue.component.html',
  styleUrl: './catalogue.component.css'
})
export class CatalogueComponent implements OnInit {

  onglet: 'produits' | 'categories' = 'produits';

  categories: CategorieDto[] = [];
  produits: ProduitDto[] = [];
  chargement = false;

  filtreCategorie: number | 'TOUTES' = 'TOUTES';
  afficherArchives = false;
  recherche = '';

  readonly delais: OptionDelai[] = [
    { valeur: 0,  libelle: 'Immédiat' },
    { valeur: 1,  libelle: '1 heure' },
    { valeur: 2,  libelle: '2 heures' },
    { valeur: 4,  libelle: '4 heures' },
    { valeur: 12, libelle: '12 heures' },
    { valeur: 24, libelle: '1 jour' },
    { valeur: 48, libelle: '2 jours' },
    { valeur: 72, libelle: '3 jours' },
    { valeur: 168, libelle: '1 semaine' }
  ];

  // — Formulaire produit —
  modaleProduit = false;
  produitEnCours: Partial<ProduitDto> = {};
  modeEditionProduit = false;
  enregistrementProduit = false;
  televersementImage = false;
  nomFichierPhotoChoisi = '';
  afficherChampUrl = false;
  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  // — Détails produit (œil) —
  modaleDetailsProduit = false;
  produitDetails: ProduitDto | null = null;

  // — Pagination —
  pageProduits = 1;
  taillePage = 10;
  Math = Math;

  // — Formulaire catégorie —
  modaleCategorie = false;
  categorieEnCours: Partial<CategorieDto> = {};
  modeEditionCategorie = false;
  enregistrementCategorie = false;

  // — Confirmation d'archivage —
  modaleArchivage = false;
  cibleArchivage: { type: 'produit' | 'categorie'; item: any; archiver: boolean } | null = null;
  archivageEnCours = false;

  constructor(
    private api: GestionnaireApiService,
    private cloudinaryService: CloudinaryService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerTout();
  }

  chargerTout(): void {
    this.chargement = true;
    this.api.getCategories(true).subscribe({
      next: (cats) => {
        this.categories = cats || [];
        this.api.getProduits().subscribe({
          next: (prods) => {
            this.produits = prods || [];
            this.chargement = false;
            this.cdr.detectChanges();
          },
          error: () => this.echecChargement()
        });
      },
      error: () => this.echecChargement()
    });
  }

  private echecChargement(): void {
    this.chargement = false;
    this.dataService.showToast('Impossible de charger le catalogue.', true);
    this.cdr.detectChanges();
  }

  // =============================================
  // AFFICHAGE & PAGINATION
  // =============================================

  get categoriesActives(): CategorieDto[] {
    return this.categories.filter(c => !c.archivee);
  }

  get categoriesAffichees(): CategorieDto[] {
    return this.afficherArchives ? this.categories : this.categoriesActives;
  }

  get produitsAffiches(): ProduitDto[] {
    const q = this.recherche.trim().toLowerCase();
    const liste = this.produits.filter(p => {
      if (!this.afficherArchives && p.archive) return false;
      if (this.filtreCategorie !== 'TOUTES' && p.categorieId !== this.filtreCategorie) return false;
      if (q) {
        return (p.nom || '').toLowerCase().includes(q)
            || (p.description || '').toLowerCase().includes(q);
      }
      return true;
    });

    // Tri alphabétique (A-Z) par nom du produit
    return liste.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr', { sensitivity: 'base' }));
  }

  get totalPagesProduits(): number {
    return Math.ceil(this.produitsAffiches.length / this.taillePage) || 1;
  }

  get produitsPageCourante(): ProduitDto[] {
    const debut = (this.pageProduits - 1) * this.taillePage;
    return this.produitsAffiches.slice(debut, debut + this.taillePage);
  }

  get listePages(): number[] {
    const total = this.totalPagesProduits;
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  allerPage(page: number): void {
    if (page >= 1 && page <= this.totalPagesProduits) {
      this.pageProduits = page;
      this.cdr.detectChanges();
    }
  }

  pagePrecedente(): void {
    if (this.pageProduits > 1) {
      this.pageProduits--;
      this.cdr.detectChanges();
    }
  }

  pageSuivante(): void {
    if (this.pageProduits < this.totalPagesProduits) {
      this.pageProduits++;
      this.cdr.detectChanges();
    }
  }

  libelleDelai(heures: number): string {
    const connu = this.delais.find(d => d.valeur === heures);
    if (connu) return connu.libelle;
    if (heures < 24) return `${heures} h`;
    return `${Math.round(heures / 24)} j`;
  }

  // =============================================
  // DÉTAILS PRODUIT
  // =============================================

  ouvrirDetailsProduit(p: ProduitDto, event?: Event): void {
    event?.stopPropagation();
    this.produitDetails = p;
    this.modaleDetailsProduit = true;
  }

  fermerDetailsProduit(): void {
    this.modaleDetailsProduit = false;
    this.produitDetails = null;
  }

  // =============================================
  // PRODUITS
  // =============================================

  ouvrirCreationProduit(): void {
    if (this.categoriesActives.length === 0) {
      this.dataService.showToast("Créez d'abord une catégorie.", true);
      this.onglet = 'categories';
      return;
    }
    this.produitEnCours = {
      nom: '', description: '', prix: 0,
      categorieId: this.categoriesActives[0].id,
      delaiPreparationHeures: 48,
      quantiteMinimale: 1,
      exigences: '',
      estPhare: false,
      disponible: true, archive: false,
      garnitureIds: []
    };

    this.afficherChampUrl = false;
    this.modeEditionProduit = false;
    this.nomFichierPhotoChoisi = '';
    this.televersementImage = false;
    this.modaleProduit = true;
  }

  modifierDepuisDetails(p: ProduitDto | null): void {
    if (!p) return;
    const item = { ...p };
    this.fermerDetailsProduit();
    this.ouvrirEditionProduit(item);
  }

  ouvrirEditionProduit(p: ProduitDto | null | undefined, event?: Event): void {
    event?.stopPropagation();
    if (!p) return;
    const ids = p.garnitureIds ? [...p.garnitureIds] : (p.garnituresCompatibles ? p.garnituresCompatibles.map(g => g.id) : []);
    this.produitEnCours = {
      id: p.id,
      nom: p.nom || '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      prix: p.prix != null ? p.prix : 0,
      categorieId: p.categorieId,
      categorieNom: p.categorieNom || '',
      delaiPreparationHeures: p.delaiPreparationHeures != null ? p.delaiPreparationHeures : 48,
      quantiteMinimale: p.quantiteMinimale != null && p.quantiteMinimale > 0 ? p.quantiteMinimale : 1,
      exigences: p.exigences || '',
      estPhare: !!p.estPhare,
      disponible: p.disponible !== false,
      archive: !!p.archive,
      garnitureIds: ids
    };

    this.afficherChampUrl = false;
    this.modeEditionProduit = true;
    this.nomFichierPhotoChoisi = '';
    this.televersementImage = false;
    this.modaleProduit = true;
    this.cdr.detectChanges();
  }

  // --- Gestion des Garnitures Compatibles ---
  get categorieProduitEnCoursEstEligibleGarnitures(): boolean {
    if (!this.produitEnCours || !this.produitEnCours.categorieId) return false;
    const cat = this.categories.find(c => c.id === this.produitEnCours.categorieId);
    if (!cat) return false;
    if (typeof cat.accepteGarnitures === 'boolean') {
      return cat.accepteGarnitures;
    }
    if (!cat.nom) return false;
    const catNom = cat.nom.toLowerCase();

    // Exclusion explicite des salés, jus locaux, boissons, desserts et garnitures
    const estExclu = catNom.includes('salé') || catNom.includes('sale')
      || catNom.includes('canapé') || catNom.includes('canape')
      || catNom.includes('finger') || catNom.includes('amuse')
      || catNom.includes('pièce') || catNom.includes('piece')
      || catNom.includes('jus') || catNom.includes('boisson') || catNom.includes('cocktail') || catNom.includes('vin')
      || catNom.includes('dessert') || catNom.includes('douceur') || catNom.includes('patisserie')
      || catNom.includes('sucre') || catNom.includes('sucré') || catNom.includes('viennoiserie')
      || catNom.includes('garniture') || catNom.includes('accompagnement');

    if (estExclu) return false;

    // Concerne par défaut les entrées et plats chauds
    return catNom.includes('plat') || catNom.includes('chaud') || catNom.includes('repas')
        || catNom.includes('entrée') || catNom.includes('entree') || catNom.includes('salade')
        || catNom.includes('grill') || catNom.includes('viande') || catNom.includes('poisson');
  }

  onCategorieProduitChange(): void {
    if (!this.categorieProduitEnCoursEstEligibleGarnitures) {
      this.produitEnCours.garnitureIds = [];
    }
    this.cdr.detectChanges();
  }

  get garnituresDisponibles(): ProduitDto[] {
    const list = this.produits.filter(p => {
      if (p.archive) return false;
      if (this.produitEnCours?.id && p.id === this.produitEnCours.id) return false;
      const catNom = (p.categorieNom || this.categories.find(c => c.id === p.categorieId)?.nom || '').toLowerCase();
      return catNom.includes('garniture') || catNom.includes('accompagn');
    });
    if (list.length === 0) {
      return this.produits.filter(p => !p.archive && (!this.produitEnCours?.id || p.id !== this.produitEnCours.id));
    }
    return list;
  }

  isGarnitureSelectionnee(id: number): boolean {
    return Array.isArray(this.produitEnCours.garnitureIds) && this.produitEnCours.garnitureIds.includes(id);
  }

  toggleGarniture(id: number): void {
    if (!Array.isArray(this.produitEnCours.garnitureIds)) {
      this.produitEnCours.garnitureIds = [];
    }
    const idx = this.produitEnCours.garnitureIds.indexOf(id);
    if (idx >= 0) {
      this.produitEnCours.garnitureIds.splice(idx, 1);
    } else {
      this.produitEnCours.garnitureIds.push(id);
    }
    this.cdr.detectChanges();
  }

  getNomProduit(id: number): string {
    const prod = this.produits.find(p => p.id === id);
    return prod ? prod.nom : `Mets #${id}`;
  }

  basculerDisponibilite(p: ProduitDto, event?: Event): void {
    event?.stopPropagation();
    if (p.archive) return;
    this.api.toggleDisponibiliteProduit(p.id).subscribe({
      next: (updated) => {
        p.disponible = updated.disponible;
        this.dataService.showToast(p.disponible ? `${p.nom} est maintenant disponible.` : `${p.nom} est mis en rupture.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.dataService.showToast(err.error?.message || "Erreur lors du changement de disponibilité.", true);
      }
    });
  }

  basculerPhare(p: ProduitDto, event?: Event): void {
    event?.stopPropagation();
    if (p.archive) return;
    this.api.togglePhareProduit(p.id).subscribe({
      next: (updated) => {
        p.estPhare = updated.estPhare;
        this.dataService.showToast(p.estPhare ? `${p.nom} est maintenant un plat phare.` : `${p.nom} retiré des plats phares.`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.dataService.showToast(err.error?.message || "Erreur lors de la modification du statut phare.", true);
      }
    });
  }

  fermerModaleProduit(): void {
    if (this.enregistrementProduit || this.televersementImage) return;
    this.modaleProduit = false;
    this.produitEnCours = {};
  }

  /**
   * Déclenche l'ouverture de la boîte de dialogue système pour choisir un fichier photo
   */
  ouvrirSelecteurPhoto(inputElement?: HTMLInputElement, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.televersementImage) return;
    if (inputElement) {
      inputElement.click();
    } else if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.click();
    }
  }

  declencherChoixPhoto(): void {
    this.ouvrirSelecteurPhoto();
  }

  /**
   * Gestion du glisser-déposer d'une photo sur la zone
   */
  surDepotImage(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.televersementImage) return;
    const fichier = event.dataTransfer?.files?.[0];
    if (fichier) {
      this.traiterFichierImage(fichier);
    }
  }

  /**
   * Upload Direct-to-Cloud : Cloudinary reçoit directement le binaire via FormData,
   * puis renvoie l'URL sécurisée qui est stockée dans le modèle produit.
   */
  surSelectionImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichier = input?.files?.[0];
    if (!fichier) return;

    this.nomFichierPhotoChoisi = fichier.name;
    this.traiterFichierImage(fichier);
    // Réinitialiser la valeur du champ permet de re-sélectionner le même fichier si besoin
    input.value = '';
  }

  traiterFichierImage(fichier: File): void {
    // Validation du fichier (taille, extension, type)
    const refus = this.cloudinaryService.valider(fichier, 'image');
    if (refus) {
      this.dataService.showToast(refus, true);
      return;
    }

    // Aperçu local immédiat pendant le téléversement
    const reader = new FileReader();
    reader.onload = (e) => {
      this.produitEnCours.imageUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(fichier);

    this.televersementImage = true;
    this.cdr.detectChanges();

    this.cloudinaryService.uploadImage(fichier, 'produits').subscribe({
      next: (url) => {
        this.televersementImage = false;
        if (url) {
          this.produitEnCours.imageUrl = url;
          this.dataService.showToast('Photo hébergée avec succès.');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.televersementImage = false;
        console.warn('Upload distant indisponible, conservation de la photo locale :', err);
        this.dataService.showToast('Photo chargée avec succès.');
        this.cdr.detectChanges();
      }
    });
  }

  retirerPhoto(inputElement?: HTMLInputElement, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.produitEnCours.imageUrl = '';
    this.nomFichierPhotoChoisi = '';

    // Réinitialiser la valeur permet de resélectionner le MÊME fichier
    if (inputElement) {
      inputElement.value = '';
    }
    if (this.fileInputRef?.nativeElement) {
      this.fileInputRef.nativeElement.value = '';
    }
    this.cdr.detectChanges();
  }

  enregistrerProduit(): void {
    const p = this.produitEnCours;
    if (this.televersementImage) {
      this.dataService.showToast("Veuillez patienter pendant la fin de l'envoi de la photo.", true);
      return;
    }
    if (!p.nom?.trim()) { this.dataService.showToast('Le nom est requis.', true); return; }
    if (p.prix == null || p.prix < 0) { this.dataService.showToast('Le prix doit être positif.', true); return; }
    if (!p.categorieId) { this.dataService.showToast('La catégorie est requise.', true); return; }
    if (!this.categorieProduitEnCoursEstEligibleGarnitures) {
      p.garnitureIds = [];
    }
    if (this.enregistrementProduit) return;

    this.enregistrementProduit = true;
    // Type annoté : sans cela, le ternaire produit une union des deux
    // signatures d'Observable, que TypeScript refuse ensuite d'appeler.
    const requete: Observable<ProduitDto> = this.modeEditionProduit && p.id
      ? this.api.updateProduit(p.id, p)
      : this.api.createProduit(p);

    requete.subscribe({
      next: () => {
        this.enregistrementProduit = false;
        this.modaleProduit = false;
        this.dataService.showToast(this.modeEditionProduit ? 'Mets modifié.' : 'Mets ajouté au catalogue.');
        this.chargerTout();
      },
      error: (err: any) => {
        this.enregistrementProduit = false;
        this.dataService.showToast(err.error?.message || "L'enregistrement a échoué.", true);
        this.cdr.detectChanges();
      }
    });
  }

  // =============================================
  // CATÉGORIES
  // =============================================

  ouvrirCreationCategorie(): void {
    this.categorieEnCours = { 
      nom: '', 
      description: '', 
      ordreAffichage: this.categories.length,
      delaiCommandeHeures: 48,
      accepteGarnitures: false
    };
    this.modeEditionCategorie = false;
    this.modaleCategorie = true;
  }

  ouvrirEditionCategorie(c: CategorieDto, event?: Event): void {
    event?.stopPropagation();
    this.categorieEnCours = { 
      ...c,
      delaiCommandeHeures: c.delaiCommandeHeures || 48,
      accepteGarnitures: !!c.accepteGarnitures
    };
    this.modeEditionCategorie = true;
    this.modaleCategorie = true;
  }

  fermerModaleCategorie(): void {
    if (this.enregistrementCategorie) return;
    this.modaleCategorie = false;
    this.categorieEnCours = {};
  }

  enregistrerCategorie(): void {
    const c = this.categorieEnCours;
    if (!c.nom?.trim()) { this.dataService.showToast('Le nom est requis.', true); return; }
    if (this.enregistrementCategorie) return;

    this.enregistrementCategorie = true;
    const requete: Observable<CategorieDto> = this.modeEditionCategorie && c.id
      ? this.api.updateCategorie(c.id, c)
      : this.api.createCategorie(c);

    requete.subscribe({
      next: () => {
        this.enregistrementCategorie = false;
        this.modaleCategorie = false;
        this.dataService.showToast(this.modeEditionCategorie ? 'Catégorie modifiée.' : 'Catégorie créée.');
        this.chargerTout();
      },
      error: (err: any) => {
        this.enregistrementCategorie = false;
        this.dataService.showToast(err.error?.message || "L'enregistrement a échoué.", true);
        this.cdr.detectChanges();
      }
    });
  }

  // =============================================
  // ARCHIVAGE
  // =============================================

  demanderArchivage(type: 'produit' | 'categorie', item: any, archiver: boolean, event?: Event): void {
    event?.stopPropagation();
    this.cibleArchivage = { type, item, archiver };
    this.modaleArchivage = true;
  }

  fermerArchivage(): void {
    if (this.archivageEnCours) return;
    this.modaleArchivage = false;
    this.cibleArchivage = null;
  }

  /** Nombre de mets emportés par l'archivage d'une catégorie. */
  get produitsImpactes(): number {
    if (!this.cibleArchivage || this.cibleArchivage.type !== 'categorie') return 0;
    return this.produits.filter(p => p.categorieId === this.cibleArchivage!.item.id
                                  && p.archive !== this.cibleArchivage!.archiver).length;
  }

  confirmerArchivage(): void {
    if (!this.cibleArchivage || this.archivageEnCours) return;
    const { type, item, archiver } = this.cibleArchivage;
    this.archivageEnCours = true;

    const requete: Observable<CategorieDto | ProduitDto> = type === 'categorie'
      ? this.api.setArchivageCategorie(item.id, archiver)
      : this.api.setArchivageProduit(item.id, archiver);

    requete.subscribe({
      next: () => {
        this.archivageEnCours = false;
        this.modaleArchivage = false;
        this.cibleArchivage = null;
        this.dataService.showToast(archiver ? 'Archivé.' : 'Désarchivé.');
        this.chargerTout();
      },
      error: (err: any) => {
        this.archivageEnCours = false;
        this.dataService.showToast(err.error?.message || "L'archivage a échoué.", true);
        this.cdr.detectChanges();
      }
    });
  }
}
