import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isSignUpActive = signal(false);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  loginForm = this.fb.group({
    identifier: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  signupForm = this.fb.group({
    nom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePanel(isSignUp: boolean) {
    this.isSignUpActive.set(isSignUp);
    this.errorMessage.set(null);
    this.successMessage.set(null);
  }

  onLogin() {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const user = this.authService.currentUser();
        if (user?.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else if (user?.role === 'employee') {
          this.router.navigate(['/employee/chat']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Erreur d\'authentification. Veuillez réessayer.');
        this.isLoading.set(false);
      }
    });
  }

  onSignup() {
    if (this.signupForm.invalid) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.signup(this.signupForm.value).subscribe({
      next: (response: any) => {
        // Account created but pending approval — show success message
        this.successMessage.set(
          response.message || 'Votre compte a été créé. Il est en attente d\'approbation par l\'administrateur.'
        );
        this.isLoading.set(false);
        this.signupForm.reset();
      },
      error: (err: any) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors de l\'inscription. Veuillez réessayer.');
        this.isLoading.set(false);
      }
    });
  }
}
