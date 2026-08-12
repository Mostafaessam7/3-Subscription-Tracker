using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Infrastructure.Security
{
    // التنفيذ الفعلي بيستخدم BCrypt - لو حبينا نغيّر الخوارزمية بعدين (زي Argon2 مثلًا)،
    // بنغيّر الكلاس ده بس، والـ Application Layer مش هتحس بأي فرق لأنها شغالة على IPasswordHasher
    public class BCryptPasswordHasher : IPasswordHasher
    {
        public string Hash(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        public bool Verify(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
    }
}
