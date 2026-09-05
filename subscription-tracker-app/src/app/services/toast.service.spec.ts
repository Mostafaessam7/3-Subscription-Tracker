import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), ToastService]
    });
    service = TestBed.inject(ToastService);
  });

  it('show() بيضيف Toast جديد بنوع success افتراضي', () => {
    service.show('toast.added');

    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].type).toBe('success');
  });

  it('show() بيقبل نوع error صراحة', () => {
    service.show('toast.error', 'error');

    expect(service.toasts()[0].type).toBe('error');
  });

  it('كل Toast بياخد id فريد مختلف عن اللي قبله', () => {
    service.show('toast.a');
    service.show('toast.b');

    const [first, second] = service.toasts();
    expect(first.id).not.toBe(second.id);
  });

  it('dismiss() بيشيل الـ Toast المطلوب بس', () => {
    service.show('toast.a');
    service.show('toast.b');
    const idToRemove = service.toasts()[0].id;

    service.dismiss(idToRemove);

    expect(service.toasts().length).toBe(1);
    expect(service.toasts().find((t) => t.id === idToRemove)).toBeUndefined();
  });

  it('الـ Toast بيتشال تلقائيًا بعد 3 ثواني', () => {
    jasmine.clock().install();
    try {
      service.show('toast.auto-dismiss');
      expect(service.toasts().length).toBe(1);

      jasmine.clock().tick(3001);

      expect(service.toasts().length).toBe(0);
    } finally {
      jasmine.clock().uninstall();
    }
  });
});
