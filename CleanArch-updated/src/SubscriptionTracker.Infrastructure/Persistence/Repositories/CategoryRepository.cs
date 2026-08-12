using SubscriptionTracker.Infrastructure.Persistence;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence.Repositories
{
    public class CategoryRepository : GenericRepository<Category>, ICategoryRepository
    {
        public CategoryRepository(AppDbContext context) : base(context)
        {
        }
    }
}
