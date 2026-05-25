import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  
  if (authService.isLoggedIn() && user?.role === 'admin') return true;

  router.navigate(['/dashboard']);
  return false;
};
