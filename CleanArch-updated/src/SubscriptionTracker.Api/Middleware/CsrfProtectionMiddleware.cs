using SubscriptionTracker.Api.Auth;

namespace SubscriptionTracker.Api.Middleware
{
    /// <summary>
    /// بيفرض فحص double-submit على الطلبات اللي بتغيّر حالة **لما** التوكن جاي من كوكي.
    ///
    /// ليه ده لازم يتشحن مع نقل التوكن للكوكي في نفس التغيير: الـ Bearer Header لازم سكريبت
    /// يحطه بشكل صريح، فموقع تاني مش هيقدر يزوّره. الكوكي عكس كده تمامًا — المتصفح بيبعتها
    /// تلقائيًا مع أي طلب للدومين، حتى لو الطلب اتبعت من صفحة مهاجم. من غير الفحص ده كنا هنبدّل
    /// ثغرة XSS بثغرة CSRF، مش نقفل حاجة.
    ///
    /// بيتطبّق على POST/PUT/PATCH/DELETE بس: طلبات القراءة مش بتغيّر حاجة، وإلزامها بالـ Header
    /// كان هيكسر أول فتح للصفحة قبل ما الفرونت اند يقرا الكوكي أصلاً.
    ///
    /// الطلبات اللي بتستخدم Authorization Header بتعدّي من غير فحص — مفيش حاجة تتزوّر نيابة عنها.
    /// </summary>
    public class CsrfProtectionMiddleware
    {
        private static readonly string[] StateChangingMethods =
            ["POST", "PUT", "PATCH", "DELETE"];

        private readonly RequestDelegate _next;

        public CsrfProtectionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var request = context.Request;

            var isStateChanging = StateChangingMethods.Contains(
                request.Method,
                StringComparer.OrdinalIgnoreCase);

            // بيتفحص بس لما الطلب فعلاً حامل كوكي التوكن. طلب بـ Authorization Header (أو طلب
            // مجهول زي تسجيل الدخول نفسه) مش محتاج الفحص ده.
            var carriesAuthCookie = request.Cookies.ContainsKey(WebAuthCookies.AccessTokenCookieName);

            if (isStateChanging && carriesAuthCookie && !WebAuthCookies.HasValidCsrfToken(request))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json; charset=utf-8";

                await context.Response.WriteAsync(
                    "{\"message\":\"طلب غير صالح: تحقق CSRF فشل.\"}");

                return;
            }

            await _next(context);
        }
    }
}
