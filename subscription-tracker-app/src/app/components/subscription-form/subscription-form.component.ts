import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject, ChangeDetectionStrategy } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { BillingCycle, Category, Currency, PaymentMethod, Subscription, SubscriptionStatus, Tag } from '../../models/subscription.model';
import { billingCycleKey } from '../../utils/billing-cycle.util';
import { getLogoUrl } from '../../utils/logo.util';
import { CategoryService } from '../../services/category.service';
import { PaymentMethodService } from '../../services/payment-method.service';
import { TagService } from '../../services/tag.service';
import { CategoryNamePipe } from '../../pipes/category-name.pipe';

@Component({
    selector: 'app-subscription-form',
    imports: [ReactiveFormsModule, TranslatePipe, CategoryNamePipe],
    templateUrl: './subscription-form.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './subscription-form.component.css'
})
export class SubscriptionFormComponent implements OnInit, OnChanges {
  private categoryService = inject(CategoryService);
  private paymentMethodService = inject(PaymentMethodService);
  private tagService = inject(TagService);

  @Input() editingSubscription: Subscription | null = null;
  @Output() save = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  categories: Category[] = [];
  paymentMethods: PaymentMethod[] = [];
  allTags: Tag[] = [];
  selectedTagIds: number[] = [];
  showMoreDetails = false;

  billingCycles = [
    { value: BillingCycle.Weekly, key: billingCycleKey(BillingCycle.Weekly) },
    { value: BillingCycle.Monthly, key: billingCycleKey(BillingCycle.Monthly) },
    { value: BillingCycle.Quarterly, key: billingCycleKey(BillingCycle.Quarterly) },
    { value: BillingCycle.Yearly, key: billingCycleKey(BillingCycle.Yearly) }
  ];

  statuses = [
    { value: SubscriptionStatus.Active, key: 'status.active' },
    { value: SubscriptionStatus.Expired, key: 'status.expired' },
    { value: SubscriptionStatus.Cancelled, key: 'status.cancelled' }
  ];

  currencies = [
    { value: Currency.EGP, label: 'EGP' },
    { value: Currency.USD, label: 'USD' },
    { value: Currency.EUR, label: 'EUR' },
    { value: Currency.GBP, label: 'GBP' },
    { value: Currency.SAR, label: 'SAR' },
    { value: Currency.AED, label: 'AED' }
  ];

  private fb = new FormBuilder();

  form = this.fb.group({
    name: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    currency: [Currency.EGP],
    billingCycle: [BillingCycle.Monthly, Validators.required],
    nextRenewalDate: ['', Validators.required],
    categoryId: [null as number | null],
    status: [SubscriptionStatus.Active],
    description: [''],
    startDate: [''],
    autoRenew: [true],
    isFavorite: [false],
    icon: [''],
    websiteUrl: [''],
    notes: [''],
    paymentMethodId: [null as number | null]
  });

  ngOnInit(): void {
    this.categoryService.getAll().subscribe((categories) => (this.categories = categories));
    this.paymentMethodService.getAll().subscribe((methods) => (this.paymentMethods = methods));
    this.tagService.getAll().subscribe((tags) => (this.allTags = tags));
  }

  ngOnChanges(): void {
    if (this.editingSubscription) {
      const s = this.editingSubscription;
      this.form.patchValue({
        name: s.name,
        price: s.price,
        currency: s.currency,
        billingCycle: s.billingCycle,
        nextRenewalDate: s.nextRenewalDate.substring(0, 10),
        categoryId: s.category?.id ?? null,
        status: s.status,
        description: s.description ?? '',
        startDate: s.startDate ? s.startDate.substring(0, 10) : '',
        autoRenew: s.autoRenew,
        isFavorite: s.isFavorite,
        icon: s.icon ?? '',
        websiteUrl: s.websiteUrl ?? '',
        notes: s.notes ?? '',
        paymentMethodId: s.paymentMethod?.id ?? null
      });
      this.selectedTagIds = s.tags.map((t) => t.id);
      this.showMoreDetails = !!(s.description || s.websiteUrl || s.notes || s.startDate);
    } else {
      this.form.reset({
        name: '',
        price: 0,
        currency: Currency.EGP,
        billingCycle: BillingCycle.Monthly,
        nextRenewalDate: this.todayAsIsoDate(),
        categoryId: null,
        status: SubscriptionStatus.Active,
        description: '',
        startDate: '',
        autoRenew: true,
        isFavorite: false,
        icon: '',
        websiteUrl: '',
        notes: '',
        paymentMethodId: null
      });
      this.selectedTagIds = [];
      this.showMoreDetails = false;
    }
  }

  toggleMoreDetails(): void {
    this.showMoreDetails = !this.showMoreDetails;
  }

  toggleTag(tagId: number): void {
    this.selectedTagIds = this.selectedTagIds.includes(tagId)
      ? this.selectedTagIds.filter((id) => id !== tagId)
      : [...this.selectedTagIds, tagId];
  }

  isTagSelected(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  get logoPreviewUrl(): string | null {
    return getLogoUrl(this.form.controls.websiteUrl.value);
  }

  private todayAsIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.save.emit({
      ...raw,
      categoryId: raw.categoryId ? Number(raw.categoryId) : null,
      paymentMethodId: raw.paymentMethodId ? Number(raw.paymentMethodId) : null,
      description: raw.description || null,
      startDate: raw.startDate || null,
      websiteUrl: raw.websiteUrl || null,
      notes: raw.notes || null,
      icon: raw.icon || null,
      tagIds: this.selectedTagIds
    });
  }
}
