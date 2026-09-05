import { ApplicationConfig } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(withXhr(), withInterceptors([authInterceptor])),

    // ngx-translate 18 is provider-based: TranslateModule no longer exists, and the loader
    // is configured through a token rather than a factory that news up TranslateHttpLoader.
    //
    // `defaultLanguage: 'ar'` from the v15 config became two separate settings. `lang` is the
    // language to start in; `fallbackLang` is what a missing key falls back to. Both are 'ar'
    // here to preserve the old behaviour exactly -- under v15 the single option did both jobs.
    provideTranslateService({
      lang: 'ar',
      fallbackLang: 'ar',
      // بيحدد من فين هيجيب ملفات الترجمة (src/assets/i18n/ar.json و en.json)
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json',
      }),
    }),
  ],
};
