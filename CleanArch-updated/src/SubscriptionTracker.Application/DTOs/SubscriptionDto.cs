using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.DTOs
{
    // شكل البيانات اللي بترجع للـ Frontend لما تجيب اشتراك
    public class SubscriptionDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public Currency Currency { get; set; }
        public BillingCycle BillingCycle { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime NextRenewalDate { get; set; }
        public bool AutoRenew { get; set; }
        public string? WebsiteUrl { get; set; }
        public string? Notes { get; set; }
        public SubscriptionStatus Status { get; set; }
        public bool IsFavorite { get; set; }
        public string? Icon { get; set; }
        public int DaysUntilRenewal { get; set; }

        public CategoryDto? Category { get; set; }
        public PaymentMethodDto? PaymentMethod { get; set; }
        public List<TagDto> Tags { get; set; } = new();
    }
}
