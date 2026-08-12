using System.ComponentModel.DataAnnotations;
using SubscriptionTracker.Domain.Common;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Domain.Entities
{
    public class PaymentMethod : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public PaymentMethodType Type { get; set; }

        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
