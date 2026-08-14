import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SubscriptionDetailComponent } from './subscription-detail.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { BillingCycle, Currency, Subscription, SubscriptionStatus } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('SubscriptionDetailComponent', () => {
  let component: SubscriptionDetailComponent;
  let fixture: ComponentFixture<SubscriptionDetailComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  const baseUrl = `${environment.apiUrl}/subscriptions`;

  const fakeSubscription: Subscription = {
    id: 7, name: 'Netflix', description: null, price: 200, currency: Currency.EGP,
    billingCycle: BillingCycle.Monthly, startDate: null, nextRenewalDate: '2026-03-01',
    autoRenew: true, websiteUrl: null, notes: null, status: SubscriptionStatus.Active,
    isFavorite: false, icon: null, daysUntilRenewal: 2, category: null, paymentMethod: null, tags: []
  };

  function setup(id: string | null): void {
    TestBed.configureTestingModule({
      imports: [SubscriptionDetailComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } }
        }
      ]
    });

    fixture = TestBed.createComponent(SubscriptionDetailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('لو مفيش id في الرابط، notFound بتبقى true من غير ما يبعت طلب', () => {
    setup(null);
    expect(component.notFound).toBeTrue();
    expect(component.loading).toBeFalse();
    httpMock.expectNone(`${baseUrl}/0`);
  });

  it('بيحمّل الاشتراك بنجاح لما الـ id يكون صحيح', () => {
    setup('7');
    httpMock.expectOne(`${baseUrl}/7`).flush(fakeSubscription);

    expect(component.subscription).toEqual(fakeSubscription);
    expect(component.loading).toBeFalse();
    expect(component.notFound).toBeFalse();
  });

  it('notFound بتبقى true لو السيرفر رجّع خطأ (404)', () => {
    setup('999');
    httpMock.expectOne(`${baseUrl}/999`).flush(null, { status: 404, statusText: 'Not Found' });

    expect(component.notFound).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('yearlyEquivalent بيرجّع 0 لو مفيش اشتراك محمّل', () => {
    setup('7');
    httpMock.expectOne(`${baseUrl}/7`).flush(fakeSubscription);
    component.subscription = null;

    expect(component.yearlyEquivalent).toBe(0);
  });

  it('onEdit بيفتح فورم التعديل', () => {
    setup('7');
    httpMock.expectOne(`${baseUrl}/7`).flush(fakeSubscription);

    component.onEdit();
    expect(component.showEditForm).toBeTrue();

    component.onCancelEdit();
    expect(component.showEditForm).toBeFalse();
  });

  it('onDelete مابيعملش حاجة لو المستخدم ألغى', async () => {
    setup('7');
    httpMock.expectOne(`${baseUrl}/7`).flush(fakeSubscription);
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(false);

    await component.onDelete();

    expect(component.subscription).toEqual(fakeSubscription);
    httpMock.expectNone(`${baseUrl}/7`);
  });

  it('onDelete بيمسح الاشتراك ويودّي المستخدم للداشبورد بعد التأكيد', fakeAsync(() => {
    setup('7');
    httpMock.expectOne(`${baseUrl}/7`).flush(fakeSubscription);
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(true);
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');

    component.onDelete();
    tick();

    httpMock.expectOne(`${baseUrl}/7`).flush(null);
    tick(3000);

    expect(toastSpy).toHaveBeenCalledWith('toast.deleted');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  }));

  it('onDuplicate بيودّي المستخدم لصفحة النسخة الجديدة', () => {
    setup('7');
    httpMock.expectOne(`${baseUrl}/7`).flush(fakeSubscription);

    component.onDuplicate();
    const req = httpMock.expectOne(`${baseUrl}/7/duplicate`);
    req.flush({ ...fakeSubscription, id: 99 });

    expect(router.navigate).toHaveBeenCalledWith(['/subscriptions', 99]);
  });
});
