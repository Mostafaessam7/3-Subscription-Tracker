namespace SubscriptionTracker.Application.Interfaces.Services
{
    // بيغلّف عمليات تشفير كلمة السر - الـ Application Layer بتتعامل مع الـ Interface بس
    // من غير ما تعرف أو تهتم إن التنفيذ الفعلي بيستخدم BCrypt بالتحديد (تفصيلة تقنية في Infrastructure)
    public interface IPasswordHasher
    {
        string Hash(string password);
        bool Verify(string password, string hash);
    }
}
