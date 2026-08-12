using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Interfaces.Repositories
{
    public interface ISubscriptionRepository : IGenericRepository<Subscription>
    {
        // بيرجّع IQueryable مع تحميل الـ Category والـ PaymentMethod والـ Tags مسبقًا (Eager Loading)
        // عشان أي Query فوقه (فلترة/ترتيب) ميحتاجش يعمل طلبات إضافية للداتابيز
        IQueryable<Subscription> QueryWithDetails();

        Task<Subscription?> GetByIdWithDetailsAsync(int id);
    }
}
