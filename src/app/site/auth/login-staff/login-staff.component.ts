import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login-staff',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-staff.component.html',
  styleUrl: './login-staff.component.css'
})
export class LoginStaffComponent {
  email = '';
  password = '';
  message = '';
  isError = false;

  constructor(private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.isError = true;
      this.message = 'Veuillez saisir votre email et votre mot de passe.';
      return;
    }
    this.isError = false;
    this.message = 'Authentification réussie ! Accès au Back-Office...';
    setTimeout(() => {
      this.router.navigate(['/gestionnaire']);
    }, 1000);
  }

  forgotPassword(): void {
    this.isError = false;
    this.message = 'Veuillez contacter le super-administrateur pour réinitialiser vos accès.';
  }
}

