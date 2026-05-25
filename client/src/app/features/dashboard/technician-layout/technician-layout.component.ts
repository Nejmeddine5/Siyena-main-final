import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-technician-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './technician-layout.component.html',
  styleUrls: ['./technician-layout.component.css']
})
export class TechnicianLayoutComponent implements OnInit {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);
  
  ngOnInit() {
    this.notificationService.loadNotifications();
  }

  logout() {
    this.authService.logout();
  }

  isDashboardRoot(): boolean {
    return this.router.url === '/dashboard';
  }
}
