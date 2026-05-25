import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface User {
  _id: string;
  nom: string;
  email: string;
  role: 'technician' | 'employee' | 'admin';
  isApproved: boolean;
  createdAt: string;
}

export interface AdminNotification {
  _id: string;
  type: string;
  message: string;
  read: boolean;
  relatedUserId?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin`;

  getAllUsers(): Observable<any> { return this.http.get(`${this.apiUrl}/users`); }
  updateUserRole(userId: string, role: string): Observable<any> { return this.http.patch(`${this.apiUrl}/users/${userId}/role`, { role }); }
  deleteUser(userId: string): Observable<any> { return this.http.delete(`${this.apiUrl}/users/${userId}`); }

  approveUser(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/users/${userId}/approve`, {});
  }

  rejectUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}/reject`);
  }

  // Notifications
  private notificationsUpdated = new Subject<void>();
  notificationsUpdated$ = this.notificationsUpdated.asObservable();

  getNotifications(): Observable<any> { return this.http.get(`${this.apiUrl}/notifications`); }

  markAsRead(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/notifications/${id}/read`, {}).pipe(
      tap(() => this.notificationsUpdated.next())
    );
  }

  deleteNotification(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/notifications/${id}`).pipe(
      tap(() => this.notificationsUpdated.next())
    );
  }
}

