import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const employeeGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  // Allow both employees and admins to access the employee space
  if (authService.isLoggedIn() && (user?.role === 'employee' || user?.role === 'admin')) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
