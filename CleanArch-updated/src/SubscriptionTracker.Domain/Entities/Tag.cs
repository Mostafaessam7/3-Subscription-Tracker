using System.ComponentModel.DataAnnotations;
using SubscriptionTracker.Domain.Common;

namespace SubscriptionTracker.Domain.Entities
{
    public class Tag : BaseEntity
    {
        [Required]
        [MaxLength(30)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(7)]
        public string Color { get; set; } = "#818CF8";

        // العلاقة Many-to-Many مع EF Core 8+ بتتظبط تلقائيًا من غير الحاجة لجدول وسيط صريح
        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}
