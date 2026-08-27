namespace SubscriptionTracker.Application.Settings
{
    // بيتحدد فيه الـ Origins المسموح لها تكلم الـ API - من غير ما نـ Hardcode دومين
    // الفرونت اند جوه الكود، عشان النشر لأي بيئة (Staging/Production) يبقى تغيير إعداد بس
    public class CorsSettings
    {
        public const string SectionName = "Cors";

        public string[] AllowedOrigins { get; set; } = ["http://localhost:4200"];
    }
}
