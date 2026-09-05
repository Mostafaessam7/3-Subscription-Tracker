import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { CategoryNamePipe } from './category-name.pipe';

describe('CategoryNamePipe', () => {
  let pipe: CategoryNamePipe;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService()]
    });

    translate = TestBed.inject(TranslateService);
    pipe = TestBed.runInInjectionContext(() => new CategoryNamePipe());
  });

  it('بيترجم اسم تصنيف افتراضي (زي "ترفيه") لمفتاح الترجمة بتاعه', () => {
    spyOn(translate, 'instant').and.callFake((key: string) => `[${key}]`);

    expect(pipe.transform('ترفيه')).toBe('[categories.defaults.entertainment]');
    expect(translate.instant).toHaveBeenCalledWith('categories.defaults.entertainment');
  });

  it('بيسيب اسم تصنيف مخصّص (مش من الستة الافتراضيين) زي ما هو', () => {
    const translateSpy = spyOn(translate, 'instant');

    expect(pipe.transform('تصنيف من عندي')).toBe('تصنيف من عندي');
    expect(translateSpy).not.toHaveBeenCalled();
  });

  it('بيرجع سلسلة فاضية لو الاسم null أو undefined أو فاضي', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  it('كل التصنيفات الستة الافتراضية بترجع مفتاح ترجمة صحيح', () => {
    spyOn(translate, 'instant').and.callFake((key: string) => key);

    expect(pipe.transform('ترفيه')).toBe('categories.defaults.entertainment');
    expect(pipe.transform('رياضة وصحة')).toBe('categories.defaults.healthFitness');
    expect(pipe.transform('عمل وإنتاجية')).toBe('categories.defaults.workProductivity');
    expect(pipe.transform('تعليم')).toBe('categories.defaults.education');
    expect(pipe.transform('خدمات سحابية')).toBe('categories.defaults.cloudServices');
    expect(pipe.transform('أخرى')).toBe('categories.defaults.other');
  });
});
