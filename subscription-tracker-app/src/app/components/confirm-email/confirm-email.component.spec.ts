import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter, convertToParamMap } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConfirmEmailComponent } from './confirm-email.component';
import { environment } from '../../../environments/environment';

describe('ConfirmEmailComponent', () => {
  let component: ConfirmEmailComponent;
  let fixture: ComponentFixture<ConfirmEmailComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/auth`;

  function setup(token: string | null): void {
    TestBed.configureTestingModule({
      imports: [ConfirmEmailComponent, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) }
          }
        }
      ]
    });

    fixture = TestBed.createComponent(ConfirmEmailComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  afterEach(() => httpMock.verify());

  it('لو مفيش token، الحالة بتبقى missingToken من غير أي طلب', () => {
    setup(null);

    expect(component.state).toBe('missingToken');
    expect(component.message).toBeTruthy();
    httpMock.expectNone(`${baseUrl}/confirm-email`);
  });

  it('لو فيه token، بيبعت الطلب أوتوماتيك وبعد النجاح الحالة بتبقى success', () => {
    setup('valid-token');

    const req = httpMock.expectOne(`${baseUrl}/confirm-email`);
    expect(req.request.body).toEqual({ token: 'valid-token' });
    req.flush({ message: 'ok' });

    expect(component.state).toBe('success');
    expect(component.message).toBeTruthy();
  });

  it('لو التوكن غلط/منتهي، الحالة بتبقى error', () => {
    setup('expired-token');

    const req = httpMock.expectOne(`${baseUrl}/confirm-email`);
    req.flush({ message: 'bad token' }, { status: 400, statusText: 'Bad Request' });

    expect(component.state).toBe('error');
    expect(component.message).toBeTruthy();
  });
});
