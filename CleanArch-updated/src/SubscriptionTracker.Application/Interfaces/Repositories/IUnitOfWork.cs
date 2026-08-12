namespace SubscriptionTracker.Application.Interfaces.Repositories
{
    // بيجمع كل الـ Repositories في مكان واحد، وبيضمن إن كل التعديلات في نفس العملية
    // بتتحفظ مع بعض دفعة واحدة (SaveChangesAsync) - يعني لو حاجة فشلت، حاجة تانية ماتتحفظش لوحدها
    public interface IUnitOfWork
    {
        ISubscriptionRepository Subscriptions { get; }
        ICategoryRepository Categories { get; }
        IPaymentMethodRepository PaymentMethods { get; }
        ITagRepository Tags { get; }
        IUserRepository Users { get; }

        Task<int> SaveChangesAsync();
    }
}
