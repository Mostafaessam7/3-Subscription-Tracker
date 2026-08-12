using System.ComponentModel.DataAnnotations;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.DTOs
{
    public class PaymentMethodDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public PaymentMethodType Type { get; set; }
    }

    public class CreatePaymentMethodDto
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public PaymentMethodType Type { get; set; }
    }

    public class UpdatePaymentMethodDto
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        public PaymentMethodType Type { get; set; }
    }
}
