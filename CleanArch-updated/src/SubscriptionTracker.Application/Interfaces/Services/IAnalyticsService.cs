using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface IAnalyticsService
    {
        Task<List<CategorySpendingDto>> GetSpendingByCategoryAsync(int userId);
        Task<AnalyticsInsightsDto> GetInsightsAsync(int userId);
    }
}
