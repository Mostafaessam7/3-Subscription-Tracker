using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence.Configurations
{
    public class SubscriptionConfiguration : IEntityTypeConfiguration<Subscription>
    {
        public void Configure(EntityTypeBuilder<Subscription> builder)
        {
            builder.HasOne(s => s.User)
                .WithMany(u => u.Subscriptions)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // لو التصنيف اتمسح، الاشتراك مبيتمسحش، بس CategoryId بيرجع null
            builder.HasOne(s => s.Category)
                .WithMany(c => c.Subscriptions)
                .HasForeignKey(s => s.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);

            // نفس المنطق لوسيلة الدفع - لو اتمسحت، الاشتراك يفضل موجود
            builder.HasOne(s => s.PaymentMethod)
                .WithMany(p => p.Subscriptions)
                .HasForeignKey(s => s.PaymentMethodId)
                .OnDelete(DeleteBehavior.SetNull);

            // العلاقة Many-to-Many مع التاجز - بنحدد اسم جدول الربط صراحة عشان يبقى واضح
            builder.HasMany(s => s.Tags)
                .WithMany(t => t.Subscriptions)
                .UsingEntity(j => j.ToTable("SubscriptionTags"));
        }
    }
}
