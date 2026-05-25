import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const technicianGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();
  
  if (authService.isLoggedIn() && (user?.role === 'technician' || user?.role === 'admin')) {
    return true;
  }

  if (user?.role === 'employee') {
    router.navigate(['/employee/chat']);
  } else {
    router.navigate(['/login']);
  }
  
  return false;
};
