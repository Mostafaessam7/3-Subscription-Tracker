using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.DTOs
{
    public enum SubscriptionSortBy
    {
        RenewalDate,
        Cost,
        Name
    }

    // كل معايير البحث والفلترة والترتيب مجمّعة في كلاس واحد بدل ما نبعت 8 parameters منفصلين
    public class SubscriptionQueryOptions
    {
        public string? Search { get; set; }
        public SubscriptionStatus? Status { get; set; }
        public BillingCycle? BillingCycle { get; set; }
        public int? CategoryId { get; set; }
        public int? TagId { get; set; }
        public bool? OnlyFavorites { get; set; }
        public DateTime? RenewalFrom { get; set; }
        public DateTime? RenewalTo { get; set; }
        public SubscriptionSortBy SortBy { get; set; } = SubscriptionSortBy.RenewalDate;
        public bool SortDescending { get; set; } = false;
    }
}
