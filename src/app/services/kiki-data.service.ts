import { Injectable } from '@angular/core';
import { ToastService } from '../core/services/toast.service';

export interface PrestationItem {
  id: string;
  title: string;
  desc: string;
  image: string;
  category?: string;
}

export interface ClientItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  organization?: string;
}

export interface RequestItem {
  id: string;
  clientId: string;
  prestationId: string;
  date: string;
  guests: number;
  isInstitution: boolean;
  organization?: string;
  status: 'pending' | 'approved' | 'rejected' | string;
  dateSubmitted: string;
  message: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  prestationTitle?: string;
  location?: string;
  time?: string;
  signatureGastronomique?: string;
}

export interface DevisItem {
  id: string;
  requestId: string;
  dateCreated: string;
  items: Array<{ desc: string; qty: number; unitPrice: number }>;
  tvaRate: number;
  discount: number;
  status: string;
  signatureGastronomique?: string;
  history?: Array<{ date: string; action: string }>;
  guests?: number;
  location?: string;
  date?: string;
  time?: string;
}

export interface RealisationItem {
  id: string;
  title: string;
  category: string;
  image: string;
  desc: string;
}

export interface EventItem {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
  guests: number;
  clientId: string;
  clientName?: string;
  clientPhone?: string;
  location: string;
  staffIds: string[];
  requestId?: string;
  signatureGastronomique?: string;
  status: 'confirmé' | 'en cours' | 'terminé' | string;
  createdDate: string;
}

export interface StaffItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  available: boolean;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface TestimonialItem {
  id: string;
  text: string;
  clientName: string;
  role: string;
  rating: number;
}

/**
 * Service legacy de compatibilité.
 * Délègue l'affichage des notifications au ToastService réactif Angular.
 */
@Injectable({
  providedIn: 'root'
})
export class KikiDataService {
  constructor(private toastService: ToastService) {}

  showToast(message: string, isError = false): void {
    this.toastService.showToast(message, isError);
  }

  getRequests(): RequestItem[] {
    return [];
  }

  addRequest(req: any): any {
    return req;
  }

  updateRequestStatus(id: string, st: string): void {
    // No-op for legacy mock status update
  }

  getDevis(): DevisItem[] {
    return [];
  }

  updateDevis(id: string, updated: any, actionMsg?: string): void {
    // No-op for legacy mock devis update
  }

  getEvents(): EventItem[] {
    return [];
  }

  addEvent(event: any): any {
    return event;
  }

  getMedia(): any[] {
    return [];
  }

  saveMedia(media: any[]): void {
    // No-op
  }
}
