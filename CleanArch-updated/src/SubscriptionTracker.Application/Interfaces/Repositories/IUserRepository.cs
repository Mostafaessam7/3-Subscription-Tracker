using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Interfaces.Repositories
{
    public interface IUserRepository : IGenericRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
    }
}
