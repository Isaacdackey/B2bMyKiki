import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private http = inject(HttpClient);

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('b2b_jwt_token') : null;
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    return this.http
      .post<{ success: boolean; data: { url: string } }>(`${environment.apiUrl}/api/v1/b2b/upload`, formData, { headers })
      .pipe(map(res => res.data.url));
  }
}
