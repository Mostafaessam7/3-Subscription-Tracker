using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace SubscriptionTracker.Api.Middleware
{
    // بيستخدم الـ IExceptionHandler المدمج في .NET 8+ (بديل النمط القديم لـ Middleware مكتوب يدوي)
    // أي Exception مش متوقع في أي مكان في التطبيق بيتمسك هنا مركزيًا، بدل ما كل Controller
    // يحتاج try/catch بتاعه، وبيترجع رد JSON موحّد الشكل (ProblemDetails) بدل الـ Stack Trace الخام
    // اللي ممكن يسرّب تفاصيل حساسة عن السيرفر للمستخدم النهائي
    public class GlobalExceptionHandler : IExceptionHandler
    {
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger)
        {
            _logger = logger;
        }

        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            _logger.LogError(exception, "حصل خطأ مش متوقع أثناء معالجة الطلب: {Path}", httpContext.Request.Path);

            var problemDetails = new ProblemDetails
            {
                Status = StatusCodes.Status500InternalServerError,
                Title = "حصل خطأ غير متوقع في السيرفر",
                Detail = "حاول تاني بعد شوية. لو المشكلة استمرت، تواصل مع الدعم الفني.",
                Instance = httpContext.Request.Path
            };

            httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;

            await httpContext.Response.WriteAsJsonAsync(problemDetails, cancellationToken);

            // true معناها "أنا عالجت الخطأ ده، متكملش تدور على handler تاني"
            return true;
        }
    }
}
