import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageSwitchComponent } from './language-switch.component';
import { LanguageService } from '../../services/language.service';

describe('LanguageSwitchComponent', () => {
  let fixture: ComponentFixture<LanguageSwitchComponent>;
  let component: LanguageSwitchComponent;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LanguageSwitchComponent],
      providers: [provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('بيتعمله Create بنجاح', () => {
    expect(component).toBeTruthy();
  });

  it('الضغط على الزرار بيبدّل اللغة من ar لـ en والعكس', () => {
    const languageService = TestBed.inject(LanguageService);
    languageService.setLang('ar');

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(languageService.currentLang()).toBe('en');
  });

  it('النص جوه الزرار بيعرض اللغة التانية (اللي هتتفعّل لو ضغطت)', () => {
    const languageService = TestBed.inject(LanguageService);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    languageService.setLang('ar');
    fixture.detectChanges();
    expect(button.textContent).toContain('EN');

    languageService.setLang('en');
    fixture.detectChanges();
    expect(button.textContent).toContain('ع');
  });
});
