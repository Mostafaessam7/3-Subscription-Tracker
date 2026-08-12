using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubscriptionTracker.Domain.Entities;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Infrastructure.Persistence.Configurations
{
    public class PaymentMethodConfiguration : IEntityTypeConfiguration<PaymentMethod>
    {
        public void Configure(EntityTypeBuilder<PaymentMethod> builder)
        {
            builder.HasData(
                new PaymentMethod { Id = 1, Name = "كاش", Type = PaymentMethodType.Cash },
                new PaymentMethod { Id = 2, Name = "فيزا/ماستركارد", Type = PaymentMethodType.Card },
                new PaymentMethod { Id = 3, Name = "تحويل بنكي", Type = PaymentMethodType.Bank },
                new PaymentMethod { Id = 4, Name = "محفظة إلكترونية", Type = PaymentMethodType.Wallet }
            );
        }
    }
}
