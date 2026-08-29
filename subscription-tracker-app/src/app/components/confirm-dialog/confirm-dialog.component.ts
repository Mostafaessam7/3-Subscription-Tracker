import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { DialogDirective } from '../../directives/dialog.directive';

@Component({
    selector: 'app-confirm-dialog',
    imports: [TranslateModule, DialogDirective],
    templateUrl: './confirm-dialog.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {
  dialogService = inject(ConfirmDialogService);
}
