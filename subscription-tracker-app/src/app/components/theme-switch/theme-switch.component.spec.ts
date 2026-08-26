import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ThemeSwitchComponent } from './theme-switch.component';
import { ThemeService } from '../../services/theme.service';

describe('ThemeSwitchComponent', () => {
  let fixture: ComponentFixture<ThemeSwitchComponent>;
  let component: ThemeSwitchComponent;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ThemeSwitchComponent, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeSwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => localStorage.clear());

  it('بيتعمله Create بنجاح', () => {
    expect(component).toBeTruthy();
  });

  it('الضغط على الزرار بيبدّل الـ Theme من dark لـ light والعكس', () => {
    const themeService = TestBed.inject(ThemeService);
    themeService.setTheme('dark');

    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    button.click();
    fixture.detectChanges();

    expect(themeService.currentTheme()).toBe('light');
  });

  it('النص جوه الزرار بيتغيّر حسب الـ Theme الحالي', () => {
    const themeService = TestBed.inject(ThemeService);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    themeService.setTheme('dark');
    fixture.detectChanges();
    expect(button.textContent).toContain('☀️');

    themeService.setTheme('light');
    fixture.detectChanges();
    expect(button.textContent).toContain('🌙');
  });
});
