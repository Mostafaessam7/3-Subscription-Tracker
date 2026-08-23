import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';

@Component({
    selector: 'app-forgot-password',
    imports: [ReactiveFormsModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent, VantaBackgroundDirective],
    templateUrl: './forgot-password.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private fb = new FormBuilder();
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    this.authService.forgotPassword(this.form.getRawValue() as { email: string }).subscribe({
      // بيرجع 200 دايمًا من الباك اند بتصميم (منعًا لتسريب الإيميلات المسجلة)، فبنعرض نفس رسالة النجاح
      // سواء كان الإيميل مسجل أو لأ
      next: () => {
        this.isSubmitting = false;
        this.successMessage = this.translate.instant('auth.forgotPasswordSuccess');
        this.form.reset();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = this.translate.instant('auth.genericError');
      }
    });
  }
}
