import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-language-switch',
  standalone: true,
  template: `
    <button class="lang-btn" (click)="languageService.toggle()">
      {{ languageService.currentLang() === 'ar' ? 'EN' : 'ع' }}
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .lang-btn {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      width: 38px;
      height: 38px;
      padding: 0;
      border-radius: var(--radius-sm);
      font-family: var(--font-mono);
      font-size: 13px;
      font-weight: 600;
    }
    .lang-btn:hover {
      border-color: var(--border-strong);
      color: var(--text-primary);
    }
  `]
})
export class LanguageSwitchComponent {
  languageService = inject(LanguageService);
}
