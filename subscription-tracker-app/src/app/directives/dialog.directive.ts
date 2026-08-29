import { Directive, EventEmitter, Input, Output, inject } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';

// بيحوّل أي `<div>` عادي لـ dialog حقيقي: بيقفل الـ Tab جوّاه، وبيقول لقارئ الشاشة
// إنه dialog، وبيقفل بـ Escape.
//
// ليه اتعملت: الستة modals اللي في المشروع كانوا `<div class="modal-overlay">` وبس —
// من غير role ولا aria-modal ولا حبس للتركيز. الاختبار قاس التلات مشاكل فعليًا:
//   • التركيز بيفضل على الزرار اللي فتح الـ modal، مش جوّاه
//   • بعد 15 ضغطة Tab التركيز بيهرب لعناصر الصفحة اللي ورا الـ overlay (زراير
//     الثيم واللغة وروابط التنقّل) — يعني اليوزر بيتنقّل في حاجة مش شايفها
//   • Escape مبيعملش حاجة
//
// وأهم نقطة: فحص axe بينجح على الصفحة دي وهي بالشكل ده. axe بيقرأ الـ markup،
// وغياب حبس التركيز سلوك مش markup — يعني دي نقطة عمياء في الفحص نفسه، والـ
// CDK هو الحل الجاهز والمتّجرب ليها بدل ما نكتب حبس تركيز بإيدينا ونسيبه يتكسر.
//
// الاستخدام: <div class="modal-content" appDialog="tag-manager-title" (dismissed)="close()">
//            ...
//            <h3 id="tag-manager-title">{{ 'tags.manage' | translate }}</h3>
@Directive({
  selector: '[appDialog]',
  standalone: true,
  hostDirectives: [CdkTrapFocus],
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    // بيخلّي الحاوية نفسها تقدر تستقبل التركيز، عشان لو الـ dialog مفيهوش أي عنصر
    // قابل للتركيز، الـ CDK يلاقي حاجة يحطّ عليها التركيز بدل ما يسيبه بره خالص
    tabindex: '-1',
    '[attr.aria-labelledby]': 'appDialog || null',
    '(keydown.escape)': 'onEscape($event)'
  }
})
export class DialogDirective {
  // بياخد `id` العنوان اللي جوّه الـ dialog، مش نص الاسم نفسه. النص لو اتكتب هنا
  // كان هيتكرّر مرتين — مرة في العنوان ومرة في الـ label — وأول ما حد يعدّل العنوان
  // يفضل قارئ الشاشة بينطق الاسم القديم. الربط بالـ id بيخلّي مصدر الاسم واحد،
  // وبيترجم مع العنوان تلقائيًا من غير مفتاح ترجمة زيادة.
  @Input() appDialog = '';

  @Output() dismissed = new EventEmitter<void>();

  constructor() {
    // بيخلّي الـ CDK ينقل التركيز جوّه الـ dialog أول ما يتفتح، ويرجّعه للعنصر اللي
    // كان متركّز قبل الفتح لما يتقفل. الـ hostDirectives بتتبني قبل الـ directive
    // دي، فالقيمة بتتظبط قبل ما `ngAfterContentInit` بتاعت الـ CDK تشتغل.
    inject(CdkTrapFocus).autoCapture = true;
  }

  onEscape(event: Event): void {
    // بيمنع الـ modal اللي تحته إنه يقفل هو كمان لو كان فيه modal فوق modal
    event.stopPropagation();
    this.dismissed.emit();
  }
}
