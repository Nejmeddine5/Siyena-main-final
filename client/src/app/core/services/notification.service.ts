import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface Notification {
  _id: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  private socket!: Socket;

  notifications = signal<Notification[]>([]);

  constructor() {
    this.initSocket();
  }

  initSocket() {
    if (this.socket?.connected) return;
    
    const user = this.authService.currentUser();
    if (!user) return;

    this.socket = io(environment.socketUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    this.socket.on('connect', () => {
      this.socket.emit('join', user._id);
    });

    this.socket.on('newNotification', (newNotif: Notification) => {
      this.notifications.set([newNotif, ...this.notifications()]);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  loadNotifications() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.http.get<any>(`${this.apiUrl}/${user._id}`).subscribe(res => {
      this.notifications.set(res.data.notifications);
    });
  }

  markAsRead(id: string) {
    this.http.patch<any>(`${this.apiUrl}/${id}/read`, {}).subscribe({
      next: () => {
        // Update local state
        this.notifications.set(
          this.notifications().map(n => n._id === id ? { ...n, read: true } : n)
        );
      },
    });
  }

  markAllAsRead() {
    const user = this.authService.currentUser();
    if (!user) return;

    this.http.patch<any>(`${this.apiUrl}/read-all/${user._id}`, {}).subscribe({
      next: () => {
        this.notifications.set(
          this.notifications().map(n => ({ ...n, read: true }))
        );
      },
      error: (err) => console.error('Failed to mark all as read', err)
    });
  }
}


