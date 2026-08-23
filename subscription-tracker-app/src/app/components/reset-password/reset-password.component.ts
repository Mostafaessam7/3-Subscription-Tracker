import { Component, OnInit, inject } from '@angular/core';

import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';
import { strongPasswordValidators } from '../../utils/password-validators';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
    selector: 'app-reset-password',
    imports: [ReactiveFormsModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent, VantaBackgroundDirective],
    templateUrl: './reset-password.component.html',
    styleUrl: './reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit {
  private fb = new FormBuilder();
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);

  private token = '';
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;
  hasToken = true;

  form = this.fb.group({
    newPassword: ['', strongPasswordValidators()],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatchValidator });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.hasToken = this.token.length > 0;
    if (!this.hasToken) {
      this.errorMessage = this.translate.instant('auth.missingResetToken');
    }
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting || !this.hasToken) return;
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = true;

    const { newPassword } = this.form.getRawValue();

    this.authService.resetPassword({ token: this.token, newPassword: newPassword! }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.successMessage = this.translate.instant('auth.resetPasswordSuccess');
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err.status === 400
          ? this.translate.instant('auth.resetPasswordInvalidToken')
          : this.translate.instant('auth.genericError');
      }
    });
  }
}
