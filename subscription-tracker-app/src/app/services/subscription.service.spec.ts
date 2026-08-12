import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubscriptionService } from './subscription.service';
import { BillingCycle, Subscription, SubscriptionStatus } from '../models/subscription.model';
import { environment } from '../../environments/environment';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/subscriptions`;

  const fakeSubscription: Subscription = {
    id: 1,
    userId: 1,
    name: 'Netflix',
    description: null,
    price: 150,
    currency: 0,
    billingCycle: BillingCycle.Monthly,
    startDate: null,
    nextRenewalDate: '2026-09-01',
    autoRenew: true,
    websiteUrl: null,
    notes: null,
    status: SubscriptionStatus.Active,
    isFavorite: false,
    icon: null,
    category: null,
    paymentMethod: null,
    tags: []
  } as unknown as Subscription;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubscriptionService]
    });
    service = TestBed.inject(SubscriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // بيتأكد إن مفيش Request اتبعت ومحدش استناها (Request مش متوقع = خطأ في التست نفسه)
    httpMock.verify();
  });

  it('getAllForUser بيبعت GET على /subscriptions/user/{id}', () => {
    service.getAllForUser(1).subscribe((subs) => {
      expect(subs).toEqual([fakeSubscription]);
    });

    const req = httpMock.expectOne(`${baseUrl}/user/1`);
    expect(req.request.method).toBe('GET');
    req.flush([fakeSubscription]);
  });

  it('getAllForUser بيضيف Query Params لما تبعت فلاتر', () => {
    service.getAllForUser(1, { search: 'netflix', onlyFavorites: true }).subscribe();

    const req = httpMock.expectOne(
      (r) => r.url === `${baseUrl}/user/1` && r.params.get('search') === 'netflix' && r.params.get('onlyFavorites') === 'true'
    );
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('create بيبعت POST بالـ DTO ويرجّع الاشتراك المتضاف', () => {
    service.create({ name: 'Spotify' } as any).subscribe((sub) => {
      expect(sub).toEqual(fakeSubscription);
    });

    const req = httpMock.expectOne(baseUrl);
    expect(req.request.method).toBe('POST');
    req.flush(fakeSubscription);
  });

  it('delete بيبعت DELETE على /subscriptions/{id}', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('duplicate بيبعت POST على /subscriptions/{id}/duplicate', () => {
    service.duplicate(1).subscribe((sub) => {
      expect(sub).toEqual(fakeSubscription);
    });

    const req = httpMock.expectOne(`${baseUrl}/1/duplicate`);
    expect(req.request.method).toBe('POST');
    req.flush(fakeSubscription);
  });

  it('toggleFavorite بيبعت PUT بعكس قيمة isFavorite الحالية', () => {
    service.toggleFavorite(fakeSubscription).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.isFavorite).toBe(true); // كانت false في fakeSubscription
    req.flush(null);
  });

  it('getMonthlyTotal بيبعت GET ويرجّع رقم', () => {
    service.getMonthlyTotal(1).subscribe((total) => {
      expect(total).toBe(450);
    });

    const req = httpMock.expectOne(`${baseUrl}/user/1/monthly-total`);
    expect(req.request.method).toBe('GET');
    req.flush(450);
  });
});
