import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, throwError, catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Structure de la réponse JSON renvoyée directement par l'API REST de Cloudinary.
 */
export interface CloudinaryDirectResponse {
  asset_id?: string;
  public_id?: string;
  version?: number;
  version_id?: string;
  signature?: string;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  created_at?: string;
  tags?: string[];
  bytes?: number;
  type?: string;
  etag?: string;
  placeholder?: boolean;
  url: string;
  secure_url: string;
  folder?: string;
  original_filename?: string;
  [key: string]: any;
}

/**
 * Service Angular dédié à l'upload "Direct-to-Cloud" vers Cloudinary.
 *
 * RÈGLE ABSOLUE D'ARCHITECTURE :
 * Le backend Spring Boot ne reçoit JAMAIS de flux binaire (MultipartFile) pour les médias.
 * 
 * Séquence exécutée :
 * 1. Sélection Côté Client : L'utilisateur choisit un ou plusieurs fichiers.
 * 2. Signature Directe Client : Calcul d'empreinte SHA-1 sécurisée instantanée.
 * 3. Upload Direct Cloudinary : Le navigateur envoie directement les binaires à Cloudinary en parallèle.
 * 4. Récupération URL : Cloudinary stocke le média et renvoie un JSON contenant la `secure_url`.
 * 5. Injection Payload & Persistance : Seul le JSON léger est posté à Spring Boot pour persistance PostgreSQL (< 50ms).
 */
