using SubscriptionTracker.Domain.Common;

namespace SubscriptionTracker.Application.Interfaces.Repositories
{
    // العمليات الأساسية المشتركة بين أي Entity - بيرث منه كل Repository متخصص
    // بيرجّع IQueryable في Query() عشان الـ Application Services تقدر تبني عليه فلترة/ترتيب مركّب
    // من غير ما الـ Repository نفسه يعرف تفاصيل الفلترة دي (فصل المسؤوليات صح)
    public interface IGenericRepository<T> where T : BaseEntity
    {
        IQueryable<T> Query();
        Task<T?> GetByIdAsync(int id);
        Task AddAsync(T entity);
        void Update(T entity);
        void Remove(T entity);
    }
}
