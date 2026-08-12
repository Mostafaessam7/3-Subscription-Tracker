using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface ISubscriptionService
    {
        Task<List<SubscriptionDto>> GetAllForUserAsync(int userId, SubscriptionQueryOptions options);
        Task<SubscriptionDto?> GetByIdAsync(int id);
        Task<SubscriptionDto> CreateAsync(CreateSubscriptionDto dto);
        Task<bool> UpdateAsync(int id, UpdateSubscriptionDto dto);
        Task<bool> DeleteAsync(int id);
        Task<decimal> GetMonthlyTotalAsync(int userId);
        Task<SubscriptionDto?> DuplicateAsync(int id);
    }
}
