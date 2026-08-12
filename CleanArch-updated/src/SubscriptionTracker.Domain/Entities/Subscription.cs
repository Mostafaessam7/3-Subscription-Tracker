using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SubscriptionTracker.Domain.Common;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Domain.Entities
{
    public class Subscription : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        [Required]
        public Currency Currency { get; set; } = Currency.EGP;

        [Required]
        public BillingCycle BillingCycle { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime NextRenewalDate { get; set; }

        public bool AutoRenew { get; set; } = true;

        [MaxLength(300)]
        public string? WebsiteUrl { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [Required]
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;

        public bool IsFavorite { get; set; } = false;

        // أيقونة/لوجو مخصص للاشتراك (إيموجي بسيط) - لو فاضي، الـ Frontend بيستخدم أول حرف من الاسم بديل
        [MaxLength(10)]
        public string? Icon { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastReminderSentAt { get; set; }

        [ForeignKey(nameof(User))]
        public int UserId { get; set; }
        public User? User { get; set; }

        public int? CategoryId { get; set; }
        public Category? Category { get; set; }

        public int? PaymentMethodId { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }

        public ICollection<Tag> Tags { get; set; } = new List<Tag>();
    }
}
