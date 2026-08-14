import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { SubscriptionListComponent } from './subscription-list.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { BillingCycle, Currency, Subscription, SubscriptionStatus } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('SubscriptionListComponent', () => {
  let component: SubscriptionListComponent;
  let fixture: ComponentFixture<SubscriptionListComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/subscriptions`;

  const fakeSubscription: Subscription = {
    id: 1, name: 'Netflix', description: null, price: 200, currency: Currency.EGP,
    billingCycle: BillingCycle.Monthly, startDate: null, nextRenewalDate: '2026-03-01',
    autoRenew: true, websiteUrl: null, notes: null, status: SubscriptionStatus.Active,
    isFavorite: false, icon: null, daysUntilRenewal: 2, category: null, paymentMethod: null, tags: []
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionListComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    component.subscriptions = [fakeSubscription];
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح', () => {
    expect(component).toBeTruthy();
  });

  it('statusKey بيرجّع المفتاح الصح لكل حالة', () => {
    expect(component.statusKey(SubscriptionStatus.Active)).toBe('status.active');
    expect(component.statusKey(SubscriptionStatus.Expired)).toBe('status.expired');
    expect(component.statusKey(SubscriptionStatus.Cancelled)).toBe('status.cancelled');
  });

  it('renewalKey بيرجّع المفتاح الصح حسب عدد الأيام', () => {
    expect(component.renewalKey(0)).toBe('list.renewsTomorrow');
    expect(component.renewalKey(2)).toBe('list.renewsInDays');
    expect(component.renewalKey(10)).toBe('list.inDays');
  });

  it('onToggleFavorite بيبعت طلب وبيعمل Emit لـ changed لما ينجح', () => {
    const changedSpy = spyOn(component.changed, 'emit');
    const event = new Event('click');
    spyOn(event, 'stopPropagation');

    component.onToggleFavorite(fakeSubscription, event);

    expect(event.stopPropagation).toHaveBeenCalled();
    const req = httpMock.expectOne(`${baseUrl}/${fakeSubscription.id}`);
    req.flush(null);

    expect(changedSpy).toHaveBeenCalled();
  });

  it('onToggleFavorite بيعرض Toast خطأ لو الطلب فشل', () => {
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');
    component.onToggleFavorite(fakeSubscription, new Event('click'));

    const req = httpMock.expectOne(`${baseUrl}/${fakeSubscription.id}`);
    req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });

    expect(toastSpy).toHaveBeenCalledWith('toast.saveError', 'error');
  });

  it('onDuplicate بيبعت طلب نسخ وبيعرض Toast نجاح', () => {
    const changedSpy = spyOn(component.changed, 'emit');
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');

    component.onDuplicate(fakeSubscription, new Event('click'));

    const req = httpMock.expectOne(`${baseUrl}/${fakeSubscription.id}/duplicate`);
    req.flush(fakeSubscription);

    expect(toastSpy).toHaveBeenCalledWith('list.duplicated');
    expect(changedSpy).toHaveBeenCalled();
  });

  it('onDelete مابيعملش Emit لو المستخدم ألغى التأكيد', async () => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(false);
    const deleteSpy = spyOn(component.delete, 'emit');

    await component.onDelete(fakeSubscription.id);

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('onDelete بيعمل Emit بالـ id بعد التأكيد', async () => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(true);
    const deleteSpy = spyOn(component.delete, 'emit');

    await component.onDelete(fakeSubscription.id);

    expect(deleteSpy).toHaveBeenCalledWith(fakeSubscription.id);
  });
});
