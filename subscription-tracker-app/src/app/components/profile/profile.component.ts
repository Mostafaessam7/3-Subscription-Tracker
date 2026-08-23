import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';
import { Profile } from '../../models/subscription.model';
import { strongPasswordValidators } from '../../utils/password-validators';

@Component({
    selector: 'app-profile',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent, VantaBackgroundDirective],
    templateUrl: './profile.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);
  private fb = new FormBuilder();

  profile: Profile | null = null;
  deleteError = '';

  nameForm = this.fb.group({
    name: ['', Validators.required]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', strongPasswordValidators()]
  });

  deleteAccountForm = this.fb.group({
    password: ['', Validators.required]
  });

  private get userId(): number {
    return this.authService.currentUser()!.userId;
  }

  ngOnInit(): void {
    this.profileService.getProfile(this.userId).subscribe((profile) => {
      this.profile = profile;
      this.nameForm.patchValue({ name: profile.name });
    });
  }

  saveName(): void {
    if (this.nameForm.invalid) return;

    this.profileService.updateProfile(this.userId, this.nameForm.getRawValue() as any).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.toastService.show('profile.nameSaved');
      },
      error: () => this.toastService.show('profile.saveError', 'error')
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;

    this.profileService.changePassword(this.userId, this.passwordForm.getRawValue() as any).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.toastService.show('profile.passwordChanged');
      },
      error: (err) => {
        const key = err.status === 400 ? 'profile.currentPasswordWrong' : 'profile.saveError';
        this.toastService.show(key, 'error');
      }
    });
  }

  async deleteAccount(): Promise<void> {
    if (this.deleteAccountForm.invalid) return;
    this.deleteError = '';

    const confirmed = await this.confirmDialogService.confirm(this.translate.instant('profile.deleteAccountConfirm'));
    if (!confirmed) return;

    this.profileService.deleteAccount(this.userId, this.deleteAccountForm.getRawValue() as any).subscribe({
      next: () => this.authService.logout(),
      error: (err) => {
        this.deleteError = err.status === 400
          ? this.translate.instant('profile.deleteAccountWrongPassword')
          : this.translate.instant('profile.saveError');
      }
    });
  }
}
