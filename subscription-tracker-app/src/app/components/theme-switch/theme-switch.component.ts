import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-switch',
  standalone: true,
  template: `
    <button class="theme-btn" (click)="themeService.toggle()" title="Toggle theme">
      {{ themeService.currentTheme() === 'dark' ? '☀️' : '🌙' }}
    </button>
  `,
  styles: [`
    .theme-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      width: 38px;
      height: 38px;
      padding: 0;
      border-radius: var(--radius-sm);
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .theme-btn:hover {
      border-color: var(--border-strong);
    }
  `]
})
export class ThemeSwitchComponent {
  themeService = inject(ThemeService);
}
