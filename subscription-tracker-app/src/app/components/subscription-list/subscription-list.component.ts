import { Component, EventEmitter, Input, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription, BillingCycle, SubscriptionStatus, Currency } from '../../models/subscription.model';
import { billingCycleKey } from '../../utils/billing-cycle.util';
import { getLogoUrl } from '../../utils/logo.util';
import { SubscriptionService } from '../../services/subscription.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CategoryNamePipe } from '../../pipes/category-name.pipe';

@Component({
    selector: 'app-subscription-list',
    imports: [CommonModule, RouterLink, TranslatePipe, CategoryNamePipe],
    templateUrl: './subscription-list.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './subscription-list.component.css'
})
export class SubscriptionListComponent {
  private translate = inject(TranslateService);
  private subscriptionService = inject(SubscriptionService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);

  @Input() subscriptions: Subscription[] = [];
  @Output() edit = new EventEmitter<Subscription>();
  @Output() delete = new EventEmitter<number>();
  // بتتبعت لما أي تغيير (مفضلة/نسخ) يحصل عشان الداشبورد يحدّث القوائم والإحصائيات
  @Output() changed = new EventEmitter<void>();

  SubscriptionStatus = SubscriptionStatus;
  billingCycleKey = billingCycleKey;
  getLogoUrl = getLogoUrl;

  currencyLabel(currency: Currency): string {
    return Currency[currency];
  }

  statusKey(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.Expired: return 'status.expired';
      case SubscriptionStatus.Cancelled: return 'status.cancelled';
      default: return 'status.active';
    }
  }

  renewalKey(days: number): string {
    if (days <= 0) return 'list.renewsTomorrow';
    if (days <= 3) return 'list.renewsInDays';
    return 'list.inDays';
  }

  onToggleFavorite(sub: Subscription, event: Event): void {
    event.stopPropagation();
    this.subscriptionService.toggleFavorite(sub).subscribe({
      next: () => this.changed.emit(),
      error: () => this.toastService.show('toast.saveError', 'error')
    });
  }

  onDuplicate(sub: Subscription, event: Event): void {
    event.stopPropagation();
    this.subscriptionService.duplicate(sub.id).subscribe({
      next: () => {
        this.toastService.show('list.duplicated');
        this.changed.emit();
      },
      error: () => this.toastService.show('toast.addError', 'error')
    });
  }

  async onDelete(id: number): Promise<void> {
    const message = this.translate.instant('list.confirmDelete');
    const confirmed = await this.confirmDialogService.confirm(message);
    if (confirmed) {
      this.delete.emit(id);
    }
  }
}
