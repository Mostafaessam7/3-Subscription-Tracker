using System.ComponentModel.DataAnnotations;
using SubscriptionTracker.Domain.Common;

namespace SubscriptionTracker.Domain.Entities
{
    public class Category : BaseEntity
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        // كود لون Hex زي #35D0C6
        [Required]
        [MaxLength(7)]
        public string Color { get; set; } = "#35D0C6";

        // إيموجي أو اسم أيقونة بسيط زي "🎬" أو "fitness"
        [MaxLength(10)]
        public string Icon { get; set; } = "📁";

        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
