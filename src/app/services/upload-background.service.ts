import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, tap } from 'rxjs';
import { GestionnaireApiService, MediaDto, EnregistrerMediaRequest } from './gestionnaire-api.service';
import { CloudinaryService, CloudinaryDirectResponse } from './cloudinary.service';
import { KikiDataService } from './kiki-data.service';

export interface TacheUpload {
  id: string;
  nomTache: string;
  totalFichiers: number;
  fichiersTraites: number;
  progression: number;
  enCours: boolean;
  erreur?: string;
}

/**
 * Service de gestion du téléversement en arrière-plan.
 * Utilise la stratégie Direct-to-Cloud :
 * 1. Téléversement direct et parallèle vers Cloudinary (sans goulot d'étranglement serveur).
 * 2. Suivi de progression en temps réel pour chaque fichier.
 * 3. Enregistrement ultra-rapide (<50ms) des métadonnées JSON dans PostgreSQL.
 */
@Injectable({
  providedIn: 'root'
})
export class UploadBackgroundService {
  private tacheActiveSubject = new BehaviorSubject<TacheUpload | null>(null);
  public tacheActive$ = this.tacheActiveSubject.asObservable();

  constructor(
    private api: GestionnaireApiService,
    private cloudinary: CloudinaryService,
    private dataService: KikiDataService
  ) {}

  public get estEnCours(): boolean {
    return this.tacheActiveSubject.value?.enCours ?? false;
  }

  public get tacheActive(): TacheUpload | null {
    return this.tacheActiveSubject.value;
  }

  /**
   * Lance un téléversement direct en arrière-plan persistant qui ne s'arrête pas lors des navigations.
   */
  public televerserMedias(
    fichiers: File[],
    evenementNom?: string,
    evenementId?: number,
    typeEvenement?: string,
    nombreConvives?: string,
    lieu?: string,
    description?: string,
    visiblePublic?: boolean,
    onComplete?: (ajoutes: MediaDto[]) => void
  ): void {
    if (!fichiers || fichiers.length === 0) return;

    const tacheId = 'upload_' + Date.now();
    const nom = evenementNom ? `Événement : ${evenementNom}` : 'Médiathèque';

    const tache: TacheUpload = {
      id: tacheId,
      nomTache: nom,
      totalFichiers: fichiers.length,
      fichiersTraites: 0,
      progression: 10,
      enCours: true
    };

    this.tacheActiveSubject.next(tache);
    this.dataService.showToast(`Téléversement de ${fichiers.length} photo(s) en cours...`);

    const dossier = evenementNom ? `evenements/${evenementNom}` : 'mediatheque';
    let termines = 0;

    // Téléversement direct vers le backend qui applique la stratégie : MinIO -> Cloudinary -> Local
    this.api.uploadMediaFiles(
      fichiers,
      evenementNom,
      evenementId,
      typeEvenement,
      nombreConvives,
      lieu,
      description,
      visiblePublic
    ).subscribe({
      next: (ajoutes: MediaDto[]) => {
        tache.progression = 100;
        tache.fichiersTraites = fichiers.length;
        this.tacheActiveSubject.next({ ...tache });
        this.terminerTache(tache, ajoutes, onComplete);
      },
      error: (uploadErr) => {
        console.error('Échec du téléversement backend :', uploadErr);
        const msg = uploadErr?.error?.message || uploadErr?.message || "Échec du téléversement des fichiers.";
        this.echouerTache(tache, msg);
      }
    });
  }

  private terminerTache(
    tache: TacheUpload,
    ajoutes: MediaDto[],
    onComplete?: (ajoutes: MediaDto[]) => void
  ): void {
    tache.fichiersTraites = tache.totalFichiers;
    tache.progression = 100;
    tache.enCours = false;
    this.tacheActiveSubject.next({ ...tache });

    const n = ajoutes?.length || tache.totalFichiers;
    this.dataService.showToast(`${n} photo${n > 1 ? 's' : ''} téléversée${n > 1 ? 's' : ''} avec succès !`);

    if (onComplete) {
      try {
        onComplete(ajoutes);
      } catch (e) {
        console.error('Erreur dans le callback onComplete :', e);
      }
    }

    // Effacer la tâche active après quelques secondes
    setTimeout(() => {
      if (this.tacheActiveSubject.value?.id === tache.id) {
        this.tacheActiveSubject.next(null);
      }
    }, 4000);
  }

  private echouerTache(tache: TacheUpload, message: string): void {
    tache.enCours = false;
    tache.erreur = message;
    this.tacheActiveSubject.next({ ...tache });
    this.dataService.showToast(message, true);

    setTimeout(() => {
      if (this.tacheActiveSubject.value?.id === tache.id) {
        this.tacheActiveSubject.next(null);
      }
    }, 6000);
  }

  private classifier(resourceType?: string, format?: string): string {
    if (resourceType === 'video') return 'VIDEO';
    if (resourceType === 'image') return 'IMAGE';
    if ((format || '').toLowerCase() === 'pdf') return 'PDF';
    return 'IMAGE';
  }
}
