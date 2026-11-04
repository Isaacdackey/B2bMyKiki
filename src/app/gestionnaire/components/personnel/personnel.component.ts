import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminPersonnelService, AdminUserResponse, AdminCreateUserRequest, AdminUpdateUserRequest } from '../../services/admin-personnel.service';
import { KikiDataService } from '../../../services/kiki-data.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

const CACHE_KEY = 'kiki_personnel_cache';

/** Liste des postes disponibles pour le personnel */
export const POSTES_PERSONNEL = [
  { value: 'ADMINISTRATION',      label: 'Administration / Direction' },
  { value: 'GESTIONNAIRE',        label: 'Gestionnaire (Back-office)' },
  { value: 'CHAUFFEUR',           label: 'Chauffeurs / Livreurs' },
  { value: 'CUISINIER',           label: 'Cuisine / Cuisiniers / Cuisinières' },
  { value: 'RESPONSABLE_CUISINE', label: 'Responsable Cuisine' },
  { value: 'SOUS_CHEF',           label: 'Sous-Chef Cuisinier' },
  { value: 'SERVEUR',             label: 'Serveurs / Serveuses / Commis' },
  { value: 'PLONGEUR',            label: 'Plonge / Plongeurs' },
  { value: 'ECONOME',             label: 'Economes' },
  { value: 'MAGASINIER',          label: 'Magasiniers / PME' },
  { value: 'CONTROLEUR',          label: 'Contrôleurs / Qualité' },
  { value: 'PERSONNEL',           label: 'Personnel Général (RH, Compta, Commercial...)' },
  { value: 'AGENT_SECURITE',      label: 'Agents de Sécurité' },
];

/** Labels lisibles pour les rôles */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN:              'Administrateur',
  ADMINISTRATION:     'Administration',
  GESTIONNAIRE:       'Gestionnaire',
  PERSONNEL:          'Personnel',
  RESPONSABLE_CUISINE:'Responsable Cuisine',
  SOUS_CHEF:          'Sous-Chef Cuisinier',
  ECONOME:            'Econome',
  MAGASINIER:         'Magasinier',
  CONTROLEUR:         'Contrôleur',
  CUISINIER:          'Cuisine / Cuisinier',
  SERVEUR:            'Service / Salle',
  AIDE_CUISINIER:     'Aide Cuisinier',
  CHAUFFEUR:          'Chauffeur / Livreur',
  PLONGEUR:           'Plongeur',
  AGENT_SECURITE:     'Agent de Sécurité',
};

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './personnel.component.html',
  styleUrl: './personnel.component.css'
})
export class PersonnelComponent implements OnInit, OnDestroy {
  staffList: AdminUserResponse[] = [];
  filteredStaff: AdminUserResponse[] = [];
  displayedStaff: AdminUserResponse[] = [];
  loading = false;
  refreshing = false;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalElements = 0;
  totalFilteredElements = 0;
  totalPages = 1;
  private destroy$ = new Subject<void>();

  showModal = false;
  isEditing = false;
  isSubmitting = false;

  /** Utilisateur sélectionné pour la vue détaillée (popup Voir) */
  viewUser: AdminUserResponse | null = null;
  showViewModal = false;

  /** Résultat d'un reset d'accès, affiché dans une modal dédiée */
  resetResult: AdminUserResponse | null = null;
  showResetModal = false;

  // --- Modal Confirmation Générique ---
  showConfirmModal = false;
  confirmTitle = '';
  confirmMessage = '';
  confirmBtnText = '';
  confirmBtnClass = '';
  confirmBtnIcon = '';
  confirmIconClass = '';
  confirmIcon = '';
  pendingAction = false;
  confirmActionFn: () => void = () => {};

  formData: any = {
    id: null,
    fullName: '',
    username: '',
    role: 'ADMINISTRATION',
    active: true
  };

  newlyCreatedUser: AdminUserResponse | null = null;

  /** Expose la liste des postes au template */
  readonly postes = POSTES_PERSONNEL;
  readonly roleLabels = ROLE_LABELS;

  personnelSearchQuery = '';
  personnelFilterRole = 'ALL';
  personnelFilterStatus = 'ALL';

  private subs: Subscription[] = [];