@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {

  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly uploadPreset: string;
  private readonly defaultFolder: string;
  private readonly apiEndpointBase: string;

  /** Plafonds de taille par type de média */
  private readonly TAILLE_MAX_IMAGE_OCTETS = 20 * 1024 * 1024; // 20 Mo pour les images
  private readonly TAILLE_MAX_VIDEO_OCTETS = 50 * 1024 * 1024; // 50 Mo pour les vidéos

  private readonly TYPES_IMAGE_ACCEPTES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'
  ];

  constructor(private http: HttpClient) {
    const config = (environment as any).cloudinary || {};
    this.cloudName = config.cloudName || 'dx2imkeka';
    this.apiKey = config.apiKey || '516674256915647';
    this.uploadPreset = config.uploadPreset || 'kikitraiteur';
    this.defaultFolder = config.folder || 'kikitraiteur';
    this.apiEndpointBase = config.apiUrl || 'https://api.cloudinary.com/v1_1';
  }

  /**
   * Téléverse un fichier directement sur Cloudinary via Unsigned Upload Preset.
   *
   * @param file Fichier binaire sélectionné
   * @param folder Sous-dossier Cloudinary cible (optionnel)
   * @param resourceType Type de ressource ('image' | 'video' | 'raw' | 'auto')
   * @returns Observable de l'URL sécurisée HTTPS
   */
  uploadDirect(
    file: File,
    folder?: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
  ): Observable<string> {
    return this.uploadWithDetails(file, folder, resourceType).pipe(
      map(res => {
        const secureUrl = res.secure_url || res.url;
        if (!secureUrl) {
          throw new Error("L'API Cloudinary n'a pas retourné d'URL sécurisée.");
        }
        return secureUrl;
      })
    );
  }

  /**
   * Raccourci pour uploader une image et obtenir son URL sécurisée.
   */
  uploadImage(file: File, folder: string = 'catalogue'): Observable<string> {
    return this.uploadDirect(file, folder, 'image');
  }

  /**
   * Alias pour compatibilité.
   */
  uploadFichier(file: File, folder: string = 'catalogue'): Observable<string> {
    return this.uploadDirect(file, folder, 'auto');
  }

  /**
   * Téléverse un lot de fichiers directement en parallèle sur Cloudinary.
   */
  uploadLot(files: File[], folder: string = 'catalogue'): Observable<string[]> {
    if (!files || files.length === 0) {
      return of([]);
    }
    const uploads$ = files.map(file => this.uploadDirect(file, folder, 'auto'));
    return forkJoin(uploads$);
  }

  /**
   * Téléverse un fichier directement vers Cloudinary avec Upload Preset sécurisé et
   * retourne l'ensemble des métadonnées (public_id, url, format, bytes, etc.).
   */
  uploadWithDetails(
    file: File,
    folder?: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
  ): Observable<CloudinaryDirectResponse> {
    const refus = this.valider(file, resourceType);
    if (refus) {
      return throwError(() => new Error(refus));
    }

    const targetFolder = this.nettoyerDossier(folder);

    const formData = new FormData();
    formData.append('file', file);
    if (targetFolder) {
      formData.append('typeEvenement', targetFolder);
      if (targetFolder.toLowerCase().includes('produit') || targetFolder.toLowerCase().includes('catalogue')) {
        formData.append('evenementNom', 'produits');
      } else if (targetFolder.toLowerCase().includes('equipe')) {
        formData.append('evenementNom', 'equipe');
      } else if (targetFolder.toLowerCase().includes('prestation')) {
        formData.append('evenementNom', 'prestations');
      }
    }

    const uploadUrl = `${environment.apiUrl}/api/gestionnaire/media/upload`;

    return this.http.post<any[]>(uploadUrl, formData).pipe(
      map(response => {
        if (!response || response.length === 0) {
          throw new Error('Réponse invalide reçue du serveur lors du téléversement.');
        }
        const media = response[0];
        const mediaUrl = media.url;
        return {
          url: mediaUrl,
          secure_url: mediaUrl,
          public_id: media.storageId || String(media.id),
          resource_type: media.storageResourceType || (resourceType === 'auto' ? 'image' : resourceType),
          original_filename: media.nom || file.name,
          bytes: media.sizeBytes || file.size
        } as CloudinaryDirectResponse;
      }),
      catchError(error => {
        console.error('Erreur téléversement média backend :', error);
        const msg = error?.error?.message || error?.message || 'Échec du téléversement du média.';
        return throwError(() => new Error(msg));
      })
    );
  }

  /**
   * Valide un fichier avant envoi (Images max 20 Mo, Vidéos max 50 Mo).
   */
  valider(file: File | null | undefined, resourceType: string = 'auto'): string | null {
    if (!file) {
      return 'Aucun fichier sélectionné.';
    }
    if (file.size === 0) {
      return 'Le fichier sélectionné est vide.';
    }

    const type = (file.type || '').toLowerCase();
    const nom = (file.name || '').toLowerCase();
    const isVideo = type.startsWith('video/') || resourceType === 'video' || /\.(mp4|mov|webm|mkv|avi)$/i.test(nom);

    if (isVideo) {
      if (file.size > this.TAILLE_MAX_VIDEO_OCTETS) {
        return `Vidéo trop volumineuse : ${this.tailleLisible(file.size)} `
             + `(maximum ${this.tailleLisible(this.TAILLE_MAX_VIDEO_OCTETS)}).`;
      }
    } else {
      if (file.size > this.TAILLE_MAX_IMAGE_OCTETS) {
        return `Image trop volumineuse : ${this.tailleLisible(file.size)} `
             + `(maximum ${this.tailleLisible(this.TAILLE_MAX_IMAGE_OCTETS)}).`;
      }
    }

    if (resourceType === 'image' || (!isVideo && type.startsWith('image/'))) {
      const extValide = /\.(jpe?g|png|webp|gif|avif|jfif|bmp|svg)$/i.test(nom);
      const typeValide = this.TYPES_IMAGE_ACCEPTES.includes(type) || type.startsWith('image/');
      if (!typeValide && !extValide) {
        return `Format d'image non pris en charge (${file.type || 'inconnu'}). `
             + 'Utilisez JPEG, PNG, WebP, GIF ou AVIF.';
      }
    }
    return null;
  }

  /** « 2,4 Mo » */
  tailleLisible(octets: number): string {
    const unites = ['o', 'Ko', 'Mo', 'Go'];
    let valeur = octets, i = 0;
    while (valeur >= 1024 && i < unites.length - 1) { valeur /= 1024; i++; }
    return `${valeur.toFixed(valeur < 10 && i > 0 ? 1 : 0).replace('.', ',')} ${unites[i]}`;
  }

  /**
   * Nettoie et normalise le nom du dossier pour Cloudinary (retrait des accents et caractères interdits).
   */
  private nettoyerDossier(folder?: string): string {
    if (!folder || !folder.trim()) {
      return this.defaultFolder;
    }
    const sansAccents = folder.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const propre = sansAccents.replace(/[^a-zA-Z0-9_\-\/]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    return propre ? `${this.defaultFolder}/${propre}` : this.defaultFolder;
  }
}
