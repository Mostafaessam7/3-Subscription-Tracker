namespace SubscriptionTracker.Domain.Common
{
    // كل الـ Entities بترث من هنا عشان الـ Generic Repository يقدر يتعامل مع أي واحد فيهم
    // بالاعتماد على Id بس، من غير ما يعرف تفاصيل كل Entity
    public abstract class BaseEntity
    {
        public int Id { get; set; }
    }
}
