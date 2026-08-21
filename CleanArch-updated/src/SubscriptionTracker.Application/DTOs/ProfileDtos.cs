using System.ComponentModel.DataAnnotations;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.DTOs
{
    public class ProfileDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateProfileDto
    {
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; } = string.Empty;
    }

    // بيتطلب كلمة السر الحالية عشان نتأكد إن صاحب الحساب فعلًا هو اللي بيمسحه - إجراء نهائي
    // ومفيش رجوع فيه (كل الاشتراكات بتاعته بتتمسح معاه Cascade)
    public class DeleteAccountDto
    {
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
