import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'siyena_theme';
  darkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
  }

  toggleTheme() {
    this.darkMode.set(!this.darkMode());
    this.applyTheme();
    localStorage.setItem(this.THEME_KEY, this.darkMode() ? 'dark' : 'light');
  }

  private initializeTheme() {
    const savedTheme = localStorage.getItem(this.THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      this.darkMode.set(true);
    } else {
      this.darkMode.set(false);
    }
    this.applyTheme();
  }

  private applyTheme() {
    if (this.darkMode()) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }
}
