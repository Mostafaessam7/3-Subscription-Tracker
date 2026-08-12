namespace SubscriptionTracker.Application.DTOs
{
    public class CategorySpendingDto
    {
        public string CategoryName { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public string Icon { get; set; } = string.Empty;
        public decimal MonthlyTotal { get; set; }
        public int SubscriptionCount { get; set; }
    }

    public class TopExpensiveSubscriptionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal MonthlyEquivalent { get; set; }
        public string? CategoryIcon { get; set; }
    }

    public class AnalyticsInsightsDto
    {
        public decimal AverageMonthlyCost { get; set; }
        public TopExpensiveSubscriptionDto? MostExpensive { get; set; }
        public TopExpensiveSubscriptionDto? Cheapest { get; set; }
        // إجمالي المصروف السنوي اللي ممكن توفّره لو لغيت كل الاشتراكات النشطة
        public decimal PotentialYearlySavingsIfAllCancelled { get; set; }
        public List<TopExpensiveSubscriptionDto> Top5MostExpensive { get; set; } = new();
    }
}
