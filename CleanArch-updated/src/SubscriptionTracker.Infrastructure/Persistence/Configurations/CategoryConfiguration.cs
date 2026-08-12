using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence.Configurations
{
    public class CategoryConfiguration : IEntityTypeConfiguration<Category>
    {
        public void Configure(EntityTypeBuilder<Category> builder)
        {
            // تصنيفات افتراضية عشان التطبيق مايبقاش فاضي أول مرة تشغّله
            builder.HasData(
                new Category { Id = 1, Name = "ترفيه", Color = "#35D0C6", Icon = "🎬" },
                new Category { Id = 2, Name = "رياضة وصحة", Color = "#4ADE80", Icon = "💪" },
                new Category { Id = 3, Name = "عمل وإنتاجية", Color = "#F5B841", Icon = "💼" },
                new Category { Id = 4, Name = "تعليم", Color = "#818CF8", Icon = "📚" },
                new Category { Id = 5, Name = "خدمات سحابية", Color = "#38BDF8", Icon = "☁️" },
                new Category { Id = 6, Name = "أخرى", Color = "#94A3B8", Icon = "📁" }
            );
        }
    }
}
