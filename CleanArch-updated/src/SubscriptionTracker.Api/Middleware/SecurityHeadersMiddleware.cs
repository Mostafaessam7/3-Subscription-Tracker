using Microsoft.AspNetCore.Http;

namespace SubscriptionTracker.Api.Middleware
{
    // بيضيف Headers أمنية أساسية لكل رد بيرجع من الـ API. الـ API ده JSON بحت (مفيش صفحات HTML بتترسم منه
    // غير Swagger UI في الـ Development)، فمش محتاجين Content-Security-Policy معقدة، لكن الـ Headers دي
    // بتحمي من هجمات معروفة (Clickjacking, MIME-sniffing) وبتتفعّل من غير أي تكلفة أو تأثير على الـ Frontend.
    public class SecurityHeadersMiddleware
    {
        private readonly RequestDelegate _next;

        public SecurityHeadersMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var headers = context.Response.Headers;

            // بيمنع المتصفح من تخمين نوع الملف (MIME Sniffing) - بيحمي لو حصل غلط في Content-Type
            headers["X-Content-Type-Options"] = "nosniff";

            // بيمنع الـ API يتعرض جوه <iframe> في موقع تاني (Clickjacking) - الـ API مش UI أصلًا
            // فمفيش سبب شرعي يخليها تتحمّل جوه Frame
            headers["X-Frame-Options"] = "DENY";

            // بيقلل المعلومات اللي بتتبعت في Referer Header لمواقع تانية لما حد يضغط على لينك خارجي
            headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

            // بيمنع المتصفحات القديمة من تفعيل ميزات المتصفح (كاميرا، مايك، موقع، إلخ) للـ API ده
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";

            await _next(context);
        }
    }
}