  constructor(
    private personnelService: AdminPersonnelService,
    private toast: KikiDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadStaff();
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStaff(silent = false): void {
    if (!silent) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }

    // Charger l'ensemble du personnel pour un filtrage et un tri alphabétique global
    const sub = this.personnelService.getAllStaff(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.staffList = res.content || [];
          this.totalElements = this.staffList.length;
          this.loading = false;
          this.refreshing = false;
          this.updateDisplayedStaff();
          this.cdr.detectChanges();
        },
        error: () => {
          this.toast.showToast('Erreur lors du chargement du personnel.');
          this.loading = false;
          this.refreshing = false;
          this.cdr.detectChanges();
        }
      });
    this.subs.push(sub);
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] || role;
  }

  getStaffDisplayBadge(staff: AdminUserResponse | null | undefined): string {
    if (!staff) return '';
    if (staff.username === 'kiki.admin' || (staff.role === 'ADMIN' && staff.username === 'kiki.admin')) {
      return 'Administrateur';
    }
    if (staff.poste) {
      if (staff.poste.toUpperCase() === 'ADMIN' || staff.poste.toUpperCase() === 'ADMINISTRATION') {
        return 'Administration';
      }
      return staff.poste;
    }
    if (staff.departement) {
      if (staff.departement.toUpperCase() === 'ADMIN' || staff.departement.toUpperCase() === 'ADMINISTRATION') {
        return 'Administration';
      }
      return staff.departement;
    }
    if (staff.role === 'ADMINISTRATION' || staff.role === 'ADMIN') {
      return 'Administration';
    }
    return this.roleLabels[staff.role] || staff.role;
  }

  getRoleBadgeClass(staff: AdminUserResponse | null | undefined): string {
    if (!staff) return '';
    if (staff.username === 'kiki.admin' || (staff.role === 'ADMIN' && staff.username === 'kiki.admin')) {
      return 'role-admin';
    }
    const badge = this.getStaffDisplayBadge(staff).toLowerCase();
    if (badge.includes('administration')) {
      return 'role-administration';
    }
    return 'role-' + (staff.role || '').toLowerCase();
  }

  isSuperAdmin(staff: AdminUserResponse | null | undefined): boolean {
    return !!staff && staff.username === 'kiki.admin';
  }

  // --- Modal Voir ---
  openViewModal(user: AdminUserResponse): void {
    this.viewUser = user;
    this.showViewModal = true;
  }

  closeViewModal(): void {
    this.showViewModal = false;
    this.viewUser = null;
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.updateDisplayedStaff();
  }

  updateDisplayedStaff(): void {
    let filtered = (this.staffList || []).filter(u => {
      if (this.personnelFilterRole !== 'ALL') {
        if (this.personnelFilterRole === 'ADMINISTRATION') {
          const isAdm = u.role === 'ADMINISTRATION' ||
                        (u.poste && (u.poste.toUpperCase() === 'ADMIN' || u.poste.toUpperCase() === 'ADMINISTRATION')) ||
                        (u.departement && (u.departement.toUpperCase() === 'ADMIN' || u.departement.toUpperCase() === 'ADMINISTRATION')) ||
                        (u.role === 'ADMIN' && u.username !== 'kiki.admin');
          if (!isAdm) return false;
        } else if (this.personnelFilterRole === 'ADMIN') {
          if (u.username !== 'kiki.admin') return false;
        } else if (u.role !== this.personnelFilterRole) {
          return false;
        }
      }
      
      if (this.personnelFilterStatus === 'ACTIF' && !u.active) return false;
      if (this.personnelFilterStatus === 'INACTIF' && u.active) return false;
      
      if (this.personnelSearchQuery && this.personnelSearchQuery.trim()) {
        const query = this.personnelSearchQuery.trim().toLowerCase();
        const matchName = (u.fullName || '').toLowerCase().includes(query);
        const matchUsername = (u.username || '').toLowerCase().includes(query);
        const matchRole = (this.roleLabels[u.role] || u.role || '').toLowerCase().includes(query);
        const matchBadge = this.getStaffDisplayBadge(u).toLowerCase().includes(query);
        return matchName || matchUsername || matchRole || matchBadge;
      }
      return true;
    });

    // Tri alphabétique systématique par Nom complet (A-Z)
    filtered.sort((a, b) => {
      const nomA = (a.fullName || a.username || '').trim();
      const nomB = (b.fullName || b.username || '').trim();
      return nomA.localeCompare(nomB, 'fr', { sensitivity: 'base' });
    });

    // Précalculer _roleLabel pour le template
    filtered.forEach(u => {
      (u as any)._roleLabel = this.getStaffDisplayBadge(u);
    });

    this.filteredStaff = filtered;
    this.totalFilteredElements = filtered.length;
    this.totalPages = Math.max(1, Math.ceil(this.totalFilteredElements / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.displayedStaff = this.filteredStaff.slice(startIndex, startIndex + this.pageSize);
    this.cdr.detectChanges();
  }

  // --- Pagination ---

  getTotalPages(): number {
    return this.totalPages === 0 ? 1 : this.totalPages;
  }

  getPageArray(): (number | string)[] {
    return this.getPaginationArray(this.currentPage, this.getTotalPages());
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages() && page !== this.currentPage) {
      this.currentPage = page;
      const startIndex = (this.currentPage - 1) * this.pageSize;
      this.displayedStaff = this.filteredStaff.slice(startIndex, startIndex + this.pageSize);
      this.cdr.detectChanges();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getDebutIndex(): number {
    return this.totalFilteredElements === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  getFinIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalFilteredElements);
  }
  // ------------------

  openCreateModal(): void {
    this.isEditing = false;
    this.newlyCreatedUser = null;
    this.isSubmitting = false;
    this.formData = { id: null, fullName: '', username: '', role: 'ADMINISTRATION', active: true };
    this.showModal = true;
  }

  openEditModal(user: AdminUserResponse): void {
    this.isEditing = true;
    this.newlyCreatedUser = null;
    this.isSubmitting = false;
    let initialRole = user.role;
    if (user.username !== 'kiki.admin' && (user.role === 'ADMIN' || (user.poste && user.poste.toUpperCase() === 'ADMIN'))) {
      initialRole = 'ADMINISTRATION';
    }
    this.formData = {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      role: initialRole,
      active: user.active
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isSubmitting = false;
    this.newlyCreatedUser = null;
  }

  saveUser(): void {
    // Prévenir les doubles soumissions
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    console.log("saveUser() called, isEditing:", this.isEditing);

    if (this.isEditing) {
      const request: AdminUpdateUserRequest = {
        fullName: this.formData.fullName,
        username: this.formData.username,
        role: this.formData.role,
        active: this.formData.active
      };

      console.log("Sending PUT request to update user...", request);
      const sub = this.personnelService.updateStaffUser(this.formData.id, request).subscribe({
        next: () => {
          console.log("PUT request successful!");
          this.isSubmitting = false;
          this.toast.showToast('Utilisateur mis à jour avec succès.');
          this.closeModal();
          this.loadStaff(true); // rafraîchissement silencieux
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("PUT request failed:", err);
          this.isSubmitting = false;
          this.toast.showToast(err.error?.message || 'Erreur lors de la mise à jour.');
          this.cdr.detectChanges();
        }
      });
      this.subs.push(sub);
    } else {
      const request: AdminCreateUserRequest = {
        fullName: this.formData.fullName,
        username: this.formData.username,
        role: this.formData.role
      };

      console.log("Sending POST request to create user...", request);
      const sub = this.personnelService.createStaffUser(request).subscribe({
        next: (createdUser) => {
          console.log("POST request successful!", createdUser);
          this.isSubmitting = false;
          this.newlyCreatedUser = createdUser;
          // Ne pas fermer la modal : l'admin doit voir et copier le mot de passe
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("POST request failed:", err);
          this.isSubmitting = false;
          this.toast.showToast(err.error?.message || 'Erreur lors de la création.');
          this.cdr.detectChanges();
        }
      });
      this.subs.push(sub);
    }
  }

  deleteUser(user: AdminUserResponse): void {
    this.confirmTitle = 'Supprimer le personnel';
    this.confirmMessage = `Voulez-vous vraiment supprimer <strong>${user.fullName}</strong> ?<br>Cette action est irréversible.`;
    this.confirmBtnText = 'Supprimer';
    this.confirmBtnClass = 'btn-delete-confirm';
    this.confirmBtnIcon = 'fa-trash-alt';
    this.confirmIconClass = 'modal-icon-danger';
    this.confirmIcon = 'fa-exclamation-triangle';
    
    this.confirmActionFn = () => {
      this.pendingAction = true;
      const sub = this.personnelService.deleteStaffUser(user.id).subscribe({
        next: () => {
          this.pendingAction = false;
          this.showConfirmModal = false;
          this.toast.showToast('Utilisateur supprimé.');
          this.loadStaff(true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.pendingAction = false;
          this.toast.showToast(err.error?.message || 'Erreur lors de la suppression.');
          this.cdr.detectChanges();
        }
      });
      this.subs.push(sub);
    };
    this.showConfirmModal = true;
  }

  /**
   * Réinitialise l'accès d'un utilisateur :
   * génère un nouveau mot de passe temporaire et ouvre la modal de résultat.
   */
  resetAccess(user: AdminUserResponse): void {
    this.confirmTitle = 'Réinitialiser l\'accès';
    this.confirmMessage = `Voulez-vous réinitialiser l'accès de <strong>${user.fullName}</strong> ?<br>Un nouveau mot de passe temporaire sera généré.`;
    this.confirmBtnText = 'Réinitialiser';
    this.confirmBtnClass = 'btn-warning-confirm';
    this.confirmBtnIcon = 'fa-redo-alt';
    this.confirmIconClass = 'modal-icon-warning';
    this.confirmIcon = 'fa-redo-alt';

    this.confirmActionFn = () => {
      this.pendingAction = true;
      const sub = this.personnelService.resetAccess(user.id).subscribe({
        next: (result) => {
          this.pendingAction = false;
          this.showConfirmModal = false;
          this.resetResult = result;
          this.showResetModal = true;
          this.loadStaff(true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.pendingAction = false;
          this.toast.showToast(err.error?.message || 'Erreur lors de la réinitialisation.');
          this.cdr.detectChanges();
        }
      });
      this.subs.push(sub);
    };
    this.showConfirmModal = true;
  }

  closeResetModal(): void {
    this.showResetModal = false;
    this.resetResult = null;
  }

  /**
   * Active ou désactive un compte en 1 clic.
   */
  toggleActive(user: AdminUserResponse): void {
    const action = user.active ? 'bloquer' : 'activer';
    const isBlocking = user.active;
    
    this.confirmTitle = isBlocking ? 'Bloquer le compte' : 'Activer le compte';
    this.confirmMessage = `Voulez-vous vraiment ${action} le compte de <strong>${user.fullName}</strong> ?`;
    this.confirmBtnText = isBlocking ? 'Bloquer' : 'Activer';
    this.confirmBtnClass = isBlocking ? 'btn-delete-confirm' : 'btn-success-confirm';
    this.confirmBtnIcon = isBlocking ? 'fa-ban' : 'fa-check-circle';
    this.confirmIconClass = isBlocking ? 'modal-icon-danger' : 'modal-icon-success';
    this.confirmIcon = isBlocking ? 'fa-ban' : 'fa-check-circle';

    this.confirmActionFn = () => {
      this.pendingAction = true;
      const sub = this.personnelService.toggleActive(user.id, !user.active).subscribe({
        next: (updated) => {
          this.pendingAction = false;
          this.showConfirmModal = false;
          // Mise à jour locale immédiate
          const idx = this.staffList.findIndex(s => s.id === updated.id);
          if (idx !== -1) this.staffList[idx] = updated;
          if (this.viewUser && this.viewUser.id === updated.id) {
            this.viewUser = updated;
          }
          this.toast.showToast(`Compte ${updated.active ? 'activé' : 'bloqué'} avec succès.`);
          this.loadStaff(true);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.pendingAction = false;
          this.toast.showToast(err.error?.message || 'Erreur lors du changement de statut.');
          this.cdr.detectChanges();
        }
      });
      this.subs.push(sub);
    };
    this.showConfirmModal = true;
  }

  /**
   * Copie le lien de connexion dans le presse-papier.
   */
  copyLoginUrl(url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      this.toast.showToast('Lien de connexion copié !');
    });
  }

  // --- Modal Confirmation Methods ---
  closeConfirmModal(): void {
    if (this.pendingAction) return;
    this.showConfirmModal = false;
  }

  executeConfirmAction(): void {
    if (this.confirmActionFn) {
      this.confirmActionFn();
    }
  }

  getPaginationArray(currentPage: number, totalPages: number): (number | string)[] {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i == 1 || i == totalPages || i >= currentPage - delta && i < currentPage + delta + 1) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  }
}
