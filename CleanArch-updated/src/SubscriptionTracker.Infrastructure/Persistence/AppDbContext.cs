using System.Reflection;
using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Infrastructure.Persistence
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Subscription> Subscriptions { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<PaymentMethod> PaymentMethods { get; set; }
        public DbSet<Tag> Tags { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // بيقرا كل كلاسات الـ IEntityTypeConfiguration<T> الموجودة في نفس الـ Assembly تلقائيًا
            // (مجلد Persistence/Configurations) بدل ما نسجّلهم واحد واحد يدوي
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        }
    }
}
