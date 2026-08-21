using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Settings;
using SubscriptionTracker.Infrastructure.Persistence;

namespace SubscriptionTracker.Tests.Integration
{
    // بيشغّل التطبيق كامل (زي ما هو في appsettings.json) لكن بيستبدل AppDbContext بـ EF Core InMemory
    // بدل SQL Server الحقيقي - عشان الـ Integration Tests تشتغل من غير قاعدة بيانات فعلية
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>
    {
        // اسم فريد لكل Instance عشان كل Test Class ياخد قاعدة بيانات In-Memory منفصلة ومعزولة
        private readonly string _dbName = $"SubscriptionTrackerTests_{Guid.NewGuid()}";

        // بيتاح للـ Tests عشان تقرا آخر إيميل اتبعت (زي لينك إعادة تعيين كلمة السر) من غير SMTP حقيقي
        public FakeEmailService FakeEmailService { get; } = new();

        // القيمة الافتراضية عالية جدًا عشان الـ Integration Tests العادية (اللي بتعمل عشرات
        // الـ Register/Login بسرعة) متتحظرش بالغلط. لازم تتظبط قبل أول CreateClient()/Services -
        // Test مخصوص لـ Rate Limiting نفسه (RateLimitingTests) بيحطها رقم صغير عمدًا
        public int AuthRateLimitPermitLimit { get; set; } = 100_000;

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");

            builder.ConfigureServices(services =>
            {
                // services.Configure() بتضاف هنا بعد تسجيل الأصلي بتاع Program.cs (WebApplicationFactory
                // بتضمن كده)، فبتغلب عليه - أضمن بكتير من محاولة نتحكم في IConfiguration نفسها
                // مع الـ Minimal Hosting Model
                services.Configure<RateLimitSettings>(opt => opt.PermitLimit = AuthRateLimitPermitLimit);

                // من EF Core 8+، الـ AddDbContext بيسجّل الإعدادات كـ IDbContextOptionsConfiguration<T>
                // (مش بس DbContextOptions<T>) عشان يدعم أكتر من Configure Callback - فلازم نشيل
                // النوعين الاتنين، وإلا هيفضل SqlServer وInMemory متسجلين مع بعض ويحصل Conflict
                var descriptorsToRemove = services
                    .Where(d =>
                        d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                        d.ServiceType.IsGenericType &&
                        d.ServiceType.GetGenericTypeDefinition().Name.StartsWith("IDbContextOptionsConfiguration") &&
                        d.ServiceType.GenericTypeArguments.Contains(typeof(AppDbContext)))
                    .ToList();

                foreach (var descriptor in descriptorsToRemove)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(_dbName));

                // بديل IEmailService الحقيقي - عشان الـ Tests متعتمدش على SMTP فعلي (هيفشل دايمًا هنا)
                services.RemoveAll<IEmailService>();
                services.AddSingleton<IEmailService>(FakeEmailService);
            });
        }
    }
}
