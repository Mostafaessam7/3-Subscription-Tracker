import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  const baseUrl = `${environment.apiUrl}/auth`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [AuthService, provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('بيتعمله Create بنجاح', () => {
    expect(component).toBeTruthy();
  });

  it('onSubmit مايعملش حاجة لو الفورم Invalid', () => {
    component.form.setValue({ email: '', password: '' });
    component.onSubmit();

    expect(component.form.invalid).toBeTrue();
    httpMock.expectNone(`${baseUrl}/login`);
  });

  it('onSubmit بينجح بيودّي المستخدم للداشبورد', () => {
    component.form.setValue({ email: 'test@example.com', password: 'Password123' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    req.flush({
      userId: 1, name: 'Test', email: 'test@example.com', role: 0,
      token: 'fake-token', expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('onSubmit بيعرض رسالة خطأ لو الدخول فشل', () => {
    component.form.setValue({ email: 'test@example.com', password: 'WrongPassword' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/login`);
    req.flush({ message: 'wrong' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.errorMessage).toBeTruthy();
  });
});
