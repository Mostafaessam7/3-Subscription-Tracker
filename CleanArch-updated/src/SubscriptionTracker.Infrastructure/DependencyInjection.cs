using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Settings;
using SubscriptionTracker.Infrastructure.BackgroundServices;
using SubscriptionTracker.Infrastructure.Persistence;
using SubscriptionTracker.Infrastructure.Persistence.Repositories;
using SubscriptionTracker.Infrastructure.Security;
using SubscriptionTracker.Infrastructure.Services;

namespace SubscriptionTracker.Infrastructure
{
    // نقطة تسجيل واحدة لكل حاجة في طبقة الـ Infrastructure - Program.cs بيستدعيها بسطر واحد بس
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            // قاعدة البيانات
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

            // الإعدادات (Options Pattern) - بدل ما نقرا appsettings.json بنص حر في كل مكان
            services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
            services.Configure<EmailSettings>(configuration.GetSection(EmailSettings.SectionName));
            services.Configure<AdminSettings>(configuration.GetSection(AdminSettings.SectionName));

            // الـ Repositories والـ Unit of Work
            services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
            services.AddScoped<ICategoryRepository, CategoryRepository>();
            services.AddScoped<IPaymentMethodRepository, PaymentMethodRepository>();
            services.AddScoped<ITagRepository, TagRepository>();
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // الأمان (تشفير كلمة السر وتوليد الـ JWT)
            services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
            services.AddScoped<ITokenService, TokenService>();

            // الإيميل
            services.AddScoped<IEmailService, EmailService>();

            // الخدمة اللي بتشتغل في الخلفية طول عمر التطبيق
            services.AddHostedService<RenewalReminderBackgroundService>();

            return services;
        }
    }
}
