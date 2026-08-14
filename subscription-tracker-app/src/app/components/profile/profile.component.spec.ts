import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileComponent } from './profile.component';
import { ToastService } from '../../services/toast.service';
import { UserRole, Profile } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let httpMock: HttpTestingController;
  const usersBaseUrl = `${environment.apiUrl}/users`;

  const fakeProfile: Profile = {
    id: 1, name: 'Mostafa', email: 'mostafa@example.com', role: UserRole.User, createdAt: '2026-01-01'
  };

  beforeEach(async () => {
    localStorage.setItem('subscription_tracker_user', JSON.stringify({
      userId: 1, name: 'Mostafa', email: 'mostafa@example.com', role: UserRole.User,
      token: 'fake-token', expiresAt: new Date(Date.now() + 3600000).toISOString()
    }));
    localStorage.setItem('subscription_tracker_token', 'fake-token');

    await TestBed.configureTestingModule({
      imports: [ProfileComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpMock.expectOne(`${usersBaseUrl}/1`).flush(fakeProfile);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('بيتعمله Create بنجاح، وبيحمّل البروفايل ويملأ فورم الاسم بيه', () => {
    expect(component).toBeTruthy();
    expect(component.profile).toEqual(fakeProfile);
    expect(component.nameForm.value.name).toBe('Mostafa');
  });

  it('saveName مايبعتش طلب لو الفورم Invalid', () => {
    component.nameForm.setValue({ name: '' });
    component.saveName();

    expect(component.nameForm.invalid).toBeTrue();
    httpMock.expectNone(`${usersBaseUrl}/1`);
  });

  it('saveName بيحدّث البروفايل وبيعرض Toast نجاح', () => {
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');
    component.nameForm.setValue({ name: 'اسم جديد' });

    component.saveName();

    const req = httpMock.expectOne(`${usersBaseUrl}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...fakeProfile, name: 'اسم جديد' });

    expect(component.profile?.name).toBe('اسم جديد');
    expect(toastSpy).toHaveBeenCalledWith('profile.nameSaved');
  });

  it('changePassword مايبعتش طلب لو الفورم Invalid', () => {
    component.passwordForm.setValue({ currentPassword: '', newPassword: '123' });
    component.changePassword();

    expect(component.passwordForm.invalid).toBeTrue();
    httpMock.expectNone(`${usersBaseUrl}/1/password`);
  });

  it('changePassword بينجح، بيصفّر الفورم وبيعرض Toast نجاح', () => {
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');
    component.passwordForm.setValue({ currentPassword: 'OldPass123', newPassword: 'NewPass456' });

    component.changePassword();

    const req = httpMock.expectOne(`${usersBaseUrl}/1/password`);
    req.flush(null);

    expect(component.passwordForm.value.currentPassword).toBeFalsy();
    expect(toastSpy).toHaveBeenCalledWith('profile.passwordChanged');
  });

  it('changePassword بيعرض رسالة كلمة سر غلط لو السيرفر رجّع 400', () => {
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');
    component.passwordForm.setValue({ currentPassword: 'WrongPass', newPassword: 'NewPass456' });

    component.changePassword();

    const req = httpMock.expectOne(`${usersBaseUrl}/1/password`);
    req.flush({ message: 'wrong' }, { status: 400, statusText: 'Bad Request' });

    expect(toastSpy).toHaveBeenCalledWith('profile.currentPasswordWrong', 'error');
  });
});
