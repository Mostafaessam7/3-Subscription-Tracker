import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { TagManagerComponent } from './tag-manager.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { Tag } from '../../models/subscription.model';
import { environment } from '../../../environments/environment';

describe('TagManagerComponent', () => {
  let component: TagManagerComponent;
  let fixture: ComponentFixture<TagManagerComponent>;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/tags`;

  const fakeTag: Tag = { id: 1, name: 'شغل', color: '#818CF8' };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagManagerComponent, HttpClientTestingModule, TranslateModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TagManagerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('بيتعمله Create بنجاح', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('ngOnChanges بيحمّل التاجز لما open تبقى true', () => {
    component.open = true;
    component.ngOnChanges();

    httpMock.expectOne(baseUrl).flush([fakeTag]);
    expect(component.tags).toEqual([fakeTag]);
  });

  it('save مايبعتش طلب لو الاسم فاضي', () => {
    component.formName = '';
    component.save();

    expect(component.tags).toEqual([]);
    httpMock.expectNone(baseUrl);
  });

  it('save بيضيف تاج جديد', () => {
    const changedSpy = spyOn(component.changed, 'emit');
    component.formName = 'شغل';

    component.save();

    httpMock.expectOne(baseUrl).flush(fakeTag);
    httpMock.expectOne(baseUrl).flush([fakeTag]);

    expect(changedSpy).toHaveBeenCalled();
  });

  it('delete بيمسح التاج بعد التأكيد', fakeAsync(() => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(true);

    component.delete(fakeTag);
    tick();

    httpMock.expectOne(`${baseUrl}/1`).flush(null);
    httpMock.expectOne(baseUrl).flush([]);
    tick(3000);

    expect(component.tags).toEqual([]);
  }));

  it('delete مابيعملش حاجة لو المستخدم ألغى', async () => {
    spyOn(TestBed.inject(ConfirmDialogService), 'confirm').and.resolveTo(false);
    await component.delete(fakeTag);

    expect(component.tags).toEqual([]);
    httpMock.expectNone(`${baseUrl}/1`);
  });
});
