import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  adminService = inject(AdminService);
  
  user = this.authService.currentUser;
  unreadCount = signal<number>(0);

  ngOnInit() {
    this.fetchUnreadCount();
    
    // Listen for read/delete actions to update the badge
    this.adminService.notificationsUpdated$.subscribe(() => {
      this.fetchUnreadCount();
    });
  }

  fetchUnreadCount() {
    this.adminService.getNotifications().subscribe({
      next: (res) => {
        const notifications = res.data.notifications;
        const unread = notifications.filter((n: any) => !n.read).length;
        this.unreadCount.set(unread);
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
