import { ValidatorFn, Validators } from '@angular/forms';

// نفس شروط الباك اند بالظبط (PasswordRules.cs) - 8 حروف على الأقل + حرف كبير + حرف صغير + رقم.
// مكان واحد بس عشان الفورمات التلاتة (تسجيل، إعادة تعيين، تغيير كلمة السر) تستخدم نفس الشرط
export function strongPasswordValidators(): ValidatorFn[] {
  return [
    Validators.required,
    Validators.minLength(8),
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  ];
}
