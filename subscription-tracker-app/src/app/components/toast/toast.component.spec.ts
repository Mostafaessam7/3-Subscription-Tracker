import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ToastComponent } from './toast.component';
import { ToastService } from '../../services/toast.service';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [provideTranslateService()]
    });
    fixture = TestBed.createComponent(ToastComponent);
    toastService = TestBed.inject(ToastService);
  });

  it('بيتعمل له Create من غير مشاكل', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('مبيعرضش أي Toast لو مفيش حاجة في الـ Service', () => {
    fixture.detectChanges();

    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(0);
  });

  it('بيعرض Toast لما يتضاف في الـ Service', () => {
    toastService.show('toast.added');
    fixture.detectChanges();

    const toasts = fixture.nativeElement.querySelectorAll('.toast');
    expect(toasts.length).toBe(1);
  });

  it('بيضيف كلاس toast-error للـ Toasts من نوع error بس', () => {
    toastService.show('toast.ok', 'success');
    toastService.show('toast.fail', 'error');
    fixture.detectChanges();

    const errorToasts = fixture.nativeElement.querySelectorAll('.toast-error');
    expect(errorToasts.length).toBe(1);
  });
});
