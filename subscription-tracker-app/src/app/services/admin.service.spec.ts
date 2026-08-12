import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { AdminUser, SystemStats } from '../models/admin.model';
import { UserRole } from '../models/subscription.model';
import { environment } from '../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/admin`;

  const fakeUser: AdminUser = {
    id: 1,
    name: 'Mostafa',
    email: 'mostafa@example.com',
    role: UserRole.User,
    createdAt: '2026-01-01T00:00:00Z',
    subscriptionsCount: 3,
    monthlySpend: 450
  };

  const fakeStats: SystemStats = {
    totalUsers: 10,
    totalActiveSubscriptions: 25,
    totalMonthlySpendAcrossAllUsers: 4500,
    newUsersLast30Days: 2
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('getAllUsers بيبعت GET على /admin/users', () => {
    service.getAllUsers().subscribe((users) => {
      expect(users).toEqual([fakeUser]);
    });

    const req = httpMock.expectOne(`${baseUrl}/users`);
    expect(req.request.method).toBe('GET');
    req.flush([fakeUser]);
  });

  it('getStats بيبعت GET على /admin/stats', () => {
    service.getStats().subscribe((stats) => {
      expect(stats).toEqual(fakeStats);
    });

    const req = httpMock.expectOne(`${baseUrl}/stats`);
    expect(req.request.method).toBe('GET');
    req.flush(fakeStats);
  });

  it('updateUserRole بيبعت PUT بالـ Role الجديد', () => {
    service.updateUserRole(1, { role: UserRole.Admin }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/users/1/role`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ role: UserRole.Admin });
    req.flush(null);
  });
});
