import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/subscription.model';

describe('adminGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  function runGuard(): boolean {
    return TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any)) as boolean;
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'currentUser']);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }]
    });

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  it('بيودّي لصفحة /login لو المستخدم مش عامل تسجيل دخول خالص', () => {
    authServiceSpy.isLoggedIn.and.returnValue(false);

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('بيودّي للصفحة الرئيسية لو المستخدم مسجّل دخول بس مش Admin', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.currentUser.and.returnValue({
      userId: 1,
      name: 'Test',
      email: 'test@example.com',
      role: UserRole.User,
      token: 't',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    const result = runGuard();

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('بيسمح بالدخول لو المستخدم Admin فعلًا', () => {
    authServiceSpy.isLoggedIn.and.returnValue(true);
    authServiceSpy.currentUser.and.returnValue({
      userId: 1,
      name: 'Admin',
      email: 'admin@example.com',
      role: UserRole.Admin,
      token: 't',
      expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    const result = runGuard();

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
