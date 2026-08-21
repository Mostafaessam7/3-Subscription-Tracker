import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SubscriptionService } from '../../services/subscription.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { ExportService } from '../../services/export.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { AnalyticsInsights, Subscription, SubscriptionStatus } from '../../models/subscription.model';
import { billingCycleKey } from '../../utils/billing-cycle.util';
import { CategoryNamePipe } from '../../pipes/category-name.pipe';

type ReportPreset = 'all' | 'active' | 'expired' | 'upcoming';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule, LanguageSwitchComponent, ThemeSwitchComponent, CategoryNamePipe],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css'
})
export class ReportsComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private analyticsService = inject(AnalyticsService);
  private authService = inject(AuthService);
  private exportService = inject(ExportService);
  private translate = inject(TranslateService);

  SubscriptionStatus = SubscriptionStatus;
  billingCycleKey = billingCycleKey;

  preset: ReportPreset = 'all';
  fromDate = '';
  toDate = '';

  subscriptions: Subscription[] = [];
  insights: AnalyticsInsights | null = null;
  loading = true;

  private get userId(): number {
    return this.authService.currentUser()!.userId;
  }

  ngOnInit(): void {
    this.loadInsights();
    this.applyPreset('all');
  }

  private loadInsights(): void {
    this.analyticsService.getInsights(this.userId).subscribe((insights) => {
      this.insights = insights;
    });
  }

  applyPreset(preset: ReportPreset): void {
    this.preset = preset;
    this.fromDate = '';
    this.toDate = '';
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    const query: any = {};

    if (this.preset === 'active') query.status = SubscriptionStatus.Active;
    if (this.preset === 'expired') query.status = SubscriptionStatus.Expired;
    if (this.preset === 'upcoming') {
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(today.getDate() + 30);
      query.renewalFrom = today.toISOString().substring(0, 10);
      query.renewalTo = in30Days.toISOString().substring(0, 10);
    }

    if (this.fromDate) query.renewalFrom = this.fromDate;
    if (this.toDate) query.renewalTo = this.toDate;

    this.subscriptionService.getAllForUser(this.userId, query).subscribe((subs) => {
      this.subscriptions = subs;
      this.loading = false;
    });
  }

  onCustomDateChange(): void {
    this.preset = 'all';
    this.loadData();
  }

  get totalMonthly(): number {
    return this.subscriptions
      .filter((s) => s.status === SubscriptionStatus.Active)
      .reduce((sum, s) => sum + s.price, 0);
  }

  statusKey(status: SubscriptionStatus): string {
    switch (status) {
      case SubscriptionStatus.Expired: return 'status.expired';
      case SubscriptionStatus.Cancelled: return 'status.cancelled';
      default: return 'status.active';
    }
  }

  exportCsv(): void {
    const translateFn = (key: string) => this.translate.instant(key);
    this.exportService.exportToCsv(this.subscriptions, this.translate.instant('reports.filename'), translateFn);
  }

  exportPdf(): void {
    const translateFn = (key: string) => this.translate.instant(key);
    this.exportService.exportToPdf(this.subscriptions, this.translate.instant('reports.filename'), translateFn);
  }

  print(): void {
    window.print();
  }
}
