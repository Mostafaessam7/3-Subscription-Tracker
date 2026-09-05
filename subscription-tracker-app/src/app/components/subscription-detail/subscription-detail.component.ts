import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SubscriptionService } from '../../services/subscription.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { BillingCycle, Currency, Subscription, SubscriptionStatus, UpdateSubscription } from '../../models/subscription.model';
import { billingCycleKey, toYearlyEquivalent } from '../../utils/billing-cycle.util';
import { getLogoUrl } from '../../utils/logo.util';
import { SubscriptionFormComponent } from '../subscription-form/subscription-form.component';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';
import { CategoryNamePipe } from '../../pipes/category-name.pipe';

@Component({
    selector: 'app-subscription-detail',
    imports: [CommonModule, RouterLink, TranslatePipe, SubscriptionFormComponent, LanguageSwitchComponent, ThemeSwitchComponent, VantaBackgroundDirective, CategoryNamePipe],
    templateUrl: './subscription-detail.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './subscription-detail.component.css'
})
export class SubscriptionDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);

  SubscriptionStatus = SubscriptionStatus;
  billingCycleKey = billingCycleKey;
  getLogoUrl = getLogoUrl;

  subscription: Subscription | null = null;
  loading = true;
  notFound = false;
  showEditForm = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.notFound = true;
      this.loading = false;
      return;
    }
    this.load(id);
  }

  private load(id: number): void {
    this.loading = true;
    this.subscriptionService.getById(id).subscribe({
      next: (sub) => {
        this.subscription = sub;
        this.loading = false;
      },
      error: () => {
        this.notFound = true;
        this.loading = false;
      }
    });
  }

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

  get yearlyEquivalent(): number {
    if (!this.subscription) return 0;
    return toYearlyEquivalent(this.subscription.price, this.subscription.billingCycle);
  }

  onEdit(): void {
    this.showEditForm = true;
  }

  onSave(formValue: any): void {
    if (!this.subscription) return;
    const dto: UpdateSubscription = { ...formValue };
    this.subscriptionService.update(this.subscription.id, dto).subscribe({
      next: () => {
        this.showEditForm = false;
        this.load(this.subscription!.id);
        this.toastService.show('toast.updated');
      },
      error: () => this.toastService.show('toast.saveError', 'error')
    });
  }

  onCancelEdit(): void {
    this.showEditForm = false;
  }

  async onDelete(): Promise<void> {
    if (!this.subscription) return;
    const message = this.translate.instant('list.confirmDelete');
    const confirmed = await this.confirmDialogService.confirm(message);
    if (!confirmed) return;

    this.subscriptionService.delete(this.subscription.id).subscribe({
      next: () => {
        this.toastService.show('toast.deleted');
        this.router.navigate(['/']);
      },
      error: () => this.toastService.show('toast.deleteError', 'error')
    });
  }

  onToggleFavorite(): void {
    if (!this.subscription) return;
    this.subscriptionService.toggleFavorite(this.subscription).subscribe({
      next: () => this.load(this.subscription!.id),
      error: () => this.toastService.show('toast.saveError', 'error')
    });
  }

  onDuplicate(): void {
    if (!this.subscription) return;
    this.subscriptionService.duplicate(this.subscription.id).subscribe({
      next: (duplicated) => {
        this.toastService.show('list.duplicated');
        this.router.navigate(['/subscriptions', duplicated.id]);
      },
      error: () => this.toastService.show('toast.addError', 'error')
    });
  }
}
