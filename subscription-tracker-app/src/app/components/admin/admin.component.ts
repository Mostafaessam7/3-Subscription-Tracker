import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { AdminUser, SystemStats } from '../../models/admin.model';
import { UserRole } from '../../models/subscription.model';

@Component({
    selector: 'app-admin',
    imports: [CommonModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent],
    templateUrl: './admin.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);

  UserRole = UserRole; // عشان الـ Template يقدر يستخدم الـ Enum مباشرة

  stats: SystemStats | null = null;
  users: AdminUser[] = [];
  loading = true;

  get currentUserId(): number {
    return this.authService.currentUser()!.userId;
  }

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
  }

  private loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (stats) => (this.stats = stats),
      error: () => this.toastService.show('admin.loadError', 'error')
    });
  }

  private loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastService.show('admin.loadError', 'error');
      }
    });
  }

  async toggleRole(user: AdminUser): Promise<void> {
    const newRole = user.role === UserRole.Admin ? UserRole.User : UserRole.Admin;
    const messageKey = newRole === UserRole.Admin ? 'admin.confirmPromote' : 'admin.confirmDemote';
    const message = this.translate.instant(messageKey, { name: user.name });

    const confirmed = await this.confirmDialogService.confirm(message);
    if (!confirmed) return;

    this.adminService.updateUserRole(user.id, { role: newRole }).subscribe({
      next: () => {
        user.role = newRole;
        this.toastService.show('admin.roleUpdated');
      },
      error: () => this.toastService.show('admin.roleUpdateError', 'error')
    });
  }
}
