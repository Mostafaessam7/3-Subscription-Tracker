import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { defaultCategoryNameKey } from '../utils/categories.const';

// بيترجم اسم تصنيف لو كان واحد من الستة الافتراضيين، وبيسيب أي تصنيف مخصّص زي ما هو.
// impure (pure: false) عشان يعيد الحساب لما اللغة تتغيّر - مش بس لما الاسم نفسه يتغيّر،
// لأن TranslateService.instant() بيرجع نتيجة مختلفة حسب اللغة الحالية من غير ما الـ Input يتغيّر
@Pipe({
  name: 'categoryName',
  standalone: true,
  pure: false
})
export class CategoryNamePipe implements PipeTransform {
  private translate = inject(TranslateService);

  transform(name: string | null | undefined): string {
    if (!name) return '';
    const key = defaultCategoryNameKey(name);
    return key ? this.translate.instant(key) : name;
  }
}
