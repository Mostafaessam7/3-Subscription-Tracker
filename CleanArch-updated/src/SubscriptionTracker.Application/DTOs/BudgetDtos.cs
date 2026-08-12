using System.ComponentModel.DataAnnotations;

namespace SubscriptionTracker.Application.DTOs
{
    public class BudgetDto
    {
        public decimal? MonthlyBudget { get; set; }
    }

    public class UpdateBudgetDto
    {
        [Range(0, 1000000)]
        public decimal? MonthlyBudget { get; set; }
    }
}
