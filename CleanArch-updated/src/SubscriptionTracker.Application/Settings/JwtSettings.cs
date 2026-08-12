namespace SubscriptionTracker.Application.Settings
{
    // بدل ما نكتب _configuration.GetSection("Jwt")["Key"] في كل مكان (نص حر عرضة للأخطاء الإملائية)،
    // الكلاس ده بيتربط تلقائيًا بقسم "Jwt" في appsettings.json (Options Pattern)
    public class JwtSettings
    {
        public const string SectionName = "Jwt";

        public string Key { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;
        public string Audience { get; set; } = string.Empty;
        public double ExpiresInHours { get; set; } = 8;
    }
}
