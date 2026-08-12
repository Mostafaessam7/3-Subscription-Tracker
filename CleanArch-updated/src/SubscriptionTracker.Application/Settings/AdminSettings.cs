namespace SubscriptionTracker.Application.Settings
{
    public class AdminSettings
    {
        public const string SectionName = "Admin";

        // مفتاح سري بيتحط في appsettings.json، بيسمح بإنشاء أول Admin بس لو مفيش Admin أصلاً في النظام
        // (بعد كده الـ Bootstrap Endpoint بيرفض يشتغل تاني - راجع AdminService.BootstrapAsync)
        public string BootstrapKey { get; set; } = string.Empty;
    }
}
