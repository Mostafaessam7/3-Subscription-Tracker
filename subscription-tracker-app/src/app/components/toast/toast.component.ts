import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-toast',
    imports: [],
    templateUrl: './toast.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './toast.component.css'
})
export class ToastComponent {
  toastService = inject(ToastService);
}
