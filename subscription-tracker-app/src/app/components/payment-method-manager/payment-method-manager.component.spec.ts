import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PaymentMethodManagerComponent } from './payment-method-manager.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { PaymentMethod, PaymentMethodType } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('PaymentMethodManagerComponent', () => {
  let component: PaymentMethodManagerComponent;
  let fixture: ComponentFixture<PaymentMethodManagerComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/paymentmethods`;

  const fakeMethod: PaymentMethod = { id: 1, name: 'فيزا', type: PaymentMethodType.Card };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentMethodManagerComponent, HttpClientTestingModule],
      providers: [provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentMethodManagerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnChanges بيحمّل وسائل الدفع لما open تبقى true', () => {
    component.open = true;
    component.ngOnChanges();

    httpMock.expectOne(baseUrl).flush([fakeMethod]);
    expect(component.methods).toEqual([fakeMethod]);
  });

  it('typeKey بيرجّع مفتاح الترجمة الصح لكل نوع', () => {
    expect(component.typeKey(PaymentMethodType.Card)).toBe('paymentMethods.card');
    expect(component.typeKey(PaymentMethodType.Cash)).toBe('paymentMethods.cash');
  });

  it('save مايبعتش طلب لو الاسم فاضي', () => {
    component.formName = '';
    component.save();

    expect(component.methods).toEqual([]);
    httpMock.expectNone(baseUrl);
  });

  it('save بيضيف وسيلة دفع جديدة', () => {
    const changedSpy = spyOn(component.changed, 'emit');
    component.formName = 'فيزا';

    component.save();

    httpMock.expectOne(baseUrl).flush(fakeMethod);
    httpMock.expectOne(baseUrl).flush([fakeMethod]);

    expect(changedSpy).toHaveBeenCalled();
  });

  it('startEdit بيملأ الفورم ببيانات وسيلة الدفع', () => {
    component.startEdit(fakeMethod);
    expect(component.editingId).toBe(1);
    expect(component.formName).toBe('فيزا');
    expect(component.formType).toBe(PaymentMethodType.Card);
  });

  it('delete بيمسح وسيلة الدفع بعد التأكيد', fakeAsync(() => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(true);

    component.delete(fakeMethod);
    tick();

    httpMock.expectOne(`${baseUrl}/1`).flush(null);
    httpMock.expectOne(baseUrl).flush([]);
    tick(3000);

    expect(component.methods).toEqual([]);
  }));
});
