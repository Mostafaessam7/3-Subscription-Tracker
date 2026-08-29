import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { CelebrationService } from '../../services/celebration.service';
import { BudgetService } from '../../services/budget.service';
import { CategoryService } from '../../services/category.service';
import { TagService } from '../../services/tag.service';
import {
  BillingCycle,
  Category,
  CreateSubscription,
  Subscription,
  SubscriptionQuery,
  SubscriptionStatus,
  Tag,
  UpdateSubscription,
  UserRole
} from '../../models/subscription.model';
import { CountUpDirective } from '../../directives/count-up.directive';
import { toYearlyEquivalent } from '../../utils/billing-cycle.util';
import { SubscriptionListComponent } from '../subscription-list/subscription-list.component';
import { SubscriptionFormComponent } from '../subscription-form/subscription-form.component';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { CategoryManagerComponent } from '../category-manager/category-manager.component';
import { PaymentMethodManagerComponent } from '../payment-method-manager/payment-method-manager.component';
import { TagManagerComponent } from '../tag-manager/tag-manager.component';
import { CategorySpendingChartComponent } from '../category-spending-chart/category-spending-chart.component';
import { VantaBackgroundDirective } from '../../directives/vanta-background.directive';
import { DialogDirective } from '../../directives/dialog.directive';
import { CategoryNamePipe } from '../../pipes/category-name.pipe';

type SortOption = 'RenewalDate' | 'Cost' | 'Name';

