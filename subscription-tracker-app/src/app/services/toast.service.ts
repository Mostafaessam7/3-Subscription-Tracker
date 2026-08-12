import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private translate = inject(TranslateService);

  toasts = signal<Toast[]>([]);
  private nextId = 0;

  // بتستقبل مفتاح ترجمة (زي 'toast.added') مش نص جاهز، عشان يتترجم حسب اللغة الحالية
  show(translationKey: string, type: 'success' | 'error' = 'success'): void {
    const id = this.nextId++;
    const message = this.translate.instant(translationKey);
    this.toasts.update((list) => [...list, { id, message, type }]);

    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
