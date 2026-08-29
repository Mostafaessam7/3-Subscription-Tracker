import { Component, EventEmitter, Input, OnChanges, Output, inject, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PaymentMethodService } from '../../services/payment-method.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { PaymentMethod, PaymentMethodType } from '../../models/subscription.model';
import { DialogDirective } from '../../directives/dialog.directive';

@Component({
    selector: 'app-payment-method-manager',
    imports: [FormsModule, TranslateModule, DialogDirective],
    templateUrl: './payment-method-manager.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './payment-method-manager.component.css'
})
export class PaymentMethodManagerComponent implements OnChanges {
  private paymentMethodService = inject(PaymentMethodService);
  private toastService = inject(ToastService);
  private confirmDialogService = inject(ConfirmDialogService);
  private translate = inject(TranslateService);

  @Input() open = false;
  @Output() closed = new EventEmitter<void>();
  @Output() changed = new EventEmitter<void>();

  methods: PaymentMethod[] = [];

  types = [
    { value: PaymentMethodType.Cash, key: 'paymentMethods.cash' },
    { value: PaymentMethodType.Card, key: 'paymentMethods.card' },
    { value: PaymentMethodType.Bank, key: 'paymentMethods.bank' },
    { value: PaymentMethodType.Wallet, key: 'paymentMethods.wallet' }
  ];

  editingId: number | null = null;
  formName = '';
  formType = PaymentMethodType.Cash;

  ngOnChanges(): void {
    if (this.open) {
      this.load();
    }
  }

  private load(): void {
    this.paymentMethodService.getAll().subscribe((methods) => {
      this.methods = methods;
    });
  }

  typeKey(type: PaymentMethodType): string {
    return this.types.find((t) => t.value === type)?.key ?? 'paymentMethods.cash';
  }

  startAdd(): void {
    this.editingId = null;
    this.formName = '';
    this.formType = PaymentMethodType.Cash;
  }

  startEdit(method: PaymentMethod): void {
    this.editingId = method.id;
    this.formName = method.name;
    this.formType = method.type;
  }

  save(): void {
    if (!this.formName.trim()) return;
    const dto = { name: this.formName.trim(), type: this.formType };

    const request$: Observable<PaymentMethod | void> = this.editingId
      ? this.paymentMethodService.update(this.editingId, dto)
      : this.paymentMethodService.create(dto);

    request$.subscribe({
      next: () => {
        this.toastService.show(this.editingId ? 'paymentMethods.updated' : 'paymentMethods.added');
        this.load();
        this.changed.emit();
        this.startAdd();
      },
      error: () => this.toastService.show('paymentMethods.saveError', 'error')
    });
  }

  async delete(method: PaymentMethod): Promise<void> {
    const message = this.translate.instant('paymentMethods.confirmDelete', { name: method.name });
    const confirmed = await this.confirmDialogService.confirm(message);
    if (!confirmed) return;

    this.paymentMethodService.delete(method.id).subscribe({
      next: () => {
        this.toastService.show('paymentMethods.deleted');
        this.load();
        this.changed.emit();
        if (this.editingId === method.id) this.startAdd();
      },
      error: () => this.toastService.show('paymentMethods.deleteError', 'error')
    });
  }

  close(): void {
    this.closed.emit();
  }
}
