import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SaTopbarComponent } from '../sa-topbar.component';
import { B2bStateService } from '../../../b2b/shared/b2b-state.service';
import { CloudinaryService } from '../../../b2b/shared/cloudinary.service';
import { PlatB2B } from '../../../b2b/shared/b2b.models';

@Component({
  selector: 'app-sa-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SaTopbarComponent],
  templateUrl: './sa-catalogue.component.html',
  styleUrls: ['../super-admin-shared.css']
})
export class SaCatalogueComponent {
  b2b = inject(B2bStateService);
  private cloudinary = inject(CloudinaryService);
  isUploadingImage = signal<boolean>(false);
  isUploadingGarnitureImage = signal<boolean>(false);
  garnitureImageEnEdition = signal<string>('');

  readonly garnituresPredefinies: Array<{ id: string; nom: string; description: string; imageDefaut: string }> = [
    {
      id: 'garniture-defaut-riz',
      nom: 'Riz Parfumé',
      description: 'Riz blanc parfumé au jasmin, cuit à la vapeur.',
      imageDefaut: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'garniture-defaut-alloco',
      nom: 'Alloco Doré',
      description: 'Bananes plantains mûres frites et dorées à souhait.',
      imageDefaut: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'garniture-defaut-frites',
      nom: 'Frites Maison',
      description: 'Frites de pommes de terre fraîches croustillantes.',
      imageDefaut: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'garniture-defaut-attieke',
      nom: 'Attiéké',
      description: 'Semoule de manioc traditionnelle légère et parfumée.',
      imageDefaut: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'garniture-defaut-legumes',
      nom: 'Légumes Sautés',
      description: 'Poêlée de légumes frais croquants du marché.',
      imageDefaut: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'garniture-defaut-puree',
      nom: 'Purée de Pommes de Terre',
      description: 'Purée onctueuse de pommes de terre au beurre doux.',
      imageDefaut: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?auto=format&fit=crop&w=800&q=80'
    }
  ];

  constructor() {
  }

  showModalPlat = signal<boolean>(false);
  platEnEdition = signal<Partial<PlatB2B>>({
    nom: '',
    description: '',
    categorie: 'PLAT',
    prixUnitaire: 2800,
    image: '/assets/images/plats/p1.jpg'
  });
  isEditModePlat = signal<boolean>(false);
  platIdEnEdition = signal<string>('');

  // Filtre Catalogue & Pagination
  recherchePlatCatalogue = signal<string>('');
  filtreCategorieCatalogue = signal<'TOUS' | 'ENTREE' | 'PLAT' | 'GARNITURE' | 'DESSERT' | 'BOISSON'>('TOUS');
  filtreArchivePlat = signal<'TOUS' | 'ACTIFS' | 'ARCHIVES'>('ACTIFS');
  pageCatalogue = signal<number>(1);
  pageSizeCatalogue = signal<number>(6);

  optionsGarnituresDisponibles = computed(() => {
    const defaut = [
      'Riz Parfumé',
      'Alloco Doré',
      'Frites Maison',
      'Attiéké',
      'Légumes Sautés',
      'Purée de Pommes de Terre'
    ];
    const duCatalogue = this.b2b.catalogueJour()
      .filter(p => !p.isArchive && p.categorie === 'GARNITURE')
      .map(p => p.nom.trim())
      .filter(Boolean);
    return Array.from(new Set([...duCatalogue, ...defaut]));
  });

  platsFiltres = computed(() => {
    const q = this.recherchePlatCatalogue().trim().toLowerCase();
    const cat = this.filtreCategorieCatalogue();
    const arch = this.filtreArchivePlat();

    const catalogue = this.b2b.catalogueJour();
    let source: PlatB2B[] = [...catalogue];

    if (cat === 'GARNITURE' && arch !== 'ARCHIVES') {
      const existantsParNom = new Set(
        catalogue
          .filter(p => p.categorie === 'GARNITURE')
          .map(p => p.nom.trim().toLowerCase())
      );
      const garnituresVirtuelles: PlatB2B[] = this.garnituresPredefinies
        .filter(g => !existantsParNom.has(g.nom.toLowerCase()))
        .map(g => ({
          id: g.id,
          nom: g.nom,
          description: g.description,
          categorie: 'GARNITURE' as const,
          prixUnitaire: 0,
          image: g.imageDefaut,
          calories: 250,
          disponible: true,
          isArchive: false
        }));
      source = [...garnituresVirtuelles, ...catalogue.filter(p => p.categorie === 'GARNITURE')];
    }

    return source.filter(p => {
      const matchQuery = !q || p.nom.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      const matchCat = cat === 'TOUS' ? p.categorie !== 'GARNITURE' : p.categorie === cat;
      const matchArch = arch === 'TOUS' ? true : arch === 'ACTIFS' ? !p.isArchive : p.isArchive;
      return matchQuery && matchCat && matchArch;
    });
  });

  getImageGarnitureParNom(nom?: string): string {
    if (!nom) return '';
    const n = nom.trim().toLowerCase();
    const fiche = this.b2b.catalogueJour().find(
      p => p.categorie === 'GARNITURE' && p.nom.trim().toLowerCase() === n
    );
    if (fiche?.image) return fiche.image;
    const predef = this.garnituresPredefinies.find(g => g.nom.toLowerCase() === n);
    return predef?.imageDefaut || '';
  }

  onChangeGarnitureSelectionnee(nom: string) {
    this.platEnEdition.update(p => ({ ...p, garniture: nom }));
    this.garnitureImageEnEdition.set(this.getImageGarnitureParNom(nom));
  }

