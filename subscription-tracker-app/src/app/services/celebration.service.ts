import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root'
})
export class CelebrationService {
  // بتتفعّل في لحظات نجاح فعلية بس (إضافة اشتراك، تسجيل دخول أول مرة...)
  // مش في كل حاجة عشان متبقاش مزعجة - لمسة بسيطة مش عرض ألعاب نارية
  celebrate(): void {
    confetti({
      particleCount: 60,
      spread: 65,
      origin: { y: 0.7 },
      colors: ['#F5B841', '#35D0C6', '#EAF0FF'],
      disableForReducedMotion: true
    });
  }
}
