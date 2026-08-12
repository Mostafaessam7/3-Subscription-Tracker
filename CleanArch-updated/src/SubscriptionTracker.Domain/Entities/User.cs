using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SubscriptionTracker.Domain.Common;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Domain.Entities
{
    public class User : BaseEntity
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        // كل مستخدم بيتسجل عادي بيبقى User افتراضيًا - مفيش طريقة تسجيل ذاتي كـ Admin
        [Required]
        public UserRole Role { get; set; } = UserRole.User;

        // الحد الأقصى للمصروف الشهري اللي المستخدم حدده لنفسه (اختياري)
        [Column(TypeName = "decimal(10,2)")]
        public decimal? MonthlyBudget { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<Subscription> Subscriptions { get; set; } = new List<Subscription>();
    }
}

