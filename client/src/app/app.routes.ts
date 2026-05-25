import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminLayoutComponent } from './features/admin/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { UserManagementComponent } from './features/admin/user-management/user-management.component';
import { NotificationsComponent } from './features/admin/notifications/notifications.component';
import { AlertsComponent } from './features/dashboard/alerts/alerts.component';
import { TicketsComponent } from './features/dashboard/tickets/tickets.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { employeeGuard } from './core/guards/employee.guard';
import { technicianGuard } from './core/guards/technician.guard';
import { TechnicianLayoutComponent } from './features/dashboard/technician-layout/technician-layout.component';
import { EmployeeLayoutComponent } from './features/employee/employee-layout/employee-layout.component';
import { AiChatComponent } from './features/employee/ai-chat/ai-chat.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },

  // Technician Routes
  {
    path: '',
    component: TechnicianLayoutComponent,
    canActivate: [authGuard, technicianGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'tickets', component: TicketsComponent },
      { path: 'alerts', component: AlertsComponent },
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Admin Routes
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'users', component: UserManagementComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'tickets', component: TicketsComponent },
      { path: 'alerts', component: AlertsComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // Employee Routes
  {
    path: 'employee',
    component: EmployeeLayoutComponent,
    canActivate: [authGuard, employeeGuard],
    children: [
      { path: 'chat', component: AiChatComponent },
      { path: 'profile', component: ProfileComponent },
      { path: '', redirectTo: 'chat', pathMatch: 'full' }
    ]
  },

  { path: '**', redirectTo: 'dashboard' }
];



