namespace SubscriptionTracker.Domain.Enums
{
    // مهم: أي قيمة جديدة لازم تتضاف في الآخر بس، مش نعيد ترتيب القديمة
    // عشان القيم الرقمية دي متخزنة فعليًا في قاعدة البيانات (Monthly=0, Yearly=1)
    public enum BillingCycle
    {
        Monthly,
        Yearly,
        Weekly,
        Quarterly
    }
}
