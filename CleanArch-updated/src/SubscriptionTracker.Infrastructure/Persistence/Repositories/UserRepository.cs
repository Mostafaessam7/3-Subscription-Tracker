using SubscriptionTracker.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence.Repositories
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            return await DbSet.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task<User?> GetByPasswordResetTokenHashAsync(string tokenHash)
        {
            return await DbSet.FirstOrDefaultAsync(u => u.PasswordResetTokenHash == tokenHash);
        }

        public async Task<User?> GetByEmailConfirmationTokenHashAsync(string tokenHash)
        {
            return await DbSet.FirstOrDefaultAsync(u => u.EmailConfirmationTokenHash == tokenHash);
        }
    }
}
