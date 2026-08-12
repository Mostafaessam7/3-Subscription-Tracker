using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence.Configurations
{
    public class TagConfiguration : IEntityTypeConfiguration<Tag>
    {
        public void Configure(EntityTypeBuilder<Tag> builder)
        {
            // مفيش حاجة إضافية مطلوبة دلوقتي - الـ Data Annotations في الـ Entity نفسها كفاية
            // الملف موجود عشان لو احتجنا نضيف حاجة بعدين، يبقى مكانها الطبيعي جاهز
        }
    }
}
