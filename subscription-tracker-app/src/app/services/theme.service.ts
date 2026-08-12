import { Injectable, signal } from '@angular/core';

export type AppTheme = 'dark' | 'light';

const STORAGE_KEY = 'subscription_tracker_theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  // الداكن هو الافتراضي (الهوية الأساسية للتطبيق مبنية عليه من البداية)
  currentTheme = signal<AppTheme>(this.getInitialTheme());

  init(): void {
    this.applyTheme(this.currentTheme());
  }

  toggle(): void {
    this.setTheme(this.currentTheme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: AppTheme): void {
    document.body.classList.toggle('light-theme', theme === 'light');
  }

  private getInitialTheme(): AppTheme {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'light' ? 'light' : 'dark';
  }
}
