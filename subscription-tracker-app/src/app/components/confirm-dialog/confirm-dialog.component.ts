import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
    selector: 'app-confirm-dialog',
    imports: [TranslateModule],
    templateUrl: './confirm-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  dialogService = inject(ConfirmDialogService);
}
