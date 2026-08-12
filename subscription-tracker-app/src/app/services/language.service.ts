import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'ar' | 'en';

const STORAGE_KEY = 'subscription_tracker_lang';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);

  currentLang = signal<AppLanguage>(this.getInitialLang());

  init(): void {
    this.translate.addLangs(['ar', 'en']);
    this.applyLang(this.currentLang());
  }

  setLang(lang: AppLanguage): void {
    this.currentLang.set(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    this.applyLang(lang);
  }

  toggle(): void {
    this.setLang(this.currentLang() === 'ar' ? 'en' : 'ar');
  }

  private applyLang(lang: AppLanguage): void {
    this.translate.use(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  private getInitialLang(): AppLanguage {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : 'ar'; // العربي هو الافتراضي
  }
}
