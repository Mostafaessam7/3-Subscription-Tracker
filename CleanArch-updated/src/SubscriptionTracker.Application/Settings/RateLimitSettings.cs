namespace SubscriptionTracker.Application.Settings
{
    // سقف الـ Rate Limiting لـ Endpoints الـ Auth (Login/Register/Forgot-Password/Bootstrap) -
    // مقروءة من appsettings.json (قسم RateLimiting:AuthEndpoints) عشان بيئة الاختبار تقدر ترفعها
    public class RateLimitSettings
    {
        public const string SectionName = "RateLimiting:AuthEndpoints";

        public int PermitLimit { get; set; } = 10;
        public int WindowSeconds { get; set; } = 60;
    }
}
