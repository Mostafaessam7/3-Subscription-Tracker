import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, Router, convertToParamMap } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ResetPasswordComponent } from './reset-password.component';
import { environment } from '../../../environments/environment';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  const baseUrl = `${environment.apiUrl}/auth`;

  function setup(token: string | null): void {
    TestBed.configureTestingModule({
      imports: [ResetPasswordComponent, HttpClientTestingModule],
      providers: [provideTranslateService(), 
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح ولو فيه token يبقى hasToken true', () => {
    setup('valid-token');
    expect(component).toBeTruthy();
    expect(component.hasToken).toBeTrue();
    expect(component.errorMessage).toBe('');
  });

  it('لو مفيش token في الرابط، hasToken بتبقى false وبيتعرض خطأ فورًا', () => {
    setup(null);
    expect(component.hasToken).toBeFalse();
    expect(component.errorMessage).toBeTruthy();
  });

  it('الفورم بيبقى Invalid لو كلمتا السر مش متطابقتين', () => {
    setup('valid-token');
    component.form.setValue({ newPassword: 'Password123', confirmPassword: 'Different456' });
    expect(component.form.invalid).toBeTrue();
    expect(component.form.errors?.['passwordMismatch']).toBeTrue();
  });

  it('onSubmit مايعملش حاجة لو مفيش token حتى لو الفورم صالح', () => {
    setup(null);
    component.form.setValue({ newPassword: 'Password123', confirmPassword: 'Password123' });
    component.onSubmit();

    expect(component.hasToken).toBeFalse();
    httpMock.expectNone(`${baseUrl}/reset-password`);
  });

  it('onSubmit بيبعت الطلب بالتوكن وكلمة السر، وبعد النجاح بيوجّه لصفحة /login', fakeAsync(() => {
    setup('valid-token');
    component.form.setValue({ newPassword: 'Password123', confirmPassword: 'Password123' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/reset-password`);
    expect(req.request.body).toEqual({ token: 'valid-token', newPassword: 'Password123' });
    req.flush({ message: 'ok' });

    expect(component.successMessage).toBeTruthy();

    tick(2000);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  }));

  it('onSubmit بيعرض رسالة توكن غلط/منتهي لو السيرفر رجّع 400', () => {
    setup('expired-token');
    component.form.setValue({ newPassword: 'Password123', confirmPassword: 'Password123' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/reset-password`);
    req.flush({ message: 'bad token' }, { status: 400, statusText: 'Bad Request' });

    expect(component.errorMessage).toBeTruthy();
    expect(component.successMessage).toBe('');
  });
});
