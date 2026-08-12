using System.ComponentModel.DataAnnotations;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.DTOs
{
    // بيانات كل مستخدم زي ما الأدمن بيشوفها - فيها إحصائيات إضافية مش موجودة في ProfileDto العادي
    public class AdminUserDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
        public int SubscriptionsCount { get; set; }
        public decimal MonthlySpend { get; set; }
    }

    public class UpdateUserRoleDto
    {
        [Required]
        public UserRole Role { get; set; }
    }

    // إحصائيات عامة عن النظام كله - لوحة تحكم الأدمن
    public class SystemStatsDto
    {
        public int TotalUsers { get; set; }
        public int TotalActiveSubscriptions { get; set; }
        public decimal TotalMonthlySpendAcrossAllUsers { get; set; }
        public int NewUsersLast30Days { get; set; }
    }

    // بيتستخدم مرة واحدة بس - أول ما تتضاف قاعدة البيانات ومفيش أي Admin لسه
    public class BootstrapAdminDto
    {
        [Required]
        public string BootstrapKey { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;
    }
}
