import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div [class.dark]="themeService.darkMode()" class="min-h-screen flex flex-col">
      <app-navbar *ngIf="!isAdminRoute()"></app-navbar>
      <div class="flex-grow" [class.pb-20]="!isAdminRoute() && !isProfileRoute()">
        <router-outlet></router-outlet>
      </div>
      <app-footer *ngIf="!isAdminRoute() && !isProfileRoute()"></app-footer>
    </div>
  `,
  styles: []
})
export class AppComponent {
  themeService = inject(ThemeService);
  private router = inject(Router);

  isAdminRoute(): boolean {
    return this.router.url.startsWith('/admin') || this.router.url.startsWith('/employee');
  }

  isProfileRoute(): boolean {
    return this.router.url.startsWith('/profile');
  }
}
