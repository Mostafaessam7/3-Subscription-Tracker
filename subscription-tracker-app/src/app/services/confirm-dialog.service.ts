import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  message: string;
  resolve: (value: boolean) => void;
}

// بديل confirm() الافتراضية بتاعة المتصفح (شكلها قبيح ومش متسقة مع هوية التطبيق)
// الاستخدام: const confirmed = await this.confirmDialogService.confirm('متأكد؟');
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  state = signal<ConfirmState | null>(null);

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({ message, resolve });
    });
  }

  respond(result: boolean): void {
    this.state()?.resolve(result);
    this.state.set(null);
  }
}
