import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogService: ConfirmDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [provideTranslateService()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    dialogService = TestBed.inject(ConfirmDialogService);
    fixture.detectChanges();
  });

  it('مايظهرش أي حوار لو مفيش state حالي', () => {
    expect(fixture.nativeElement.querySelector('.modal-overlay')).toBeNull();
  });

  it('بيظهر الرسالة لما الـ Service يبقى فيه state', () => {
    dialogService.confirm('متأكد إنك عايز تمسح؟');
    fixture.detectChanges();

    const message = fixture.nativeElement.querySelector('.message');
    expect(message.textContent).toContain('متأكد إنك عايز تمسح؟');
  });

  it('زرار التأكيد بيحل الـ Promise بـ true ويقفل الحوار', async () => {
    const confirmPromise = dialogService.confirm('متأكد؟');
    fixture.detectChanges();

    const confirmBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-danger');
    confirmBtn.click();
    fixture.detectChanges();

    await expectAsync(confirmPromise).toBeResolvedTo(true);
    expect(dialogService.state()).toBeNull();
  });

  it('زرار الإلغاء بيحل الـ Promise بـ false', async () => {
    const confirmPromise = dialogService.confirm('متأكد؟');
    fixture.detectChanges();

    const cancelBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-secondary');
    cancelBtn.click();
    fixture.detectChanges();

    await expectAsync(confirmPromise).toBeResolvedTo(false);
  });

  it('الضغط على الخلفية (Overlay) بيتصرف زي الإلغاء', async () => {
    const confirmPromise = dialogService.confirm('متأكد؟');
    fixture.detectChanges();

    const overlay: HTMLElement = fixture.nativeElement.querySelector('.modal-overlay');
    overlay.click();
    fixture.detectChanges();

    await expectAsync(confirmPromise).toBeResolvedTo(false);
  });
});
