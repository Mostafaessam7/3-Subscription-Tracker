namespace SubscriptionTracker.Application.Settings
{
    // بيتحدد فيه رابط الفرونت اند عشان نقدر نبني لينكات كاملة (زي لينك إعادة تعيين كلمة السر)
    // جوه إيميلات بيبعتها الباك اند - من غير ما نـ Hardcode الدومين جوه الكود
    public class FrontendSettings
    {
        public const string SectionName = "Frontend";

        public string BaseUrl { get; set; } = "http://localhost:4200";
    }
}
