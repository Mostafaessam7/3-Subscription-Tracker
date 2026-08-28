import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * التوكن بقى في كوكي HttpOnly، فمفيش Authorization Header بيتحط هنا تاني — المتصفح هو اللي
 * بيبعت الكوكي، وده اللي `withCredentials` بيفعّله.
 *
 * ولأن المتصفح بيبعت الكوكي تلقائيًا مع أي طلب للدومين (حتى لو الطلب اتبعت من صفحة مهاجم)،
 * لازم نبعت توكن الـ CSRF في Header مع الطلبات اللي بتغيّر حالة. ده الجزء اللي بيمنع إن نقل
 * التوكن للكوكي يتحوّل من ثغرة XSS لثغرة CSRF.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const isStateChanging = STATE_CHANGING_METHODS.includes(req.method.toUpperCase());
  const csrfToken = isStateChanging ? authService.getCsrfToken() : null;

  const cloned = req.clone({
    // مطلوب عشان المتصفح يبعت ويقبل الكوكي - من غيرها الكوكي بتتجاهل في صمت والطلبات كلها
    // بترجع 401 من غير سبب واضح.
    withCredentials: true,
    ...(csrfToken ? { setHeaders: { 'X-XSRF-TOKEN': csrfToken } } : {})
  });

  return next(cloned);
};
