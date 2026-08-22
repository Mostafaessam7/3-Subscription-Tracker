import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';

type ConfirmState = 'confirming' | 'success' | 'error' | 'missingToken';

// صفحة اللينك اللي بيوصل في إيميل تأكيد الحساب - بتأكّد التوكن أوتوماتيك أول ما تفتح
// (من غير أي فورم أو تدخّل من المستخدم، عكس Reset Password اللي محتاج كلمة سر جديدة)
@Component({
    selector: 'app-confirm-email',
    imports: [CommonModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent, VantaBackgroundDirective],
    templateUrl: './confirm-email.component.html',
    styleUrl: './confirm-email.component.css'
})
export class ConfirmEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  state: ConfirmState = 'confirming';
  message = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!token) {
      this.state = 'missingToken';
      this.message = this.translate.instant('auth.missingConfirmToken');
      return;
    }

    this.authService.confirmEmail({ token }).subscribe({
      next: () => {
        this.state = 'success';
        this.message = this.translate.instant('auth.confirmEmailSuccess');
      },
      error: () => {
        this.state = 'error';
        this.message = this.translate.instant('auth.confirmEmailError');
      }
    });
  }
}
