using SubscriptionTracker.Infrastructure.Persistence;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence.Repositories
{
    public class TagRepository : GenericRepository<Tag>, ITagRepository
    {
        public TagRepository(AppDbContext context) : base(context)
        {
        }
    }
}
