namespace SubscriptionTracker.Domain.Enums
{
    // بدل الـ IsActive البسيطة، دلوقتي عندنا 3 حالات حقيقية
    public enum SubscriptionStatus
    {
        Active,
        Expired,
        Cancelled
    }
}
