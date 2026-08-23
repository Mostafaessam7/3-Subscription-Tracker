import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ToastComponent } from './components/toast/toast.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, TranslateModule, ToastComponent, ConfirmDialogComponent],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);

  ngOnInit(): void {
    this.languageService.init();
    this.themeService.init();
  }
}
