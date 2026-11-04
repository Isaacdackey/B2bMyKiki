import { Component, ViewEncapsulation, OnInit, ChangeDetectorRef, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { KikiDataService } from '../../../services/kiki-data.service';
import { GestionnaireApiService, MediaDto } from '../../../services/gestionnaire-api.service';
import { UploadBackgroundService } from '../../../services/upload-background.service';

export interface ElementMediaSelectionne {
  file: File;
  previewUrl?: string;
  isImage: boolean;
  isVideo: boolean;
  isPdf: boolean;
}

export interface CategoriePrestation {
  id: string;
  label: string;
  icone: string;
  badgeBg: string;
  badgeColor: string;
}

export interface AlbumEvenement {
  id: string;
  titre: string;
  dateEvenement: string;
  categorieId: string;
  categorie: CategoriePrestation;
  typeEvenement?: string;
  nombreConvives?: string;
  lieu?: string;
  description?: string;
  visiblePublic: boolean;
  nombreVisibles: number;
  nombreMasques: number;
  medias: MediaDto[];
}

@Component({
  selector: 'app-mediatheque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mediatheque.component.html',
  styleUrl: './mediatheque.component.css'
})
export class MediathequeComponent implements OnInit {
  medias: MediaDto[] = [];
  chargement = false;

  // Catégories de prestations alignées avec les demandes
  categoriesPrestations: CategoriePrestation[] = [
    { id: 'ALL', label: 'Tous les albums', icone: 'fa-layer-group', badgeBg: '#FAF5EA', badgeColor: '#721513' },
    { id: 'mariage', label: 'Mariages', icone: 'fa-heart', badgeBg: '#FDF2F8', badgeColor: '#BE185D' },
    { id: 'bapteme', label: 'Baptêmes', icone: 'fa-baby', badgeBg: '#EFF6FF', badgeColor: '#1D4ED8' },
    { id: 'anniversaire', label: 'Anniversaires', icone: 'fa-cake-candles', badgeBg: '#FEF3C7', badgeColor: '#B45309' },
    { id: 'seminaire', label: 'Séminaires & Pro', icone: 'fa-briefcase', badgeBg: '#F3E8FF', badgeColor: '#7E22CE' },
    { id: 'cocktail', label: 'Cocktails & Réceptions', icone: 'fa-martini-glass-citrus', badgeBg: '#ECFDF5', badgeColor: '#047857' },
    { id: 'gala', label: 'Galas & Banquets', icone: 'fa-champagne-glasses', badgeBg: '#FFF1F2', badgeColor: '#BE123C' },
    { id: 'autre', label: 'Autres photos & prestations', icone: 'fa-images', badgeBg: '#F1F5F9', badgeColor: '#475569' }
  ];

  filtreCategorie = 'ALL';

  // --- Modale d'Album Sélectionné ---
  albumSelectionne: AlbumEvenement | null = null;
  modaleAlbumVisible = false;

  // --- Modale de Création / Modification d'Album ---
  modaleCreationOuverte = false;
  modeEdition = false;
  albumEnEdition: AlbumEvenement | null = null;
  evenementsCalendrier: any[] = [];
  evenementCalendrierSelectionne: any = null;
  menuEvenementOuvert = false;
  rechercheEvenement = '';

  fichiersSelectionnes: ElementMediaSelectionne[] = [];
  titreEvenement = '';
  typeEvenement = "Restauration d'Entreprise";
  nombreConvives: number | null = null;
  lieu = '';
  description = '';
  dateEvenement = '';
  categorieEvenement = 'mariage';
  visiblePublicAlbum = true;

  // --- Lightbox Grand Format ---
  lightboxMedia: MediaDto | null = null;

  // --- Sélection Multiple de Médias dans l'Album ---
  mediasSelectionnesIds: Set<number> = new Set<number>();

  // --- Modale Personnalisée de Confirmation de Suppression ---
  modaleConfirmationSuppression = false;
  mediasASupprimer: MediaDto[] = [];
  suppressionEnCours = false;

  // Ref input pour ajout direct à l'album
  @ViewChild('albumDirectFileInput') albumDirectFileInputRef?: ElementRef<HTMLInputElement>;

  constructor(
    private api: GestionnaireApiService,
    public uploadBg: UploadBackgroundService,
    private dataService: KikiDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.chargerMedias();
    this.chargerEvenementsCalendrier();
  }

  chargerEvenementsCalendrier(): void {
    const evs = this.dataService.getEvents() || [];
    this.evenementsCalendrier = [...evs];

    this.api.getAllDemandes(0, 50).subscribe({
      next: (res) => {
        const demandes = (res?.content || []).map(d => ({
          id: 'demande_' + d.id,
          title: d.prestationTitle ? `${d.prestationTitle} — ${d.clientName}` : `Demande ${d.clientName}`,
          type: d.prestationTitle || "Restauration d'Entreprise",
          date: d.date,
          guests: d.guests,
          location: d.location || 'Salle La Diva, Dakar',
          clientName: d.clientName
        }));

        this.evenementsCalendrier = [...evs, ...demandes];
        this.cdr.detectChanges();
      },
      error: () => {
        this.evenementsCalendrier = evs;
      }
    });
  }

  chargerMedias(): void {
    this.chargement = true;
    this.api.getMedias().subscribe({
      next: (liste) => {
        // RÈGLE CRITIQUE : Exclusion stricte des photos de mets/catalogue/produits
        this.medias = (liste || []).filter(m => !this.estPhotoProduit(m));
        this.chargement = false;

        // Si un album est actuellement ouvert, rafraîchir ses médias
        if (this.albumSelectionne) {
          const albumMaj = this.albums.find(a => a.id === this.albumSelectionne?.id);
          if (albumMaj) {
            this.albumSelectionne = albumMaj;
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur de chargement de la médiathèque', err);
        this.medias = [];
        this.chargement = false;
        this.dataService.showToast('Impossible de charger la médiathèque.', true);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Vérifie si un média appartient aux produits/mets du catalogue pour l'exclure de la médiathèque.
   */
  private estPhotoProduit(m: MediaDto): boolean {
    const nomEvent = (m.evenementNom || '').toLowerCase().trim();
    const typeEv = (m.typeEvenement || '').toLowerCase().trim();
    return nomEvent === 'produits' ||
           nomEvent === 'produit' ||
           nomEvent === 'catalogue' ||
           nomEvent.startsWith('produit-') ||
           nomEvent === 'plats' ||
           nomEvent === 'mets' ||
           nomEvent === 'equipe' ||
           nomEvent === 'prestations' ||
           typeEv.includes('produit') ||
           typeEv.includes('catalogue') ||
           typeEv.includes('equipe') ||
           typeEv.includes('prestation');
  }

  /**
   * Détecte intelligemment la catégorie d'un événement à partir de son intitulé.
   */
  private detecterCategorie(nom?: string): CategoriePrestation {
    const fallback = this.categoriesPrestations.find(c => c.id === 'autre')!;
    if (!nom) return fallback;

    const lower = nom.toLowerCase();
    if (lower.includes('mariage') || lower.includes('époux') || lower.includes('diva')) {
      return this.categoriesPrestations.find(c => c.id === 'mariage') || fallback;
    }
    if (lower.includes('bapteme') || lower.includes('baptême') || lower.includes('naissance')) {
      return this.categoriesPrestations.find(c => c.id === 'bapteme') || fallback;
    }
    if (lower.includes('anniversaire') || lower.includes('birthday')) {
      return this.categoriesPrestations.find(c => c.id === 'anniversaire') || fallback;
    }
    if (lower.includes('seminaire') || lower.includes('séminaire') || lower.includes('entreprise') || lower.includes('conférence') || lower.includes('business')) {
      return this.categoriesPrestations.find(c => c.id === 'seminaire') || fallback;
    }
    if (lower.includes('cocktail') || lower.includes('pause') || lower.includes('afterwork') || lower.includes('reception') || lower.includes('réception')) {
      return this.categoriesPrestations.find(c => c.id === 'cocktail') || fallback;
    }
    if (lower.includes('gala') || lower.includes('banquet') || lower.includes('diner') || lower.includes('dîner')) {
      return this.categoriesPrestations.find(c => c.id === 'gala') || fallback;
    }
    return fallback;
  }

  /**
   * Extrait ou génère une date lisible pour l'événement.
   */
  private extraireDate(medias: MediaDto[]): string {
    for (const m of medias) {
      if (m.uploadedAt) {
        try {
          const d = new Date(m.uploadedAt);
          if (!isNaN(d.getTime())) {
            return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
          }
        } catch (_) {}
      }
    }
    return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  /**
   * Construit la liste des albums d'événements groupés.
   */
  get albums(): AlbumEvenement[] {
    const parEvenement = new Map<string, MediaDto[]>();

    for (const m of this.medias) {
      const titre = m.evenementNom?.trim() || 'Événements & Prestations Kiki Traiteur';
      if (!parEvenement.has(titre)) {
        parEvenement.set(titre, []);
      }
      parEvenement.get(titre)!.push(m);
    }

    const liste: AlbumEvenement[] = [];
    parEvenement.forEach((medias, titre) => {
      const premierMedia = medias.find(m => m.typeEvenement || m.lieu || m.nombreConvives || m.description) || medias[0];
      const categorie = this.detecterCategorie(titre);
      const visibles = medias.filter(m => m.visiblePublic !== false).length;
      const masques = medias.filter(m => m.visiblePublic === false).length;
      const isVisibleAlbum = medias.length === 0 || visibles > 0;

      liste.push({
        id: encodeURIComponent(titre),
        titre,
        dateEvenement: this.extraireDate(medias),
        categorieId: categorie.id,
        categorie,
        typeEvenement: premierMedia?.typeEvenement,
        nombreConvives: premierMedia?.nombreConvives,
        lieu: premierMedia?.lieu,
        description: premierMedia?.description,
        visiblePublic: isVisibleAlbum,
        nombreVisibles: visibles,
        nombreMasques: masques,
        medias
      });
    });

    return liste;
  }

  /**
   * Albums filtrés par la barre de catégorie.
   */
  get albumsFiltres(): AlbumEvenement[] {
    if (this.filtreCategorie === 'ALL') {
      return this.albums;
    }
    return this.albums.filter(a => a.categorieId === this.filtreCategorie);
  }

  // --- Actions sur les Albums ---

  extraireEntier(val: any): number | null {
    if (val === null || val === undefined) return null;
    if (typeof val === 'number') return isNaN(val) ? null : val;
    const digits = String(val).replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : null;
  }

  ouvrirAlbum(album: AlbumEvenement): void {
    this.albumSelectionne = album;
    this.modaleAlbumVisible = true;
  }

  fermerModaleAlbum(): void {
    this.modaleAlbumVisible = false;
    this.albumSelectionne = null;
    this.deselectionnerTout();
  }

  ouvrirCreationAlbum(): void {
    this.modeEdition = false;
    this.albumEnEdition = null;
    this.evenementCalendrierSelectionne = null;
    this.viderSelection();
    this.titreEvenement = '';
    this.typeEvenement = "Restauration d'Entreprise";
    this.nombreConvives = null;
    this.lieu = '';
    this.description = '';
    this.dateEvenement = new Date().toISOString().substring(0, 10);
    this.categorieEvenement = 'mariage';
    this.visiblePublicAlbum = true;
    this.modaleCreationOuverte = true;
  }

  ouvrirEditionAlbum(album: AlbumEvenement, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.modeEdition = true;
    this.albumEnEdition = album;
    this.evenementCalendrierSelectionne = null;
    this.viderSelection();
    this.titreEvenement = album.titre || '';
    this.typeEvenement = album.typeEvenement || "Restauration d'Entreprise";
    this.nombreConvives = this.extraireEntier(album.nombreConvives);
    this.lieu = album.lieu || '';
    this.description = album.description || '';
    this.dateEvenement = new Date().toISOString().substring(0, 10);
    this.categorieEvenement = album.categorieId || 'mariage';
    this.visiblePublicAlbum = album.visiblePublic;
    this.modaleCreationOuverte = true;
  }

  private normaliserTexte(txt: string): string {
    return (txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Retourne uniquement les événements / demandes qui n'ont PAS ENCORE d'album ou de photos dans la médiathèque.
   */
  get evenementsSansPhotos(): any[] {
    const albumsTitres = new Set(
      this.albums.map(a => this.normaliserTexte(a.titre))
    );

    return this.evenementsCalendrier.filter(ev => {
      const nomEv = this.normaliserTexte(ev.title || ev.titre || '');
      if (!nomEv) return false;
      // Si on est en mode édition sur cet album, on l'autorise
      if (this.modeEdition && this.albumEnEdition && this.normaliserTexte(this.albumEnEdition.titre) === nomEv) {
        return true;
      }
      return !albumsTitres.has(nomEv);
    });
  }

  /**
   * Filtre les événements sans photos selon la recherche saisie par l'utilisateur.
   */
  get evenementsFiltresRecherche(): any[] {
    const q = (this.rechercheEvenement || '').trim().toLowerCase();
    const liste = this.evenementsSansPhotos;
    if (!q) return liste;
    return liste.filter(ev =>
      (ev.title || ev.titre || '').toLowerCase().includes(q) ||
      (ev.clientName || '').toLowerCase().includes(q) ||
      (ev.type || '').toLowerCase().includes(q) ||
      (ev.location || '').toLowerCase().includes(q)
    );
  }

  toggleMenuEvenement(event?: Event): void {
    if (event) event.stopPropagation();
    this.menuEvenementOuvert = !this.menuEvenementOuvert;
    if (this.menuEvenementOuvert) {
      this.rechercheEvenement = '';
    }
  }

  selectionnerEvenement(ev: any): void {
    this.evenementCalendrierSelectionne = ev;
    this.surSelectionEvenementCalendrier();
    this.menuEvenementOuvert = false;
    this.rechercheEvenement = '';
  }

  reinitialiserEvenementSelectionne(): void {
    this.evenementCalendrierSelectionne = null;
    this.menuEvenementOuvert = false;
    this.rechercheEvenement = '';
  }

  @HostListener('document:click', ['$event'])
  surClicDocument(event: MouseEvent): void {
    if (this.menuEvenementOuvert) {
      const target = event.target as HTMLElement;
      if (!target.closest('.event-dropdown-container')) {
        this.menuEvenementOuvert = false;
      }
    }
  }

  surSelectionEvenementCalendrier(): void {
    if (!this.evenementCalendrierSelectionne) {
      return;
    }
    const ev = this.evenementCalendrierSelectionne;
    this.titreEvenement = ev.title || ev.titre || '';
    this.typeEvenement = ev.type || ev.prestationTitle || "Restauration d'Entreprise";
    this.nombreConvives = this.extraireEntier(ev.guests || ev.nombreConvives);
    this.lieu = ev.location || ev.lieu || 'Salle La Diva, Dakar';
    if (ev.date) {
      try {
        const d = new Date(ev.date);
        if (!isNaN(d.getTime())) {
          this.dateEvenement = d.toISOString().substring(0, 10);
        }
      } catch (_) {}
    }
  }

  fermerModaleCreation(): void {
    if (this.uploadBg.estEnCours) {
      this.modaleCreationOuverte = false;
      return;
    }
    this.modaleCreationOuverte = false;
    this.modeEdition = false;
    this.albumEnEdition = null;
    this.viderSelection();
  }

  // --- Gestion des fichiers ---

  surSelectionFichiers(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichiers = Array.from(input.files || []);

    const valides: ElementMediaSelectionne[] = [];
    const rejetes: string[] = [];

    for (const f of fichiers) {
      const type = (f.type || '').toLowerCase();
      const nom = (f.name || '').toLowerCase();
      const isImage = type.startsWith('image/') || /\.(jpe?g|png|webp|gif|avif|bmp|svg)$/i.test(nom);
      const isVideo = type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(nom);
      const isPdf = type === 'application/pdf' || nom.endsWith('.pdf');

      const tailleMax = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
      if (f.size > tailleMax) {
        rejetes.push(`${f.name} (${this.tailleLisible(f.size)})`);
        continue;
      }

      let previewUrl: string | undefined = undefined;
      if (isImage) {
        try {
          previewUrl = URL.createObjectURL(f);
        } catch (_) {}
      }

      valides.push({ file: f, previewUrl, isImage, isVideo, isPdf });
    }

    if (rejetes.length > 0) {
      this.dataService.showToast(
        `Fichier(s) trop volumineux ignoré(s) (max 20 Mo image, 50 Mo vidéo) : ${rejetes.join(', ')}`,
        true
      );
    }

    this.fichiersSelectionnes = [...this.fichiersSelectionnes, ...valides];
    input.value = '';
    this.cdr.detectChanges();
  }

  retirerFichier(index: number): void {
    const item = this.fichiersSelectionnes[index];
    if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(item.previewUrl); } catch (_) {}
    }
    this.fichiersSelectionnes.splice(index, 1);
  }

  viderSelection(): void {
    for (const item of this.fichiersSelectionnes) {
      if (item?.previewUrl && item.previewUrl.startsWith('blob:')) {
        try { URL.revokeObjectURL(item.previewUrl); } catch (_) {}
      }
    }
    this.fichiersSelectionnes = [];
  }

  sauvegarderAlbum(): void {
    if (!this.titreEvenement?.trim()) {
      this.dataService.showToast("Veuillez saisir le titre de l'événement.", true);
      return;
    }

    const titre = this.titreEvenement.trim();
    const typeEv = this.typeEvenement?.trim() || "Restauration d'Entreprise";
    const nbConvivesStr = this.nombreConvives !== null && this.nombreConvives !== undefined && this.nombreConvives > 0
      ? `${this.nombreConvives} invités`
      : '';
    const lieuEv = this.lieu?.trim() || '';
    const desc = this.description?.trim() || '';
    const fichiers = this.fichiersSelectionnes.map(item => item.file);

    if (this.modeEdition && this.albumEnEdition) {
      const ancientNom = this.albumEnEdition.titre;
      this.api.modifierAlbum({
        ancienTitre: ancientNom,
        nouveauTitre: titre,
        typeEvenement: typeEv,
        nombreConvives: nbConvivesStr,
        lieu: lieuEv,
        description: desc,
        visiblePublic: this.visiblePublicAlbum
      }).subscribe({
        next: () => {
          if (fichiers.length > 0) {
            this.uploadBg.televerserMedias(
              fichiers,
              titre,
              undefined,
              typeEv,
              nbConvivesStr,
              lieuEv,
              desc,
              this.visiblePublicAlbum,
              () => {
                this.chargerMedias();
              }
            );
          } else {
            this.chargerMedias();
          }

          this.dataService.showToast('Album modifié avec succès !');
          this.modaleCreationOuverte = false;
          this.modeEdition = false;
          this.albumEnEdition = null;
          this.viderSelection();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Erreur lors de la modification de l'album", err);
          this.dataService.showToast("Erreur lors de la modification de l'album.", true);
        }
      });
      return;
    }

    // Mode Création
    if (this.fichiersSelectionnes.length === 0) {
      this.dataService.showToast('Sélectionnez au moins une photo pour cet album.', true);
      return;
    }

    // Lancer le téléversement en arrière-plan
    this.uploadBg.televerserMedias(
      fichiers,
      titre,
      undefined,
      typeEv,
      nbConvivesStr,
      lieuEv,
      desc,
      this.visiblePublicAlbum,
      () => {
        this.chargerMedias();
      }
    );

    this.modaleCreationOuverte = false;
    this.viderSelection();
  }

  /**
   * Bascule la visibilité publique d'un album complet (instantané / optimiste).
   */
  toggleVisibiliteAlbum(album: AlbumEvenement, event?: Event): void {
    if (event) event.stopPropagation();
    const ancientEtat = album.visiblePublic;
    const nouvelEtat = !ancientEtat;

    // 1. Mise à jour locale immédiate (optimiste)
    album.visiblePublic = nouvelEtat;
    album.medias.forEach(m => m.visiblePublic = nouvelEtat);
    for (const m of this.medias) {
      if ((m.evenementNom || '').trim().toLowerCase() === album.titre.trim().toLowerCase()) {
        m.visiblePublic = nouvelEtat;
      }
    }
    if (this.albumSelectionne && this.albumSelectionne.titre.toLowerCase() === album.titre.toLowerCase()) {
      this.albumSelectionne.visiblePublic = nouvelEtat;
      this.albumSelectionne.medias.forEach(m => m.visiblePublic = nouvelEtat);
      this.albumSelectionne.nombreVisibles = nouvelEtat ? this.albumSelectionne.medias.length : 0;
      this.albumSelectionne.nombreMasques = nouvelEtat ? 0 : this.albumSelectionne.medias.length;
    }
    this.cdr.detectChanges();

    // 2. Appel asynchrone en arrière-plan
    this.api.changerVisibiliteAlbum(album.titre, nouvelEtat).subscribe({
      next: () => {
        this.dataService.showToast(
          nouvelEtat
            ? `Album « ${album.titre} » maintenant visible sur le site public.`
            : `Album « ${album.titre} » masqué du site public.`
        );
      },
      error: (err) => {
        console.error('Erreur bascule visibilité album', err);
        // Annuler en cas d'erreur
        album.visiblePublic = ancientEtat;
        album.medias.forEach(m => m.visiblePublic = ancientEtat);
        for (const m of this.medias) {
          if ((m.evenementNom || '').trim().toLowerCase() === album.titre.trim().toLowerCase()) {
            m.visiblePublic = ancientEtat;
          }
        }
        if (this.albumSelectionne && this.albumSelectionne.titre.toLowerCase() === album.titre.toLowerCase()) {
          this.albumSelectionne.visiblePublic = ancientEtat;
          this.albumSelectionne.medias.forEach(m => m.visiblePublic = ancientEtat);
          const visibles = this.albumSelectionne.medias.filter(m => m.visiblePublic !== false).length;
          this.albumSelectionne.nombreVisibles = visibles;
          this.albumSelectionne.nombreMasques = this.albumSelectionne.medias.length - visibles;
        }
        this.dataService.showToast('Erreur lors du changement de visibilité.', true);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Bascule la visibilité publique d'une photo individuelle (instantané / optimiste).
   */
  toggleVisibiliteMedia(media: MediaDto, event?: Event): void {
    if (event) event.stopPropagation();
    const ancientEtat = media.visiblePublic !== false;
    const nouvelEtat = !ancientEtat;

    // 1. Mise à jour locale immédiate (optimiste)
    media.visiblePublic = nouvelEtat;
    const index = this.medias.findIndex(m => m.id === media.id);
    if (index !== -1) {
      this.medias[index].visiblePublic = nouvelEtat;
    }
    if (this.albumSelectionne) {
      const idxAlbum = this.albumSelectionne.medias.findIndex(m => m.id === media.id);
      if (idxAlbum !== -1) {
        this.albumSelectionne.medias[idxAlbum].visiblePublic = nouvelEtat;
      }
      const visibles = this.albumSelectionne.medias.filter(m => m.visiblePublic !== false).length;
      this.albumSelectionne.nombreVisibles = visibles;
      this.albumSelectionne.nombreMasques = this.albumSelectionne.medias.length - visibles;
      this.albumSelectionne.visiblePublic = visibles > 0;
    }
    this.cdr.detectChanges();

    // 2. Appel asynchrone en arrière-plan
    this.api.changerVisibiliteMedia(media.id, nouvelEtat).subscribe({
      next: (maj) => {
        media.visiblePublic = maj.visiblePublic;
        this.dataService.showToast(
          nouvelEtat
            ? 'Photo rendue visible sur le site public.'
            : 'Photo masquée du site public.'
        );
      },
      error: (err) => {
        console.error('Erreur bascule visibilité média', err);
        // Annuler en cas d'erreur
        media.visiblePublic = ancientEtat;
        if (index !== -1) {
          this.medias[index].visiblePublic = ancientEtat;
        }
        if (this.albumSelectionne) {
          const idxAlbum = this.albumSelectionne.medias.findIndex(m => m.id === media.id);
          if (idxAlbum !== -1) {
            this.albumSelectionne.medias[idxAlbum].visiblePublic = ancientEtat;
          }
          const visibles = this.albumSelectionne.medias.filter(m => m.visiblePublic !== false).length;
          this.albumSelectionne.nombreVisibles = visibles;
          this.albumSelectionne.nombreMasques = this.albumSelectionne.medias.length - visibles;
          this.albumSelectionne.visiblePublic = visibles > 0;
        }
        this.dataService.showToast('Erreur lors du changement de visibilité.', true);
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Ajout direct de photos à un album existant.
   */
  surAjoutDirectAlbum(event: Event): void {
    const input = event.target as HTMLInputElement;
    const fichiers = Array.from(input.files || []);
    if (fichiers.length === 0 || !this.albumSelectionne) return;

    const valides: File[] = [];
    const rejetes: string[] = [];

    for (const f of fichiers) {
      const type = (f.type || '').toLowerCase();
      const isVideo = type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi)$/i.test(f.name);
      const tailleMax = isVideo ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
      if (f.size > tailleMax) {
        rejetes.push(`${f.name} (${this.tailleLisible(f.size)})`);
      } else {
        valides.push(f);
      }
    }

    if (rejetes.length > 0) {
      this.dataService.showToast(
        `Fichier(s) trop volumineux ignoré(s) (max 20 Mo image, 50 Mo vidéo) : ${rejetes.join(', ')}`,
        true
      );
    }

    if (valides.length === 0) {
      input.value = '';
      return;
    }

    const album = this.albumSelectionne;
    this.uploadBg.televerserMedias(
      valides,
      album.titre,
      undefined,
      album.typeEvenement,
      album.nombreConvives,
      album.lieu,
      album.description,
      album.visiblePublic,
      () => {
        this.chargerMedias();
      }
    );

    input.value = '';
  }

  // ═════════════════════════════════════════════════════════════════
  // GESTION DE LA SÉLECTION MULTIPLE DE PHOTOS DANS L'ALBUM
  // ═════════════════════════════════════════════════════════════════

  estMediaSelectionne(m: MediaDto): boolean {
    return this.mediasSelectionnesIds.has(m.id);
  }

  toggleSelectionMedia(m: MediaDto, event?: Event): void {
    if (event) event.stopPropagation();
    if (this.mediasSelectionnesIds.has(m.id)) {
      this.mediasSelectionnesIds.delete(m.id);
    } else {
      this.mediasSelectionnesIds.add(m.id);
    }
    this.cdr.detectChanges();
  }

  toutSelectionnerAlbum(): void {
    if (!this.albumSelectionne) return;
    for (const m of this.albumSelectionne.medias) {
      this.mediasSelectionnesIds.add(m.id);
    }
    this.cdr.detectChanges();
  }

  deselectionnerTout(): void {
    this.mediasSelectionnesIds.clear();
    this.cdr.detectChanges();
  }

  get nombreMediasSelectionnes(): number {
    return this.mediasSelectionnesIds.size;
  }

  get tousMediasAlbumSelectionnes(): boolean {
    if (!this.albumSelectionne || this.albumSelectionne.medias.length === 0) return false;
    return this.albumSelectionne.medias.every(m => this.mediasSelectionnesIds.has(m.id));
  }

  toggleToutSelectionner(): void {
    if (this.tousMediasAlbumSelectionnes) {
      this.deselectionnerTout();
    } else {
      this.toutSelectionnerAlbum();
    }
  }

  get mediasSelectionnesListe(): MediaDto[] {
    if (!this.albumSelectionne) return [];
    return this.albumSelectionne.medias.filter(m => this.mediasSelectionnesIds.has(m.id));
  }

  toggleVisibiliteSelection(rendreVisible: boolean): void {
    const list = this.mediasSelectionnesListe;
    if (list.length === 0) return;
    for (const m of list) {
      if ((m.visiblePublic !== false) !== rendreVisible) {
        this.toggleVisibiliteMedia(m);
      }
    }
  }

  // ═════════════════════════════════════════════════════════════════
  // SUPPRESSION AVEC POPUP DE CONFIRMATION PERSONNALISÉ (INDIVIDUEL OU GROUPÉ)
  // ═════════════════════════════════════════════════════════════════

  demanderSuppressionMediaUnique(m: MediaDto, event?: Event): void {
    if (event) event.stopPropagation();
    this.mediasASupprimer = [m];
    this.modaleConfirmationSuppression = true;
  }

  demanderSuppressionSelection(event?: Event): void {
    if (event) event.stopPropagation();
    const liste = this.mediasSelectionnesListe;
    if (liste.length === 0) return;
    this.mediasASupprimer = [...liste];
    this.modaleConfirmationSuppression = true;
  }

  annulerSuppression(): void {
    if (this.suppressionEnCours) return;
    this.modaleConfirmationSuppression = false;
    this.mediasASupprimer = [];
  }

  confirmerSuppression(): void {
    if (this.mediasASupprimer.length === 0 || this.suppressionEnCours) return;

    this.suppressionEnCours = true;
    const aSupprimer = [...this.mediasASupprimer];
    const requetes = aSupprimer.map(m => this.api.deleteMedia(m.id).pipe(
      catchError(err => {
        console.error(`Erreur suppression média ${m.id}`, err);
        return of(null);
      })
    ));

    forkJoin(requetes).subscribe({
      next: (resultats) => {
        const nbSucces = resultats.filter(r => r !== null).length;
        
        // Retirer les médias supprimés localement pour réactivité instantanée
        const idsSupprimes = new Set(aSupprimer.map(m => m.id));
        this.medias = this.medias.filter(m => !idsSupprimes.has(m.id));
        
        if (this.albumSelectionne) {
          this.albumSelectionne.medias = this.albumSelectionne.medias.filter(m => !idsSupprimes.has(m.id));
          const visibles = this.albumSelectionne.medias.filter(m => m.visiblePublic !== false).length;
          this.albumSelectionne.nombreVisibles = visibles;
          this.albumSelectionne.nombreMasques = this.albumSelectionne.medias.length - visibles;
          this.albumSelectionne.visiblePublic = visibles > 0;
        }

        // Nettoyer la sélection
        for (const id of idsSupprimes) {
          this.mediasSelectionnesIds.delete(id);
        }

        if (nbSucces > 0) {
          this.dataService.showToast(
            nbSucces === 1 
              ? 'Photo retirée de l’album avec succès.' 
              : `${nbSucces} photos retirées de l’album avec succès.`
          );
        } else {
          this.dataService.showToast('La suppression a échoué.', true);
        }

        this.modaleConfirmationSuppression = false;
        this.mediasASupprimer = [];
        this.suppressionEnCours = false;

        // Recharger les médias pour synchronisation avec le serveur
        this.chargerMedias();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression groupée', err);
        this.dataService.showToast('Une erreur est survenue lors de la suppression.', true);
        this.suppressionEnCours = false;
        this.cdr.detectChanges();
      }
    });
  }

  supprimerMedia(m: MediaDto, event?: Event): void {
    this.demanderSuppressionMediaUnique(m, event);
  }

  // --- Lightbox ---

  ouvrirLightbox(m: MediaDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.lightboxMedia = m;
  }

  fermerLightbox(): void {
    this.lightboxMedia = null;
  }

  get lightboxMediasListe(): MediaDto[] {
    if (this.albumSelectionne && this.albumSelectionne.medias.length > 0) {
      return this.albumSelectionne.medias;
    }
    return this.lightboxMedia ? [this.lightboxMedia] : [];
  }

  get indexLightboxActuel(): number {
    if (!this.lightboxMedia) return -1;
    return this.lightboxMediasListe.findIndex(m => m.id === this.lightboxMedia?.id || m.url === this.lightboxMedia?.url);
  }

  get aPhotoPrecedente(): boolean {
    return this.indexLightboxActuel > 0;
  }

  get aPhotoSuivante(): boolean {
    const list = this.lightboxMediasListe;
    const idx = this.indexLightboxActuel;
    return idx >= 0 && idx < list.length - 1;
  }

  photoPrecedente(event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.lightboxMediasListe;
    const idx = this.indexLightboxActuel;
    if (idx > 0) {
      this.lightboxMedia = list[idx - 1];
    }
  }

  photoSuivante(event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.lightboxMediasListe;
    const idx = this.indexLightboxActuel;
    if (idx >= 0 && idx < list.length - 1) {
      this.lightboxMedia = list[idx + 1];
    }
  }

  @HostListener('document:keydown', ['$event'])
  surToucheClavier(event: KeyboardEvent): void {
    if (this.lightboxMedia) {
      if (event.key === 'Escape') {
        this.fermerLightbox();
      } else if (event.key === 'ArrowLeft') {
        this.photoPrecedente();
      } else if (event.key === 'ArrowRight') {
        this.photoSuivante();
      }
      return;
    }
    if (event.key === 'Escape') {
      if (this.modaleAlbumVisible) {
        this.fermerModaleAlbum();
      } else if (this.modaleCreationOuverte) {
        this.fermerModaleCreation();
      }
    }
  }

  tailleLisible(octets?: number): string {
    if (!octets || octets <= 0) return '';
    const unites = ['o', 'Ko', 'Mo', 'Go'];
    let valeur = octets, i = 0;
    while (valeur >= 1024 && i < unites.length - 1) { valeur /= 1024; i++; }
    return `${valeur.toFixed(valeur < 10 && i > 0 ? 1 : 0)} ${unites[i]}`;
  }
}
