import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Service singleton qui orchestre le rafraîchissement des listes de demandes
 * après chaque transition d'état. Les composants s'y abonnent et rechargent
 * leurs données dès qu'une action modifie une demande.
 */
@Injectable({
  providedIn: 'root'
})
export class DemandeWorkflowService {
  /** Émet un timestamp à chaque fois qu'une liste doit être rafraîchie */
  private refreshTrigger$ = new BehaviorSubject<number>(Date.now());

  /** Observable auquel les composants s'abonnent */
  readonly refresh$ = this.refreshTrigger$.asObservable();

  /** Déclenche un rafraîchissement global */
  triggerRefresh(): void {
    this.refreshTrigger$.next(Date.now());
  }
}