  private sauvegarderFicheGarnitureImage(nomGarniture: string, imageUrl: string) {
    const n = nomGarniture.trim().toLowerCase();
    const existante = this.b2b.catalogueJour().find(
      p => p.categorie === 'GARNITURE' && p.nom.trim().toLowerCase() === n
    );
    const predef = this.garnituresPredefinies.find(g => g.nom.toLowerCase() === n);
    if (existante) {
      this.b2b.modifierPlatCatalogue(existante.id, { ...existante, image: imageUrl });
    } else {
      this.b2b.ajouterPlatCatalogue({
        nom: predef?.nom || nomGarniture.trim(),
        description: predef?.description || `Garniture d'accompagnement : ${nomGarniture.trim()}.`,
        categorie: 'GARNITURE',
        prixUnitaire: 0,
        image: imageUrl,
        calories: 250,
        allergene: 'Aucun allergène majeur'
      });
    }
  }

  onUploadImageGarniture(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const nomGarniture = this.platEnEdition().garniture;
    if (!file || !nomGarniture) return;

    this.isUploadingGarnitureImage.set(true);
    this.cloudinary.uploadImage(file).subscribe({
      next: (url) => {
        this.garnitureImageEnEdition.set(url);
        this.sauvegarderFicheGarnitureImage(nomGarniture, url);
        this.isUploadingGarnitureImage.set(false);
        this.b2b.showToast(`Photo de la garniture « ${nomGarniture} » mise à jour !`, 'success');
      },
      error: (err) => {
        this.isUploadingGarnitureImage.set(false);
        const msg = err?.error?.error?.message || err?.message || 'Erreur inconnue';
        this.b2b.showToast(`Erreur lors de l'upload vers Cloudinary : ${msg}`, 'error');
      }
    });
  }

  totalPagesCatalogue = computed(() => {
    return Math.max(1, Math.ceil(this.platsFiltres().length / this.pageSizeCatalogue()));
  });

  platsPagines = computed(() => {
    const list = this.platsFiltres();
    const size = this.pageSizeCatalogue();
    const page = Math.min(this.pageCatalogue(), Math.max(1, Math.ceil(list.length / size)));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  pagesCatalogueArray = computed(() => {
    return Array.from({ length: this.totalPagesCatalogue() }, (_, i) => i + 1);
  });

  changerPageCatalogue(page: number) {
    if (page >= 1 && page <= this.totalPagesCatalogue()) {
      this.pageCatalogue.set(page);
    }
  }

  // Planning Multi-Sites Super Admin
  ouvrirModalAjoutPlat() {
    this.isEditModePlat.set(false);
    this.garnitureImageEnEdition.set('');
    this.platEnEdition.set({
      nom: '',
      description: '',
      categorie: 'PLAT',
      prixUnitaire: 2800,
      image: '/assets/images/plats/p1.jpg'
    });
    this.showModalPlat.set(true);
  }

  ouvrirModalModifierPlat(plat: PlatB2B) {
    this.isEditModePlat.set(true);
    this.platIdEnEdition.set(plat.id);
    this.platEnEdition.set({ ...plat });
    this.garnitureImageEnEdition.set(this.getImageGarnitureParNom(plat.garniture));
    this.showModalPlat.set(true);
  }

  enregistrerPlat() {
    const p = this.platEnEdition();
    const isGarniture = p.categorie === 'GARNITURE';
    if (!p.nom || (!isGarniture && !p.prixUnitaire && p.prixUnitaire !== 0)) {
      this.b2b.showToast('Veuillez renseigner le nom du met et son tarif.', 'error');
      return;
    }

    if (this.isEditModePlat()) {
      const id = this.platIdEnEdition();
      if (id.startsWith('garniture-defaut-')) {
        this.b2b.ajouterPlatCatalogue({
          nom: p.nom!,
          description: p.description || '',
          categorie: 'GARNITURE',
          prixUnitaire: p.prixUnitaire ?? 0,
          image: p.image || '/assets/images/plats/p1.jpg',
          allergene: p.allergene || 'Aucun allergène majeur'
        });
      } else {
        this.b2b.modifierPlatCatalogue(id, p);
      }
    } else {
      this.b2b.ajouterPlatCatalogue({
        nom: p.nom!,
        description: p.description || '',
        categorie: p.categorie || 'PLAT',
        garniture: p.categorie === 'PLAT' ? (p.garniture || undefined) : undefined,
        prixUnitaire: p.prixUnitaire ?? (isGarniture ? 0 : 2500),
        image: p.image || '/assets/images/plats/p1.jpg',
        allergene: p.allergene || 'Aucun allergène majeur'
      });
    }
    this.showModalPlat.set(false);
  }

  onUploadImagePlat(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingImage.set(true);
    this.cloudinary.uploadImage(file).subscribe({
      next: (url) => {
        this.platEnEdition.update(p => ({ ...p, image: url }));
        this.isUploadingImage.set(false);
      },
      error: (err) => {
        this.isUploadingImage.set(false);
        const msg = err?.error?.error?.message || err?.message || 'Erreur inconnue';
        this.b2b.showToast(`Erreur lors de l'upload vers Cloudinary : ${msg}`, 'error');
      }
    });
  }

  // PROGRAMMATION GLOBALE & DÉPLOIEMENT VERS TOUTES LES ENTREPRISES
  private readonly joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
  private readonly todayIndexSa = (new Date().getDay() + 6) % 7;
}
