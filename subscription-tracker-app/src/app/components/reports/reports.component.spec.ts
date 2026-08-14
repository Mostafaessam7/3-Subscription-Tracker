import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReportsComponent } from './reports.component';
import { ExportService } from '../../services/export.service';
import { AnalyticsInsights, BillingCycle, Currency, Subscription, SubscriptionStatus, UserRole } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('ReportsComponent', () => {
  let component: ReportsComponent;
  let fixture: ComponentFixture<ReportsComponent>;
  let httpMock: HttpTestingController;
  const analyticsBaseUrl = `${environment.apiUrl}/analytics`;
  const subsBaseUrl = `${environment.apiUrl}/subscriptions`;

  const fakeInsights: AnalyticsInsights = {
    averageMonthlyCost: 300, mostExpensive: null, cheapest: null,
    potentialYearlySavingsIfAllCancelled: 3600, top5MostExpensive: []
  };

  const fakeSubscription: Subscription = {
    id: 1, name: 'Netflix', description: null, price: 200, currency: Currency.EGP,
    billingCycle: BillingCycle.Monthly, startDate: null, nextRenewalDate: '2026-03-01',
    autoRenew: true, websiteUrl: null, notes: null, status: SubscriptionStatus.Active,
    isFavorite: false, icon: null, daysUntilRenewal: 2, category: null, paymentMethod: null, tags: []
  };

  beforeEach(async () => {
    localStorage.setItem('subscription_tracker_user', JSON.stringify({
      userId: 1, name: 'Mostafa', email: 'mostafa@example.com', role: UserRole.User,
      token: 'fake-token', expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));
    localStorage.setItem('subscription_tracker_token', 'fake-token');

    await TestBed.configureTestingModule({
      imports: [ReportsComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ReportsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(`${analyticsBaseUrl}/insights/1`).flush(fakeInsights);
    httpMock.expectOne(`${subsBaseUrl}/user/1`).flush([fakeSubscription]);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('بيتعمله Create بنجاح، وبيحمّل الـ Insights والاشتراكات عند البدء', () => {
    expect(component).toBeTruthy();
    expect(component.insights).toEqual(fakeInsights);
    expect(component.subscriptions).toEqual([fakeSubscription]);
    expect(component.loading).toBeFalse();
  });

  it('totalMonthly بيجمع أسعار الاشتراكات النشطة بس', () => {
    component.subscriptions = [
      fakeSubscription,
      { ...fakeSubscription, id: 2, price: 100, status: SubscriptionStatus.Cancelled }
    ];
    expect(component.totalMonthly).toBe(200);
  });

  it('applyPreset بيبعت طلب بحالة "Active" لما يتحدد preset=active', () => {
    component.applyPreset('active');
    const req = httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`);
    expect(req.request.params.get('status')).toBe(String(SubscriptionStatus.Active));
    req.flush([]);
  });

  it('applyPreset بيبعت مدى تاريخ آخر 30 يوم لما يتحدد preset=upcoming', () => {
    component.applyPreset('upcoming');
    const req = httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`);
    expect(req.request.params.has('renewalFrom')).toBeTrue();
    expect(req.request.params.has('renewalTo')).toBeTrue();
    req.flush([]);
  });

  it('onCustomDateChange بيرجّع preset لـ all وبيعيد التحميل بمدى التاريخ المخصص', () => {
    component.preset = 'expired';
    component.fromDate = '2026-01-01';
    component.toDate = '2026-01-31';

    component.onCustomDateChange();

    expect(component.preset).toBe('all');
    const req = httpMock.expectOne((r) => r.url === `${subsBaseUrl}/user/1`);
    expect(req.request.params.get('renewalFrom')).toBe('2026-01-01');
    req.flush([]);
  });

  it('exportCsv بينادي ExportService.exportToCsv', () => {
    const exportSpy = spyOn(TestBed.inject(ExportService), 'exportToCsv');
    component.exportCsv();
    expect(exportSpy).toHaveBeenCalled();
  });

  it('exportPdf بينادي ExportService.exportToPdf', () => {
    const exportSpy = spyOn(TestBed.inject(ExportService), 'exportToPdf');
    component.exportPdf();
    expect(exportSpy).toHaveBeenCalled();
  });
});
