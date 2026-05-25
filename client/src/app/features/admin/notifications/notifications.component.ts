import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, AdminNotification } from '../../../core/services/admin.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html'
})
export class NotificationsComponent implements OnInit {
  adminService = inject(AdminService);
  notifications = signal<AdminNotification[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.isLoading.set(true);
    this.adminService.getNotifications().subscribe({
      next: (res) => {
        this.notifications.set(res.data.notifications);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  markAsRead(id: string) {
    this.adminService.markAsRead(id).subscribe({
      next: () => {
        this.notifications.update(prev =>
          prev.map(n => n._id === id ? { ...n, read: true } : n)
        );
      }
    });
  }

  deleteNotification(id: string) {
    this.adminService.deleteNotification(id).subscribe({
      next: () => {
        this.notifications.update(prev => prev.filter(n => n._id !== id));
      }
    });
  }

  approveUser(notification: AdminNotification) {
    if (!notification.relatedUserId) return;
    this.adminService.approveUser(notification.relatedUserId).subscribe({
      next: () => {
        // Mark notification as read and update it
        this.notifications.update(prev =>
          prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
        );
      }
    });
  }

  rejectUser(notification: AdminNotification) {
    if (!notification.relatedUserId) return;
    this.adminService.rejectUser(notification.relatedUserId).subscribe({
      next: () => {
        // Remove the notification
        this.notifications.update(prev => prev.filter(n => n._id !== notification._id));
      }
    });
  }
}
