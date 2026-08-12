using SubscriptionTracker.Infrastructure.Persistence;
using SubscriptionTracker.Application.Interfaces.Repositories;

namespace SubscriptionTracker.Infrastructure.Persistence.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;

        public UnitOfWork(
            AppDbContext context,
            ISubscriptionRepository subscriptions,
            ICategoryRepository categories,
            IPaymentMethodRepository paymentMethods,
            ITagRepository tags,
            IUserRepository users)
        {
            _context = context;
            Subscriptions = subscriptions;
            Categories = categories;
            PaymentMethods = paymentMethods;
            Tags = tags;
            Users = users;
        }

        public ISubscriptionRepository Subscriptions { get; }
        public ICategoryRepository Categories { get; }
        public IPaymentMethodRepository PaymentMethods { get; }
        public ITagRepository Tags { get; }
        public IUserRepository Users { get; }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
