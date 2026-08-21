import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  const baseUrl = `${environment.apiUrl}/auth`;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RegisterComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [AuthService, provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
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

  it('onSubmit مايعملش حاجة لو الفورم Invalid (كلمة سر أقل من 6 حروف)', () => {
    component.form.setValue({ name: 'Test', email: 'test@example.com', password: '123' });
    component.onSubmit();

    expect(component.form.invalid).toBeTrue();
    httpMock.expectNone(`${baseUrl}/register`);
  });

  it('onSubmit بينجح بيودّي المستخدم للداشبورد', () => {
    component.form.setValue({ name: 'Test', email: 'test@example.com', password: 'Password123' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/register`);
    req.flush({
      userId: 1, name: 'Test', email: 'test@example.com', role: 0, emailConfirmed: true,
      token: 'fake-token', expiresAt: new Date(Date.now() + 3600000).toISOString()
    });

    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('onSubmit بيعرض رسالة إيميل مستخدم لو السيرفر رجّع 409', () => {
    component.form.setValue({ name: 'Test', email: 'taken@example.com', password: 'Password123' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/register`);
    req.flush({ message: 'taken' }, { status: 409, statusText: 'Conflict' });

    expect(component.errorMessage).toBeTruthy();
  });

  it('onSubmit بيعرض رسالة عامة لأي خطأ تاني', () => {
    component.form.setValue({ name: 'Test', email: 'test@example.com', password: 'Password123' });
    component.onSubmit();

    const req = httpMock.expectOne(`${baseUrl}/register`);
    req.flush({ message: 'server error' }, { status: 500, statusText: 'Server Error' });

    expect(component.errorMessage).toBeTruthy();
  });
});
