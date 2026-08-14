import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { throwError } from 'rxjs';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/auth`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [AuthService, provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح', () => {
    expect(component).toBeTruthy();
  });

  it('الفورم بيبقى Invalid لو الإيميل فاضي أو غلط', () => {
    component.form.setValue({ email: '' });
    expect(component.form.invalid).toBeTrue();

    component.form.setValue({ email: 'not-an-email' });
    expect(component.form.invalid).toBeTrue();
  });

  it('onSubmit مايعملش حاجة لو الفورم Invalid', () => {
    component.form.setValue({ email: '' });
    component.onSubmit();

    expect(component.form.invalid).toBeTrue();
    httpMock.expectNone(`${baseUrl}/forgot-password`);
  });

  it('onSubmit بيبعت الطلب وبيعرض رسالة نجاح دايمًا (حتى لو الإيميل مش مسجل)', () => {
    component.form.setValue({ email: 'unknown@example.com' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/forgot-password`);
    expect(req.request.body).toEqual({ email: 'unknown@example.com' });
    req.flush({ message: 'ok' });

    expect(component.successMessage).toBeTruthy();
    expect(component.errorMessage).toBe('');
  });

  it('onSubmit بيعرض رسالة خطأ عامة لو السيرفر رجّع خطأ غير متوقع', () => {
    spyOn(TestBed.inject(AuthService), 'forgotPassword')
      .and.returnValue(throwError(() => ({ status: 500 })));

    component.form.setValue({ email: 'test@example.com' });
    component.onSubmit();

    expect(component.errorMessage).toBeTruthy();
    expect(component.successMessage).toBe('');
  });
});
