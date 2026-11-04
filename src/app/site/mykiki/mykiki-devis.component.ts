import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientApiService } from '../../services/client-api.service';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-mykiki-devis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mykiki-devis.component.html',
  styleUrl: './mykiki-devis.component.css'
})
export class MyKikiDevisComponent implements OnInit {
  devisList: any[] = [];
  isLoading = true;

  constructor(private clientApi: ClientApiService, private authService: AuthService) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.clientApi.getMykikiDevis()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (data) => {
          this.devisList = data || [];
        },
        error: (err) => {
          console.error('Erreur chargement devis MyKiki', err);
          // Fallback sur les demandes du client
          this.clientApi.getMykikiDemandes()
            .pipe(finalize(() => this.isLoading = false))
            .subscribe({
              next: (demandes) => {
                this.devisList = (demandes || []).filter(d => 
                  d.status === 'aboutis' || d.status === 'ABOUTI' || d.status === 'devis_valide' || d.status === 'DEVIS_ENVOYE'
                );
              },
              error: (e) => console.error(e)
            });
        }
      });
  }

  downloadPdf(devis: any): void {
    window.print();
  }
}
