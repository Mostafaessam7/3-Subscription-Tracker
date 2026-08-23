import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';
import { strongPasswordValidators } from '../../utils/password-validators';

@Component({
    selector: 'app-register',
    imports: [ReactiveFormsModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent, VantaBackgroundDirective],
    templateUrl: './register.component.html',
    styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = new FormBuilder();
  private authService = inject(AuthService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  errorMessage = '';

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', strongPasswordValidators()]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.errorMessage = '';

    this.authService.register(this.form.getRawValue() as any).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.errorMessage = err.status === 409
          ? this.translate.instant('auth.emailTaken')
          : this.translate.instant('auth.genericError');
      }
    });
  }
}
