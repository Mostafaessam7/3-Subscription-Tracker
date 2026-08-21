import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { AuthResponse } from '../models/auth.model';
import { UserRole } from '../models/subscription.model';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;
  const baseUrl = `${environment.apiUrl}/auth`;

  const fakeResponse: AuthResponse = {
    userId: 1,
    name: 'Mostafa',
    email: 'mostafa@example.com',
    role: UserRole.User,
    emailConfirmed: true,
    token: 'fake-jwt-token',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // بعد ساعة من دلوقتي
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService, provideRouter([])]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('register بيبعت POST وبيخزّن الـ Token والـ User في localStorage', () => {
    service.register({ name: 'Mostafa', email: 'mostafa@example.com', password: '123456' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/register`);
    expect(req.request.method).toBe('POST');
    req.flush(fakeResponse);

    expect(localStorage.getItem('subscription_tracker_token')).toBe('fake-jwt-token');
    expect(service.currentUser()?.email).toBe('mostafa@example.com');
  });

  it('login بيبعت POST وبيحدّث currentUser signal', () => {
    service.login({ email: 'mostafa@example.com', password: '123456' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    req.flush(fakeResponse);

    expect(service.currentUser()).toEqual(fakeResponse);
  });

  it('logout بيمسح localStorage وبيصفّر currentUser وبيودّي لصفحة /login', () => {
    service.login({ email: 'mostafa@example.com', password: '123456' }).subscribe();
    httpMock.expectOne(`${baseUrl}/login`).flush(fakeResponse);

    service.logout();

    expect(localStorage.getItem('subscription_tracker_token')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('isLoggedIn بيرجّع false لو مفيش Token خالص', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isLoggedIn بيرجّع true بعد تسجيل دخول ناجح والتوكن لسه صالح', () => {
    service.login({ email: 'mostafa@example.com', password: '123456' }).subscribe();
    httpMock.expectOne(`${baseUrl}/login`).flush(fakeResponse);

    expect(service.isLoggedIn()).toBeTrue();
  });

  it('isLoggedIn بيعمل logout تلقائي ويرجّع false لو التوكن منتهي', () => {
    const expiredResponse: AuthResponse = {
      ...fakeResponse,
      expiresAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() // من ساعة فاتت
    };
    service.login({ email: 'mostafa@example.com', password: '123456' }).subscribe();
    httpMock.expectOne(`${baseUrl}/login`).flush(expiredResponse);

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('subscription_tracker_token')).toBeNull();
  });

  it('forgotPassword بيبعت POST بالإيميل لـ /forgot-password', () => {
    service.forgotPassword({ email: 'mostafa@example.com' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'mostafa@example.com' });
    req.flush({ message: 'ok' });
  });

  it('resetPassword بيبعت POST بالتوكن وكلمة السر الجديدة لـ /reset-password', () => {
    service.resetPassword({ token: 'abc123', newPassword: 'NewPass456' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/reset-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'abc123', newPassword: 'NewPass456' });
    req.flush({ message: 'ok' });
  });

  it('confirmEmail بيبعت POST بالتوكن لـ /confirm-email', () => {
    service.confirmEmail({ token: 'abc123' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/confirm-email`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ token: 'abc123' });
    req.flush({ message: 'ok' });
  });

  it('resendConfirmation بيبعت POST بالإيميل لـ /resend-confirmation', () => {
    service.resendConfirmation({ email: 'mostafa@example.com' }).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/resend-confirmation`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'mostafa@example.com' });
    req.flush({ message: 'ok' });
  });
});
