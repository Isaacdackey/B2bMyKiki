import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { retry } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface RealisationGalleryItem {
  url: string;
  title: string;
  category: string;
  description?: string;
  guests?: string;
  location?: string;
  rawCategoryKey?: string;
}

@Component({
  selector: 'app-realisations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realisations.component.html',
  styleUrl: './realisations.component.css'
})
export class RealisationsComponent implements OnInit {
  selectedFilter = 'all';
  lightboxOpen = false;
  lightboxImgSrc = '';
  lightboxCaption = '';

  filterTabs = [
    { key: 'all', label: 'Toutes', icon: 'fa-solid fa-layer-group' },
    { key: 'corporate', label: "Restauration d'Entreprise", icon: 'fa-solid fa-briefcase' },
    { key: 'events', label: 'Événementiel & Réceptions', icon: 'fa-solid fa-champagne-glasses' },
    { key: 'diva', label: 'Salle La Diva', icon: 'fa-solid fa-hotel' },
    { key: 'takeaway', label: 'Plats à Emporter', icon: 'fa-solid fa-bag-shopping' },
    { key: 'foodtruck', label: 'Food Truck Gourmet', icon: 'fa-solid fa-truck' }
  ];

  galleryItems: RealisationGalleryItem[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.chargerRealisations();
  }

  chargerRealisations(): void {
    try {
      const cachedGallery = localStorage.getItem('kiki_cached_realisations_gallery');
      if (cachedGallery) {
        const parsed = JSON.parse(cachedGallery);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.galleryItems = parsed;
        }
      }
    } catch (e) {}

    this.http.get<any>(`${environment.apiUrl}/api/realisations`)
      .pipe(retry({ count: 3, delay: 1500 }))
      .subscribe({
        next: (res) => {
          let medias: any[] = [];
          if (Array.isArray(res)) {
            medias = res;
          } else if (res && res.data) {
            medias = res.data.Realisations || res.data.realisations || res.data.items || (Array.isArray(res.data) ? res.data : []);
          }
          if (!medias || !Array.isArray(medias)) return;

          const photos = medias.filter(m => {
            const nomEvent = (m.evenementNom || '').toLowerCase().trim();
            const estProduit = nomEvent === 'produits' || nomEvent === 'produit' || nomEvent === 'catalogue' || nomEvent === 'plats' || nomEvent === 'mets';
            const estImage = !m.type || m.type.toUpperCase() === 'IMAGE';
            const estVisible = m.visiblePublic !== false;
            return !estProduit && estImage && estVisible && m.url;
          });

          if (photos.length === 0) {
            this.galleryItems = [];
            return;
          }

          this.galleryItems = photos.map(m => {
            const catInfo = this.determinerCategorie(m);
            return {
              url: m.url,
              title: m.evenementNom || 'Prestation Kiki Traiteur',
              category: catInfo.label,
              description: m.description || '',
              guests: m.nombreConvives ? `${m.nombreConvives} invités` : 'Sur mesure',
              location: m.lieu ? m.lieu : 'Dakar, Sénégal',
              rawCategoryKey: catInfo.key
            };
          });

          try {
            localStorage.setItem('kiki_cached_realisations_gallery', JSON.stringify(this.galleryItems));
          } catch (e) {}
        },
        error: (err) => {
          console.warn('Erreur chargement Réalisations depuis API:', err);
        }
      });
  }

  determinerCategorie(m: any): { label: string; key: string } {
    const type = (m.typeEvenement || '').toLowerCase();
    const nom = (m.evenementNom || '').toLowerCase();
    const lieu = (m.lieu || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    const full = `${type} ${nom} ${lieu} ${desc}`;

    if (full.includes('diva') || full.includes('salle diva') || full.includes('réception la diva')) {
      return { label: m.typeEvenement || 'Salle La Diva', key: 'diva' };
    }
    if (full.includes('food truck') || full.includes('foodtruck') || full.includes('street food')) {
      return { label: m.typeEvenement || 'Food Truck Gourmet', key: 'foodtruck' };
    }
    if (full.includes('emporter') || full.includes('takeaway') || full.includes('coffret') || full.includes('box')) {
      return { label: m.typeEvenement || 'Plats à Emporter', key: 'takeaway' };
    }
    if (full.includes('entreprise') || full.includes('corporate') || full.includes('séminaire') || full.includes('seminaire') || full.includes('institutionnel') || full.includes('cantine') || full.includes('cocktail d\'affaires') || full.includes('affaires')) {
      return { label: m.typeEvenement || 'Restauration d\'Entreprise', key: 'corporate' };
    }
    if (full.includes('mariage') || full.includes('gala') || full.includes('anniversaire') || full.includes('cocktail') || full.includes('fête') || full.includes('evenement') || full.includes('événement') || full.includes('reception') || full.includes('réception') || full.includes('mariages & réceptions')) {
      return { label: m.typeEvenement || 'Événementiel & Réceptions', key: 'events' };
    }
    return { label: m.typeEvenement || 'Événementiel & Réceptions', key: 'events' };
  }

  getFilteredGalleryItems(): RealisationGalleryItem[] {
    if (this.selectedFilter === 'all') {
      return this.galleryItems;
    }
    return this.galleryItems.filter(item => {
      return item.rawCategoryKey === this.selectedFilter;
    });
  }

  getCountForFilter(key: string): number {
    if (key === 'all') return this.galleryItems.length;
    return this.galleryItems.filter(item => item.rawCategoryKey === key).length;
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
  }

  openLightbox(src: string, caption: string): void {
    this.lightboxImgSrc = src;
    this.lightboxCaption = caption;
    this.lightboxOpen = true;
  }

  closeLightbox(): void {
    this.lightboxOpen = false;
  }
}
