namespace SubscriptionTracker.Api.Auth
{
    /// <summary>
    /// بيحمل توكن الدخول في كوكي <c>HttpOnly</c> بدل <c>localStorage</c>، فيبقى مش مقروء من أي
    /// سكريبت على الصفحة.
    ///
    /// ليه الشكل ده تحديدًا هنا: التطبيق ده معندوش Refresh Token خالص — فيه توكن واحد صلاحيته 8
    /// ساعات. يعني نقل التوكن للذاكرة بس (زي PosFlow) كان هيخرّج المستخدم من الحساب مع كل إعادة
    /// تحميل للصفحة، من غير أي آلية تسترجع الجلسة. الكوكي بتحل الاتنين: التوكن مش مقروء من
    /// JavaScript، والجلسة بتعيش بعد الـ Reload زي ما المستخدم متوقع.
    ///
    /// نقل بيانات الاعتماد لكوكي معناه إن المتصفح بيبعتها تلقائيًا مع أي طلب — وده بالظبط اللي
    /// هجمات CSRF بتستغله، فالحماية منها بتتشحن في نفس التغيير مش بعده.
    ///
    /// الـ Transport اختياري (<c>X-Auth-Transport: cookie</c>): أي عميل مش متصفح بيفضل شغال
    /// بالـ Authorization Header زي ما هو.
    /// </summary>
    public static class WebAuthCookies
    {
        public const string AccessTokenCookieName = "st_at";

        /// <summary>
        /// مش HttpOnly عن قصد: الفرونت اند لازم يقراها ويرجّعها في Header. ودي آلية الـ
        /// double-submit كلها — موقع المهاجم يقدر يخلي المتصفح **يبعت** الكوكيز، لكن سياسة الـ
        /// same-origin بتمنعه إنه **يقراها**، فمش هيقدر يولّد الـ Header المطابق.
        /// </summary>
        public const string CsrfCookieName = "XSRF-TOKEN";

        public const string CsrfHeaderName = "X-XSRF-TOKEN";

        public const string TransportHeaderName = "X-Auth-Transport";

        public static bool UsesCookieTransport(HttpRequest request) =>
            string.Equals(request.Headers[TransportHeaderName], "cookie", StringComparison.OrdinalIgnoreCase)
            || request.Cookies.ContainsKey(AccessTokenCookieName);

        /// <summary>
        /// فحص الـ double-submit. بيتطبّق بس على الطلبات اللي بتغيّر حالة (POST/PUT/PATCH/DELETE):
        /// طلبات القراءة مش قابلة للاستغلال بنفس الطريقة، وإلزامها بالـ Header كان هيكسر أي فتح
        /// عادي للصفحة.
        /// </summary>
        public static bool HasValidCsrfToken(HttpRequest request)
        {
            var cookieValue = request.Cookies[CsrfCookieName];
            var headerValue = request.Headers[CsrfHeaderName].ToString();

            return !string.IsNullOrEmpty(cookieValue)
                && !string.IsNullOrEmpty(headerValue)
                // Ordinal مش حساس للثقافة: دي قيم مبهمة، والمقارنة الحساسة للثقافة ممكن تعتبر
                // تسلسلات بايت مختلفة متساوية.
                && string.Equals(cookieValue, headerValue, StringComparison.Ordinal);
        }

        public static void Issue(HttpResponse response, string accessToken, DateTime expiresAtUtc, bool isDevelopment)
        {
            // SameSite=None مطلوبة لما الفرونت اند والـ API يبقوا على Origins مختلفة، والمتصفحات
            // بترفض None من غير Secure. التطوير المحلي مفيهوش TLS، فبيستخدم Lax — اختلاف الـ Port
            // مش بيغيّر تعريف الـ "site" في SameSite، فـ Lax بتشتغل عادي محليًا.
            var sameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None;
            var secure = !isDevelopment;
            var expires = new DateTimeOffset(DateTime.SpecifyKind(expiresAtUtc, DateTimeKind.Utc));

            response.Cookies.Append(AccessTokenCookieName, accessToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = sameSite,
                Expires = expires,
                Path = "/",
            });

            response.Cookies.Append(CsrfCookieName, Guid.NewGuid().ToString("N"), new CookieOptions
            {
                HttpOnly = false,
                Secure = secure,
                SameSite = sameSite,
                Expires = expires,
                Path = "/",
            });
        }

        public static void Clear(HttpResponse response, bool isDevelopment)
        {
            var sameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None;
            var secure = !isDevelopment;

            // الخصائص لازم تطابق اللي اتحطت بيها، وإلا المتصفح بيعتبرها كوكي تانية والأصلية
            // بتفضل موجودة بعد تسجيل الخروج.
            response.Cookies.Delete(AccessTokenCookieName, new CookieOptions
            {
                HttpOnly = true,
                Secure = secure,
                SameSite = sameSite,
                Path = "/",
            });

            response.Cookies.Delete(CsrfCookieName, new CookieOptions
            {
                HttpOnly = false,
                Secure = secure,
                SameSite = sameSite,
                Path = "/",
            });
        }
    }
}
