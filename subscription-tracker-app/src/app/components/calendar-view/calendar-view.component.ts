import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitchComponent } from '../language-switch/language-switch.component';
import { ThemeSwitchComponent } from '../theme-switch/theme-switch.component';
import { Subscription, SubscriptionStatus } from '../../models/subscription.model';

interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
  isToday: boolean;
  renewals: Subscription[];
}

@Component({
    selector: 'app-calendar-view',
    imports: [CommonModule, RouterLink, TranslatePipe, LanguageSwitchComponent, ThemeSwitchComponent],
    templateUrl: './calendar-view.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    styleUrl: './calendar-view.component.css'
})
export class CalendarViewComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private authService = inject(AuthService);

  currentMonth = new Date();
  days: CalendarDay[] = [];
  allSubscriptions: Subscription[] = [];
  selectedDay: CalendarDay | null = null;

  private get userId(): number {
    return this.authService.currentUser()!.userId;
  }

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  private loadSubscriptions(): void {
    this.subscriptionService.getAllForUser(this.userId, { status: SubscriptionStatus.Active }).subscribe((subs) => {
      this.allSubscriptions = subs;
      this.buildCalendar();
    });
  }

  private buildCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    // بنرجع لبداية الأسبوع (السبت كأول يوم، حسب المنطقة العربية) عشان الشبكة تبدأ صف كامل
    const startOffset = firstDayOfMonth.getDay();
    const gridStart = new Date(year, month, 1 - startOffset);

    const today = new Date();
    const days: CalendarDay[] = [];

    // 42 خانة (6 أسابيع) بتغطي أي شهر مهما كان شكله
    for (let i = 0; i < 42; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);

      const renewals = this.allSubscriptions.filter((s) => {
        const renewalDate = new Date(s.nextRenewalDate);
        return renewalDate.getFullYear() === date.getFullYear() &&
          renewalDate.getMonth() === date.getMonth() &&
          renewalDate.getDate() === date.getDate();
      });

      days.push({
        date,
        inCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        renewals
      });
    }

    this.days = days;
    this.selectedDay = null;
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.buildCalendar();
  }

  goToToday(): void {
    this.currentMonth = new Date();
    this.buildCalendar();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day.renewals.length > 0 ? day : null;
  }

  get monthlyRenewalsTotal(): number {
    return this.days
      .filter((d) => d.inCurrentMonth)
      .reduce((sum, d) => sum + d.renewals.reduce((s, r) => s + r.price, 0), 0);
  }
}
