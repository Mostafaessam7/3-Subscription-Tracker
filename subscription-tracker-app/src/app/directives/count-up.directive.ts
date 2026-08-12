import { Directive, ElementRef, Input, OnChanges, inject } from '@angular/core';

// Directive بسيطة بتخلي أي رقم "يعدّ" من صفر (أو من قيمته القديمة) للقيمة الجديدة
// استخدامها: <p [countUp]="monthlyTotal"></p>
@Directive({
  selector: '[countUp]',
  standalone: true
})
export class CountUpDirective implements OnChanges {
  private el = inject(ElementRef<HTMLElement>);
  private currentValue = 0;

  @Input('countUp') targetValue = 0;
  @Input() countUpDuration = 600;

  ngOnChanges(): void {
    const startValue = this.currentValue;
    const endValue = this.targetValue;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - startTime) / this.countUpDuration, 1);
      // Ease-out بسيط عشان الحركة تبطّئ في الآخر بدل ما توقف فجأة
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = startValue + (endValue - startValue) * eased;

      this.el.nativeElement.textContent = Math.round(value).toLocaleString('ar-EG');

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        this.currentValue = endValue;
      }
    };

    requestAnimationFrame(step);
  }
}
