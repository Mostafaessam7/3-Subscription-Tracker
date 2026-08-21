import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminComponent } from './admin.component';
import { AdminUser, SystemStats } from '../../models/admin.model';
import { UserRole } from '../../models/subscription.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../environments/environment';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;
  let httpMock: HttpTestingController;
  const adminBaseUrl = `${environment.apiUrl}/admin`;

  const fakeStats: SystemStats = {
    totalUsers: 5,
    totalActiveSubscriptions: 12,
    totalMonthlySpendAcrossAllUsers: 1200,
    newUsersLast30Days: 2
  };

  const fakeUsers: AdminUser[] = [
    { id: 1, name: 'Admin', email: 'admin@example.com', role: UserRole.Admin, createdAt: '2026-01-01', subscriptionsCount: 0, monthlySpend: 0 },
    { id: 2, name: 'User', email: 'user@example.com', role: UserRole.User, createdAt: '2026-01-02', subscriptionsCount: 3, monthlySpend: 300 }
  ];

  beforeEach(async () => {
    localStorage.setItem('subscription_tracker_user', JSON.stringify({
      userId: 1, name: 'Admin', email: 'admin@example.com', role: UserRole.Admin, emailConfirmed: true,
      token: 'fake-token', expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));
    localStorage.setItem('subscription_tracker_token', 'fake-token');

    await TestBed.configureTestingModule({
      imports: [AdminComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(`${adminBaseUrl}/stats`).flush(fakeStats);
    httpMock.expectOne(`${adminBaseUrl}/users`).flush(fakeUsers);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('بيتعمله Create بنجاح، وبيحمّل الإحصائيات والمستخدمين عند البدء', () => {
    expect(component).toBeTruthy();
    expect(component.stats).toEqual(fakeStats);
    expect(component.users.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('toggleRole مايبعتش أي طلب لو المستخدم ألغى التأكيد', async () => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(false);

    await component.toggleRole(fakeUsers[1]);

    expect(fakeUsers[1].role).toBe(UserRole.User);
    httpMock.expectNone(`${adminBaseUrl}/users/2/role`);
  });

  it('toggleRole بيرقّي المستخدم لـ Admin بعد التأكيد', fakeAsync(() => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(true);
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');

    const user = { ...fakeUsers[1] };
    component.toggleRole(user);
    tick();

    const req = httpMock.expectOne(`${adminBaseUrl}/users/2/role`);
    expect(req.request.body).toEqual({ role: UserRole.Admin });
    req.flush(null);
    tick(3000);

    expect(user.role).toBe(UserRole.Admin);
    expect(toastSpy).toHaveBeenCalledWith('admin.roleUpdated');
  }));

  it('toggleRole بيعرض Toast خطأ لو الطلب فشل', fakeAsync(() => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(true);
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');

    const user = { ...fakeUsers[1] };
    component.toggleRole(user);
    tick();

    const req = httpMock.expectOne(`${adminBaseUrl}/users/2/role`);
    req.flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });
    tick(3000);

    expect(toastSpy).toHaveBeenCalledWith('admin.roleUpdateError', 'error');
  }));
});
