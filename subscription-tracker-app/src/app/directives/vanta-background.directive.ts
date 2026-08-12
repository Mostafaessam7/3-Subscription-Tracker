import { Directive, ElementRef, Input, OnDestroy, AfterViewInit, OnChanges, inject, effect } from '@angular/core';
import { ThemeService } from '../services/theme.service';

// Vanta.js و Three.js متحمّلين عن طريق <script> في index.html (مش npm package)
declare const VANTA: any;

export type VantaEffectType = 'net' | 'fog' | '';

// ألوان الهوية لكل ثيم - عشان الخلفية المتحركة تتماشى مع Dark/Light Toggle بدل ما تفضل كحلي دايمًا
const THEME_COLORS = {
  dark: {
    bg: 0x0b1120,
    bgElevated: 0x0f1729,
    amber: 0xf5b841,
    cyan: 0x35d0c6
  },
  light: {
    bg: 0xf4f6fb,
    bgElevated: 0xffffff,
    amber: 0xb8790a,
    cyan: 0x0e8f86
  }
};

// استخدامها: <div vantaBackground="net"> أو <div vantaBackground="fog">
@Directive({
  selector: '[vantaBackground]',
  standalone: true
})
export class VantaBackgroundDirective implements AfterViewInit, OnDestroy, OnChanges {
  private el = inject(ElementRef<HTMLElement>);
  private themeService = inject(ThemeService);
  private vantaEffect: any;
  private viewInitialized = false;

  // النوع الافتراضي net لو محددتش حاجة (أو لو الخاصية استُخدمت من غير قيمة أصلاً)
  @Input('vantaBackground') effectType: VantaEffectType = 'net';

  constructor() {
    // بيراقب تغيير الثيم، ولو اتغيّر بيعمل destroy للتأثير القديم ويبنيه تاني بألوان الثيم الجديد
    effect(() => {
      this.themeService.currentTheme();
      if (this.viewInitialized) {
        this.rebuildEffect();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    this.rebuildEffect();
  }

  ngOnChanges(): void {
    if (this.viewInitialized) {
      this.rebuildEffect();
    }
  }

  private rebuildEffect(): void {
    if (typeof VANTA === 'undefined') {
      console.warn('Vanta.js لسه متحملتش، الخلفية المتحركة مش هتشتغل');
      return;
    }

    if (this.vantaEffect) {
      this.vantaEffect.destroy();
      this.vantaEffect = null;
    }

    const colors = this.themeService.currentTheme() === 'light' ? THEME_COLORS.light : THEME_COLORS.dark;

    if (this.effectType === 'fog') {
      this.vantaEffect = VANTA.FOG({
        el: this.el.nativeElement,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        highlightColor: colors.amber,
        midtoneColor: colors.cyan,
        lowlightColor: colors.bg,
        baseColor: colors.bgElevated,
        blurFactor: 0.6,
        speed: 1.2,
        zoom: 0.8
      });
    } else {
      this.vantaEffect = VANTA.NET({
        el: this.el.nativeElement,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: colors.cyan,
        backgroundColor: colors.bg,
        points: 8.00,
        maxDistance: 22.00,
        spacing: 18.00
      });
    }
  }

  ngOnDestroy(): void {
    // مهم جدًا - Vanta بيشغّل WebGL loop مستمر، لازم يتعمله destroy لما الكومبوننت يتشال
    if (this.vantaEffect) {
      this.vantaEffect.destroy();
    }
  }
}
