using SubscriptionTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence.Repositories
{
    public class SubscriptionRepository : GenericRepository<Subscription>, ISubscriptionRepository
    {
        public SubscriptionRepository(AppDbContext context) : base(context)
        {
        }

        public IQueryable<Subscription> QueryWithDetails()
        {
            return DbSet
                .Include(s => s.Category)
                .Include(s => s.PaymentMethod)
                .Include(s => s.Tags)
                .AsQueryable();
        }

        public async Task<Subscription?> GetByIdWithDetailsAsync(int id)
        {
            return await QueryWithDetails().FirstOrDefaultAsync(s => s.Id == id);
        }
    }
}
