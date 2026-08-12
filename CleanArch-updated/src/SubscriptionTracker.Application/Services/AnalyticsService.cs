using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Domain.Common;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.Services
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly IUnitOfWork _unitOfWork;

        public AnalyticsService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<CategorySpendingDto>> GetSpendingByCategoryAsync(int userId)
        {
            var subscriptions = await _unitOfWork.Subscriptions.QueryWithDetails()
                .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
                .ToListAsync();

            var grouped = subscriptions
                .GroupBy(s => s.Category)
                .Select(g => new CategorySpendingDto
                {
                    CategoryName = g.Key?.Name ?? "بدون تصنيف",
                    Color = g.Key?.Color ?? "#94A3B8",
                    Icon = g.Key?.Icon ?? "📁",
                    MonthlyTotal = g.Sum(s => BillingCycleHelper.ToMonthlyEquivalent(s.Price, s.BillingCycle)),
                    SubscriptionCount = g.Count()
                })
                .OrderByDescending(c => c.MonthlyTotal)
                .ToList();

            return grouped;
        }

        public async Task<AnalyticsInsightsDto> GetInsightsAsync(int userId)
        {
            var subscriptions = await _unitOfWork.Subscriptions.QueryWithDetails()
                .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
                .ToListAsync();

            if (subscriptions.Count == 0)
            {
                return new AnalyticsInsightsDto();
            }

            var withMonthlyEquivalent = subscriptions
                .Select(s => new TopExpensiveSubscriptionDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    MonthlyEquivalent = BillingCycleHelper.ToMonthlyEquivalent(s.Price, s.BillingCycle),
                    CategoryIcon = s.Category?.Icon
                })
                .OrderByDescending(s => s.MonthlyEquivalent)
                .ToList();

            var averageMonthlyCost = withMonthlyEquivalent.Average(s => s.MonthlyEquivalent);
            var potentialYearlySavings = withMonthlyEquivalent.Sum(s => s.MonthlyEquivalent) * 12;

            return new AnalyticsInsightsDto
            {
                AverageMonthlyCost = averageMonthlyCost,
                MostExpensive = withMonthlyEquivalent.First(),
                Cheapest = withMonthlyEquivalent.Last(),
                PotentialYearlySavingsIfAllCancelled = potentialYearlySavings,
                Top5MostExpensive = withMonthlyEquivalent.Take(5).ToList()
            };
        }
    }
}
