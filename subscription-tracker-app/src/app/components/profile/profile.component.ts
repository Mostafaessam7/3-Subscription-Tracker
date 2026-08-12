import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';
import { Profile } from '../../models/subscription.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent, VantaBackgroundDirective],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private fb = new FormBuilder();

  profile: Profile | null = null;

  nameForm = this.fb.group({
    name: ['', Validators.required]
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
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
}