@Component({
    selector: 'app-dashboard',
    imports: [
    FormsModule,
    RouterLink,
    TranslateModule,
    CountUpDirective,
    SubscriptionListComponent,
    SubscriptionFormComponent,
    LanguageSwitchComponent,
    ThemeSwitchComponent,
    CategoryManagerComponent,
    PaymentMethodManagerComponent,
    TagManagerComponent,
    CategorySpendingChartComponent,
    VantaBackgroundDirective,
    CategoryNamePipe,
    DialogDirective
],
    templateUrl: './dashboard.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private toastService = inject(ToastService);
  private celebrationService = inject(CelebrationService);
  private budgetService = inject(BudgetService);
  private categoryService = inject(CategoryService);
  private tagService = inject(TagService);
  authService = inject(AuthService);

  SubscriptionStatus = SubscriptionStatus;

  // القائمة الكاملة (من غير فلاتر) - بتُستخدم لحساب الإحصائيات والـ Ticker
  allSubscriptions: Subscription[] = [];
  // القائمة المفلترة الفعلية اللي بتتعرض في الشاشة
  displayedSubscriptions: Subscription[] = [];

  categories: Category[] = [];
  tags: Tag[] = [];
  monthlyTotal = 0;
  showForm = false;
  editingSubscription: Subscription | null = null;
  showCategoryManager = false;
  showPaymentMethodManager = false;
  showTagManager = false;
  chartRefreshTrigger = 0;

  monthlyBudget: number | null = null;
  showBudgetForm = false;
  budgetInputValue = 0;
  private hasWarnedOverBudget = false;

  // معايير البحث والفلترة والترتيب الحالية
  searchTerm = '';
  selectedCategoryId: number | null = null;
  selectedTagId: number | null = null;
  selectedStatus: SubscriptionStatus | null = null;
  selectedBillingCycle: BillingCycle | null = null;
  onlyFavorites = false;
  sortBy: SortOption = 'RenewalDate';
  sortDescending = false;

  private searchDebounceTimer: any;

  private get userId(): number {
    return this.authService.currentUser()!.userId;
  }

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role === UserRole.Admin;
  }

  get isEmailUnconfirmed(): boolean {
    return this.authService.currentUser()?.emailConfirmed === false;
  }

  isResendingConfirmation = false;

  resendConfirmationEmail(): void {
    const email = this.authService.currentUser()?.email;
    if (!email || this.isResendingConfirmation) return;

    this.isResendingConfirmation = true;
    this.authService.resendConfirmation({ email }).subscribe({
      next: () => {
        this.isResendingConfirmation = false;
        this.toastService.show('auth.resendConfirmationSuccess');
      },
      error: () => {
        this.isResendingConfirmation = false;
        this.toastService.show('toast.saveError', 'error');
      }
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTags();
    this.loadAllSubscriptions();
    this.loadFilteredSubscriptions();
    this.loadBudget();
  }

  loadCategories(): void {
    this.categoryService.getAll().subscribe((categories) => {
      this.categories = categories;
    });
  }

  loadTags(): void {
    this.tagService.getAll().subscribe((tags) => {
      this.tags = tags;
    });
  }

  // بتحمّل كل الاشتراكات من غير فلاتر - مصدر الإحصائيات والـ Ticker والميزانية
  loadAllSubscriptions(): void {
    this.subscriptionService.getAllForUser(this.userId).subscribe((subs) => {
      this.allSubscriptions = subs;
    });
    this.subscriptionService.getMonthlyTotal(this.userId).subscribe((total) => {
      this.monthlyTotal = total;
      this.checkBudgetWarning();
    });
  }

  // بتحمّل القائمة اللي بتتعرض فعليًا، مطبّق عليها كل الفلاتر الحالية
  loadFilteredSubscriptions(): void {
    const query: SubscriptionQuery = {
      search: this.searchTerm || undefined,
      status: this.selectedStatus ?? undefined,
      billingCycle: this.selectedBillingCycle ?? undefined,
      categoryId: this.selectedCategoryId ?? undefined,
      tagId: this.selectedTagId ?? undefined,
      onlyFavorites: this.onlyFavorites || undefined,
      sortBy: this.sortBy,
      sortDescending: this.sortDescending
    };

    this.subscriptionService.getAllForUser(this.userId, query).subscribe((subs) => {
      this.displayedSubscriptions = subs;
    });
  }

  onSearchChange(): void {
    // Debounce بسيط عشان منبعتش طلب لكل حرف بيتكتب
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => this.loadFilteredSubscriptions(), 350);
  }

  onFilterChange(): void {
    this.loadFilteredSubscriptions();
  }

  toggleSortDirection(): void {
    this.sortDescending = !this.sortDescending;
    this.loadFilteredSubscriptions();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategoryId = null;
    this.selectedTagId = null;
    this.selectedStatus = null;
    this.selectedBillingCycle = null;
    this.onlyFavorites = false;
    this.sortBy = 'RenewalDate';
    this.sortDescending = false;
    this.loadFilteredSubscriptions();
  }

  toggleFavoritesFilter(): void {
    this.onlyFavorites = !this.onlyFavorites;
    this.loadFilteredSubscriptions();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchTerm || this.selectedCategoryId !== null || this.selectedTagId !== null ||
      this.selectedStatus !== null || this.selectedBillingCycle !== null || this.onlyFavorites;
  }

  loadBudget(): void {
    this.budgetService.getBudget(this.userId).subscribe((budget) => {
      this.monthlyBudget = budget.monthlyBudget;
      this.checkBudgetWarning();
    });
  }

  get budgetPercentage(): number | null {
    if (!this.monthlyBudget || this.monthlyBudget <= 0) return null;
    return Math.round((this.monthlyTotal / this.monthlyBudget) * 100);
  }

  get isOverBudget(): boolean {
    return this.budgetPercentage !== null && this.budgetPercentage > 100;
  }

  private checkBudgetWarning(): void {
    if (this.isOverBudget && !this.hasWarnedOverBudget) {
      this.hasWarnedOverBudget = true;
      this.toastService.show('budget.exceededWarning', 'error');
    }
    if (!this.isOverBudget) {
      this.hasWarnedOverBudget = false;
    }
  }

  openBudgetForm(): void {
    this.budgetInputValue = this.monthlyBudget ?? 0;
    this.showBudgetForm = true;
  }

  saveBudget(): void {
    const value = this.budgetInputValue > 0 ? this.budgetInputValue : null;
    this.budgetService.setBudget(this.userId, value).subscribe({
      next: (budget) => {
        this.monthlyBudget = budget.monthlyBudget;
        this.showBudgetForm = false;
        this.hasWarnedOverBudget = false;
        this.checkBudgetWarning();
        this.toastService.show('budget.saved');
      },
      error: () => this.toastService.show('budget.saveError', 'error')
    });
  }

  cancelBudgetForm(): void {
    this.showBudgetForm = false;
  }

  get activeCount(): number {
    return this.allSubscriptions.filter((s) => s.status === SubscriptionStatus.Active).length;
  }

  get renewingSoonCount(): number {
    return this.allSubscriptions.filter(
      (s) => s.status === SubscriptionStatus.Active && s.daysUntilRenewal <= 3
    ).length;
  }

  get expiredCount(): number {
    return this.allSubscriptions.filter((s) => s.status === SubscriptionStatus.Expired).length;
  }

  get tickerItems(): Subscription[] {
    return this.allSubscriptions
      .filter((s) => s.status === SubscriptionStatus.Active && s.daysUntilRenewal <= 7)
      .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);
  }

  get yearlyTotal(): number {
    return this.allSubscriptions
      .filter((s) => s.status === SubscriptionStatus.Active)
      .reduce((sum, s) => sum + toYearlyEquivalent(s.price, s.billingCycle), 0);
  }

  openAddForm(): void {
    this.editingSubscription = null;
    this.showForm = true;
  }

  openEditForm(sub: Subscription): void {
    this.editingSubscription = sub;
    this.showForm = true;
  }

  // بقت public (بدل private) عشان نقدر ننادّيها مباشرة من الـ Template (زي حدث changed من subscription-list)
  reloadEverything(): void {
    this.loadAllSubscriptions();
    this.loadFilteredSubscriptions();
    this.chartRefreshTrigger++;
  }

  onSave(formValue: any): void {
    if (this.editingSubscription) {
      const dto: UpdateSubscription = { ...formValue };
      this.subscriptionService.update(this.editingSubscription.id, dto).subscribe({
        next: () => {
          this.showForm = false;
          this.reloadEverything();
          this.toastService.show('toast.updated');
        },
        error: () => this.toastService.show('toast.saveError', 'error')
      });
    } else {
      const dto: CreateSubscription = { ...formValue, userId: this.userId };
      this.subscriptionService.create(dto).subscribe({
        next: () => {
          this.showForm = false;
          this.reloadEverything();
          this.toastService.show('toast.added');
          this.celebrationService.celebrate();
        },
        error: () => this.toastService.show('toast.addError', 'error')
      });
    }
  }

  onDelete(id: number): void {
    this.subscriptionService.delete(id).subscribe({
      next: () => {
        this.reloadEverything();
        this.toastService.show('toast.deleted');
      },
      error: () => this.toastService.show('toast.deleteError', 'error')
    });
  }

  onCancel(): void {
    this.showForm = false;
  }

  onLogout(): void {
    this.authService.logout();
  }

  openCategoryManager(): void {
    this.showCategoryManager = true;
  }

  onCategoriesChanged(): void {
    this.loadCategories();
    this.reloadEverything();
  }

  openPaymentMethodManager(): void {
    this.showPaymentMethodManager = true;
  }

  onPaymentMethodsChanged(): void {
    this.reloadEverything();
  }

  openTagManager(): void {
    this.showTagManager = true;
  }

  onTagsChanged(): void {
    this.loadTags();
    this.reloadEverything();
  }
}
