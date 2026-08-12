import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardComponent } from './dashboard.component';
import { SubscriptionStatus, UserRole } from '../../models/subscription.model';
import { AuthResponse } from '../../models/auth.model';
import { environment } from '../../../environments/environment';

// التست ده بيركّز على منطق الكومبوننت (حسابات، فلترة، Budget Warning) من غير ما يعمل Render
// كامل للـ Template - عشان نتفادى الاعتماد على كل الـ Child Components المتداخلة (Vanta, Charts...)
// اللي مالهاش لازمة هنا. بننادي ngOnInit() يدوي ونطلع الـ HTTP Requests بـ httpMock بدل detectChanges().
describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpMock: HttpTestingController;

  const fakeUser: AuthResponse = {
    userId: 1,
    name: 'Mostafa',
    email: 'mostafa@example.com',
    role: UserRole.User,
    token: 'fake-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString()
  };

  function initAndFlush(monthlyTotal = 100, monthlyBudget: number | null = null): void {
    component.ngOnInit();

    httpMock.expectOne(`${environment.apiUrl}/categories`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/tags`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/subscriptions/user/1/monthly-total`).flush(monthlyTotal);
    httpMock.expectOne(`${environment.apiUrl}/users/1/budget`).flush({ monthlyBudget });

    // في ngOnInit فيه نداءين لنفس الـ URL بالظبط (/subscriptions/user/1) - واحد من غير فلاتر
    // (loadAllSubscriptions) وواحد بفلاتر فاضية (loadFilteredSubscriptions)، فبنطلعهم مع بعض هنا
    const subsRequests = httpMock.match((r) => r.url === `${environment.apiUrl}/subscriptions/user/1`);
    expect(subsRequests.length).toBe(2);
    subsRequests.forEach((req) => req.flush([]));
  }

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('subscription_tracker_token', fakeUser.token);
    localStorage.setItem('subscription_tracker_user', JSON.stringify(fakeUser));

    TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('بيتعمل له Create من غير مشاكل', () => {
    expect(component).toBeTruthy();
  });

  it('isAdmin بيرجّع false للمستخدم العادي', () => {
    expect(component.isAdmin).toBeFalse();
  });

  it('ngOnInit بيحمّل كل البيانات المطلوبة (categories, tags, subscriptions, budget)', () => {
    initAndFlush();

    expect(component.categories).toEqual([]);
    expect(component.monthlyTotal).toBe(100);
  });

  it('activeCount/expiredCount بيتحسبوا صح من allSubscriptions', () => {
    initAndFlush();

    component.allSubscriptions = [
      { status: SubscriptionStatus.Active, daysUntilRenewal: 10 } as any,
      { status: SubscriptionStatus.Active, daysUntilRenewal: 2 } as any,
      { status: SubscriptionStatus.Expired, daysUntilRenewal: -1 } as any
    ];

    expect(component.activeCount).toBe(2);
    expect(component.expiredCount).toBe(1);
    expect(component.renewingSoonCount).toBe(1); // بس اللي Active و daysUntilRenewal <= 3
  });

  it('budgetPercentage بيرجّع null لو مفيش ميزانية متحددة', () => {
    initAndFlush(100, null);

    expect(component.budgetPercentage).toBeNull();
    expect(component.isOverBudget).toBeFalse();
  });

  it('budgetPercentage وisOverBudget بيتحسبوا صح لما فيه ميزانية', () => {
    initAndFlush(150, 100); // 150% من الميزانية

    expect(component.budgetPercentage).toBe(150);
    expect(component.isOverBudget).toBeTrue();
  });

  it('بيبعت Toast تحذيري مرة واحدة بس لما المصروف يعدّي الميزانية', () => {
    initAndFlush(150, 100);

    expect((component as any).hasWarnedOverBudget).toBeTrue();
  });

  it('hasActiveFilters بيرجّع true أول ما أي فلتر يتفعّل', () => {
    initAndFlush();

    expect(component.hasActiveFilters).toBeFalse();

    component.searchTerm = 'netflix';
    expect(component.hasActiveFilters).toBeTrue();
  });

  it('clearFilters بيصفّر كل الفلاتر ويعيد التحميل', () => {
    initAndFlush();

    component.searchTerm = 'netflix';
    component.onlyFavorites = true;
    component.sortDescending = true;

    component.clearFilters();
    httpMock.expectOne((r) => r.url === `${environment.apiUrl}/subscriptions/user/1`).flush([]);

    expect(component.searchTerm).toBe('');
    expect(component.onlyFavorites).toBeFalse();
    expect(component.sortDescending).toBeFalse();
  });

  it('onLogout بينادي authService.logout()', () => {
    initAndFlush();
    spyOn(component.authService, 'logout');

    component.onLogout();

    expect(component.authService.logout).toHaveBeenCalled();
  });
});
