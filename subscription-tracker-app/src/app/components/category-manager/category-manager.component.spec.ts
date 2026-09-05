import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CategoryManagerComponent } from './category-manager.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { ToastService } from '../../services/toast.service';
import { Category } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('CategoryManagerComponent', () => {
  let component: CategoryManagerComponent;
  let fixture: ComponentFixture<CategoryManagerComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/categories`;

  const fakeCategory: Category = { id: 1, name: 'ترفيه', color: '#35D0C6', icon: '🎬' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryManagerComponent, HttpClientTestingModule],
      providers: [provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryManagerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnChanges بيحمّل التصنيفات لما open تبقى true', () => {
    component.open = true;
    component.ngOnChanges();

    const req = httpMock.expectOne(baseUrl);
    req.flush([fakeCategory]);

    expect(component.categories).toEqual([fakeCategory]);
  });

  it('ngOnChanges مايعملش طلب لو open false', () => {
    component.open = false;
    component.ngOnChanges();

    expect(component.categories).toEqual([]);
    httpMock.expectNone(baseUrl);
  });

  it('save مايبعتش طلب لو الاسم فاضي', () => {
    component.formName = '   ';
    component.save();

    expect(component.categories).toEqual([]);
    httpMock.expectNone(baseUrl);
  });

  it('save بيضيف تصنيف جديد وبيبعت changed Event', () => {
    const changedSpy = spyOn(component.changed, 'emit');
    component.formName = 'اشتراكات جديدة';

    component.save();

    const createReq = httpMock.expectOne(baseUrl);
    expect(createReq.request.method).toBe('POST');
    createReq.flush(fakeCategory);

    // save() بيعمل reload بعد النجاح
    httpMock.expectOne(baseUrl).flush([fakeCategory]);

    expect(changedSpy).toHaveBeenCalled();
  });

  it('startEdit بيملأ الفورم ببيانات التصنيف', () => {
    component.startEdit(fakeCategory);
    expect(component.editingId).toBe(1);
    expect(component.formName).toBe('ترفيه');
  });

  it('save في وضع التعديل بيبعت PUT مش POST', () => {
    component.startEdit(fakeCategory);
    component.formName = 'اسم معدّل';

    component.save();

    const updateReq = httpMock.expectOne(`${baseUrl}/1`);
    expect(updateReq.request.method).toBe('PUT');
    updateReq.flush(null);
    httpMock.expectOne(baseUrl).flush([fakeCategory]);
  });

  it('delete مابيبعتش طلب لو المستخدم ألغى التأكيد', async () => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(false);

    await component.delete(fakeCategory);

    expect(component.categories).toEqual([]);
    httpMock.expectNone(`${baseUrl}/1`);
  });

  it('delete بيمسح التصنيف بعد التأكيد', fakeAsync(() => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(true);
    const toastSpy = spyOn(TestBed.inject(ToastService), 'show');

    component.delete(fakeCategory);
    tick();

    const deleteReq = httpMock.expectOne(`${baseUrl}/1`);
    expect(deleteReq.request.method).toBe('DELETE');
    deleteReq.flush(null);
    httpMock.expectOne(baseUrl).flush([]);
    tick(3000);

    expect(toastSpy).toHaveBeenCalledWith('categories.deleted');
  }));

  it('close بيبعت الـ closed Event', () => {
    const closedSpy = spyOn(component.closed, 'emit');
    component.close();
    expect(closedSpy).toHaveBeenCalled();
  });
});
