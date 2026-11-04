import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  message: string;
  isError: boolean;
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  /**
   * Affiche une notification toast réactive.
   * Compatible avec la signature historique showToast(message, isError).
   */
  showToast(message: string, isError = false, duration = 4000): void {
    if (!message || !message.trim()) return;

    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    const toast: ToastMessage = { id, message, isError, visible: true };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    setTimeout(() => {
      this.toastsSignal.update(toasts =>
        toasts.map(t => (t.id === id ? { ...t, visible: false } : t))
      );
      setTimeout(() => {
        this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
      }, 400);
    }, duration);
  }

  show(message: string, isError = false, duration = 4000): void {
    this.showToast(message, isError, duration);
  }

  success(message: string, duration = 4000): void {
    this.showToast(message, false, duration);
  }

  error(message: string, duration = 4000): void {
    this.showToast(message, true, duration);
  }
}
