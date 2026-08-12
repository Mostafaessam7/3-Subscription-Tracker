using System.ComponentModel.DataAnnotations;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.DTOs
{
    // شكل البيانات اللي بتتبعت من الـ Frontend عشان تضيف اشتراك جديد
    public class CreateSubscriptionDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Range(0, 100000)]
        public decimal Price { get; set; }

        public Currency Currency { get; set; } = Currency.EGP;

        [Required]
        public BillingCycle BillingCycle { get; set; }

        public DateTime? StartDate { get; set; }

        [Required]
        public DateTime NextRenewalDate { get; set; }

        public bool AutoRenew { get; set; } = true;

        [MaxLength(300)]
        public string? WebsiteUrl { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public bool IsFavorite { get; set; } = false;

        [MaxLength(10)]
        public string? Icon { get; set; }

        public int? CategoryId { get; set; }
        public int? PaymentMethodId { get; set; }
        public List<int>? TagIds { get; set; }

        [Required]
        public int UserId { get; set; }
    }

    // شكل البيانات المسموح تعديلها في اشتراك موجود
    public class UpdateSubscriptionDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Range(0, 100000)]
        public decimal Price { get; set; }

        public Currency Currency { get; set; }

        [Required]
        public BillingCycle BillingCycle { get; set; }

        public DateTime? StartDate { get; set; }

        [Required]
        public DateTime NextRenewalDate { get; set; }

        public bool AutoRenew { get; set; }

        [MaxLength(300)]
        public string? WebsiteUrl { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        public bool IsFavorite { get; set; }

        [MaxLength(10)]
        public string? Icon { get; set; }

        public int? CategoryId { get; set; }
        public int? PaymentMethodId { get; set; }
        public List<int>? TagIds { get; set; }

        [Required]
        public SubscriptionStatus Status { get; set; }
    }
}
