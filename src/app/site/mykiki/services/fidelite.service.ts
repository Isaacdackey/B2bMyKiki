import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ConfigurationFideliteDto {
  id?: number;
  pointsBienvenue: number;
  seuilMontantPanier: number;
  pointsGagnesParSeuil: number;
  pointsRequisBonus: number;
  descriptionBonus?: string;
  produitsBonus?: { id: number; nom: string; prix: number; imageUrl?: string }[];
  pointsAvisClient?: number;
  delaiApparitionAvisHeures?: number;
  dureeValiditeAvisJours?: number;
}

@Injectable({ providedIn: 'root' })
export class FideliteService {
  private pointsSubject = new BehaviorSubject<number>(0);
  points$: Observable<number> = this.pointsSubject.asObservable();

  private configSubject = new BehaviorSubject<ConfigurationFideliteDto>({
    pointsBienvenue: 100,
    seuilMontantPanier: 5000,
    pointsGagnesParSeuil: 10,
    pointsRequisBonus: 500,
    descriptionBonus: 'Plat ou cocktail signature offert pour toute commande atteignant 500 points.',
    produitsBonus: [],
    pointsAvisClient: 20
  });
  config$: Observable<ConfigurationFideliteDto> = this.configSubject.asObservable();

  private modaleOuverteSubject = new BehaviorSubject<boolean>(false);
  modaleOuverte$: Observable<boolean> = this.modaleOuverteSubject.asObservable();

  constructor(private http: HttpClient) {}

  get points(): number {
    return this.pointsSubject.value;
  }

  get config(): ConfigurationFideliteDto {
    return this.configSubject.value;
  }

  chargerFidelite(): void {
    this.http.get<{ points: number }>(`${environment.apiUrl}/api/mykiki/fidelite`).subscribe({
      next: (r) => this.pointsSubject.next(r?.points ?? 0),
      error: () => this.pointsSubject.next(0)
    });
  }

  chargerConfigFidelite(): void {
    this.http.get<ConfigurationFideliteDto>(`${environment.apiUrl}/api/fidelite/config`).subscribe({
      next: (c) => {
        if (c) {
          this.configSubject.next(c);
        }
      },
      error: () => {}
    });
  }

  ouvrirModale(): void {
    this.chargerConfigFidelite();
    this.chargerFidelite();
    this.modaleOuverteSubject.next(true);
  }

  fermerModale(): void {
    this.modaleOuverteSubject.next(false);
  }
}
