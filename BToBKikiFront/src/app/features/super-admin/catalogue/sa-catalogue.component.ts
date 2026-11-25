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

  constructor() {
    if (this.b2b.currentSession().role !== 'SUPER_ADMIN') {
      this.b2b.setSessionRole({
        role: 'SUPER_ADMIN',
        nomComplet: 'Direction Kiki Traiteur',
        titrePoste: 'Super Admin Kiki (Global)',
        entite: 'Kiki Traiteur B2B',
        siteId: 'site-1',
        siteNom: 'Siège Plateau - Dakar',
        badge: 'Direction Générale',
        badgeColor: '#721513'
      });
    }
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
  filtreCategorieCatalogue = signal<'TOUS' | 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON'>('TOUS');
  filtreArchivePlat = signal<'TOUS' | 'ACTIFS' | 'ARCHIVES'>('ACTIFS');
  pageCatalogue = signal<number>(1);
  pageSizeCatalogue = signal<number>(6);

  platsFiltres = computed(() => {
    const q = this.recherchePlatCatalogue().trim().toLowerCase();
    const cat = this.filtreCategorieCatalogue();
    const arch = this.filtreArchivePlat();

    return this.b2b.catalogueJour().filter(p => {
      const matchQuery = !q || p.nom.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      const matchCat = cat === 'TOUS' || p.categorie === cat;
      const matchArch = arch === 'TOUS' ? true : arch === 'ACTIFS' ? !p.isArchive : p.isArchive;
      return matchQuery && matchCat && matchArch;
    });
  });

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
    this.showModalPlat.set(true);
  }

  enregistrerPlat() {
    const p = this.platEnEdition();
    if (!p.nom || !p.prixUnitaire) {
      alert('Veuillez renseigner le nom du met et son tarif.');
      return;
    }

    if (this.isEditModePlat()) {
      this.b2b.modifierPlatCatalogue(this.platIdEnEdition(), p);
    } else {
      this.b2b.ajouterPlatCatalogue({
        nom: p.nom!,
        description: p.description || '',
        categorie: p.categorie || 'PLAT',
        prixUnitaire: p.prixUnitaire || 2500,
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
        alert(`Erreur lors de l'upload vers Cloudinary : ${msg}`);
      }
    });
  }

  // PROGRAMMATION GLOBALE & DÉPLOIEMENT VERS TOUTES LES ENTREPRISES
  private readonly joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
  private readonly todayIndexSa = (new Date().getDay() + 6) % 7;
}
