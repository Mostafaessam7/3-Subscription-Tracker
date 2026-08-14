import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { SubscriptionFormComponent } from './subscription-form.component';
import { BillingCycle, Currency, Subscription, SubscriptionStatus } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('SubscriptionFormComponent', () => {
  let component: SubscriptionFormComponent;
  let fixture: ComponentFixture<SubscriptionFormComponent>;
  let httpMock: HttpTestingController;

  const fakeSubscription: Subscription = {
    id: 1, name: 'Netflix', description: 'اشتراك ترفيه', price: 200, currency: Currency.EGP,
    billingCycle: BillingCycle.Monthly, startDate: '2026-01-01', nextRenewalDate: '2026-02-01',
    autoRenew: true, websiteUrl: 'https://netflix.com', notes: null, status: SubscriptionStatus.Active,
    isFavorite: false, icon: null, daysUntilRenewal: 5,
    category: { id: 1, name: 'ترفيه', color: '#35D0C6', icon: '🎬' },
    paymentMethod: null,
    tags: [{ id: 1, name: 'شغل', color: '#818CF8' }]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubscriptionFormComponent, HttpClientTestingModule, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(`${environment.apiUrl}/categories`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/paymentmethods`).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/tags`).flush([]);
  });

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح وبيحمّل التصنيفات ووسائل الدفع والتاجز', () => {
    expect(component).toBeTruthy();
  });

  it('onSubmit مايعملش Emit لو الفورم Invalid (الاسم فاضي)', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.form.patchValue({ name: '' });

    component.onSubmit();

    expect(saveSpy).not.toHaveBeenCalled();
    expect(component.form.touched).toBeTrue();
  });

  it('onSubmit بيعمل Emit ببيانات صحيحة لما الفورم يبقى Valid', () => {
    const saveSpy = spyOn(component.save, 'emit');
    component.form.patchValue({ name: 'Netflix', price: 200, nextRenewalDate: '2026-03-01' });

    component.onSubmit();

    expect(saveSpy).toHaveBeenCalled();
    const emitted = saveSpy.calls.mostRecent().args[0];
    expect(emitted.name).toBe('Netflix');
    expect(emitted.tagIds).toEqual([]);
  });

  it('ngOnChanges بيملأ الفورم ببيانات الاشتراك لما editingSubscription يتحدد', () => {
    component.editingSubscription = fakeSubscription;
    component.ngOnChanges();

    expect(component.form.value.name).toBe('Netflix');
    expect(component.form.value.categoryId).toBe(1);
    expect(component.selectedTagIds).toEqual([1]);
    expect(component.showMoreDetails).toBeTrue(); // فيه description وwebsiteUrl
  });

  it('ngOnChanges بيصفّر الفورم لو editingSubscription null', () => {
    component.editingSubscription = null;
    component.ngOnChanges();

    expect(component.form.value.name).toBe('');
    expect(component.selectedTagIds).toEqual([]);
  });

  it('toggleTag بيضيف/يشيل التاج من selectedTagIds', () => {
    expect(component.isTagSelected(5)).toBeFalse();

    component.toggleTag(5);
    expect(component.isTagSelected(5)).toBeTrue();

    component.toggleTag(5);
    expect(component.isTagSelected(5)).toBeFalse();
  });

  it('toggleMoreDetails بيقلب showMoreDetails', () => {
    const initial = component.showMoreDetails;
    component.toggleMoreDetails();
    expect(component.showMoreDetails).toBe(!initial);
  });
});
