using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface ITokenService
    {
        (string Token, DateTime ExpiresAt) GenerateToken(User user);
    }
}
