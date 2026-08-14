import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CalendarViewComponent } from './calendar-view.component';
import { BillingCycle, Currency, Subscription, SubscriptionStatus, UserRole } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('CalendarViewComponent', () => {
  let component: CalendarViewComponent;
  let fixture: ComponentFixture<CalendarViewComponent>;
  let httpMock: HttpTestingController;
  const subsBaseUrl = `${environment.apiUrl}/subscriptions`;

  function buildSub(id: number, nextRenewalDate: string, price = 100): Subscription {
    return {
      id, name: `Sub ${id}`, description: null, price, currency: Currency.EGP,
      billingCycle: BillingCycle.Monthly, startDate: null, nextRenewalDate,
      autoRenew: true, websiteUrl: null, notes: null, status: SubscriptionStatus.Active,
      isFavorite: false, icon: null, daysUntilRenewal: 1, category: null, paymentMethod: null, tags: []
    };
  }

  beforeEach(async () => {
    localStorage.setItem('subscription_tracker_user', JSON.stringify({
      userId: 1, name: 'Mostafa', email: 'mostafa@example.com', role: UserRole.User,
      token: 'fake-token', expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));
    localStorage.setItem('subscription_tracker_token', 'fake-token');

    await TestBed.configureTestingModule({
      imports: [CalendarViewComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarViewComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('بيتعمله Create بنجاح، وبيبني شبكة الشهر من 42 يوم', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`).flush([]);

    expect(component.days.length).toBe(42);
  });

  it('بيربط الاشتراكات بالأيام الصح حسب تاريخ التجديد', () => {
    const today = new Date();
    const renewalDate = new Date(today.getFullYear(), today.getMonth(), 15);
    const sub = buildSub(1, renewalDate.toISOString());

    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`).flush([sub]);

    const day = component.days.find(
      (d) => d.date.getDate() === 15 && d.date.getMonth() === renewalDate.getMonth() && d.inCurrentMonth
    );
    expect(day?.renewals.length).toBe(1);
  });

  it('previousMonth وnextMonth بيغيّروا الشهر المعروض', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`).flush([]);

    const initialMonth = component.currentMonth.getMonth();
    component.nextMonth();
    expect(component.currentMonth.getMonth()).toBe((initialMonth + 1) % 12);

    component.previousMonth();
    expect(component.currentMonth.getMonth()).toBe(initialMonth);
  });

  it('goToToday بيرجّع currentMonth للشهر الحالي', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`).flush([]);

    component.nextMonth();
    component.goToToday();

    const today = new Date();
    expect(component.currentMonth.getMonth()).toBe(today.getMonth());
  });

  it('selectDay بيحدد اليوم بس لو فيه تجديدات، وإلا بيرجّع selectedDay لـ null', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`).flush([]);

    const emptyDay = component.days[0];
    component.selectDay(emptyDay);
    expect(component.selectedDay).toBeNull();

    const dayWithRenewals = { ...emptyDay, renewals: [buildSub(1, new Date().toISOString())] };
    component.selectDay(dayWithRenewals);
    expect(component.selectedDay).toBe(dayWithRenewals);
  });

  it('monthlyRenewalsTotal بيجمع أسعار التجديدات في الشهر الحالي بس', () => {
    const today = new Date();
    const inMonth = new Date(today.getFullYear(), today.getMonth(), 10);
    const sub = buildSub(1, inMonth.toISOString(), 150);

    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`).flush([sub]);

    expect(component.monthlyRenewalsTotal).toBe(150);
  });
});
