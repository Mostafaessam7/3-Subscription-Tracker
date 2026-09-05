import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { appConfig } from './app.config';
import arTranslations from '../assets/i18n/ar.json';

/**
 * Guards the translation wiring in `appConfig`.
 *
 * The rest of the suite cannot catch a broken loader. Component specs provide
 * `provideTranslateService()` with no loader at all, so every key resolves to the key itself
 * and their assertions pass whether or not translation actually works. That is exactly how a
 * misconfigured loader ships looking green: the app builds, 169 tests pass, and the UI renders
 * `common.close` where Arabic should be.
 *
 * These spread the **real** `appConfig.providers` instead of re-declaring a loader, so a wrong
 * prefix, suffix or start language in that file fails here. Duplicating the config into this
 * spec would test the copy and prove nothing about the app.
 *
 * Written during the ngx-translate 15 -> 18 migration, where `TranslateModule.forRoot({...})`
 * became `provideTranslateService({...})` and the loader stopped being a factory.
 */
@Component({
  standalone: true,
  imports: [TranslatePipe],
  template: `<span>{{ 'common.close' | translate }}</span>`,
})
class TranslatedHost {}

describe('appConfig translation wiring', () => {
  let httpMock: HttpTestingController;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // provideHttpClientTesting() swaps out the real backend from appConfig's
      // provideHttpClient(); every other provider stays exactly as the app uses it.
      providers: [...appConfig.providers, provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
    translate = TestBed.inject(TranslateService);
  });

  afterEach(() => httpMock.verify());

  it('starts in Arabic', () => {
    // v15 said `defaultLanguage: 'ar'`; v18 splits that into lang + fallbackLang. Had the
    // migration dropped `lang`, the app would boot with no language selected.
    expect(translate.getCurrentLang()).toBe('ar');
    flushAnyLanguageLoad();
  });

  it('fetches translations from the path the assets are actually served at', () => {
    flushAnyLanguageLoad();

    translate.use('en');

    // prefix/suffix live in appConfig. Wrong values mean a 404 at runtime and, because the
    // loader defaults to failOnError: false, a silent fall back to empty translations.
    const req = httpMock.expectOne('/assets/i18n/en.json');
    expect(req.request.method).toBe('GET');
    req.flush({ common: { close: 'Close' } });
  });

  it('renders the translated value through the pipe, not the key', () => {
    const fixture = TestBed.createComponent(TranslatedHost);
    fixture.detectChanges();

    flushAnyLanguageLoad();
    fixture.detectChanges();

    const rendered = fixture.nativeElement.textContent.trim();
    expect(rendered).toBe(arTranslations.common.close);
    expect(rendered).not.toBe('common.close');
  });

  /** The service kicks off a load for the start language; answer whatever it asked for. */
  function flushAnyLanguageLoad(): void {
    httpMock.match(() => true).forEach(req => req.flush(arTranslations));
  }
});
