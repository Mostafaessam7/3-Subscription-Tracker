using System.Reflection;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Services;

namespace SubscriptionTracker.Application
{
    // نقطة تسجيل واحدة لكل حاجة في طبقة الـ Application - Program.cs بيستدعيها بسطر واحد بس
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplication(this IServiceCollection services)
        {
            // ملحوظة: مفيش AutoMapper هنا عمدًا - اتشال (راجع Mapping/MappingExtensions.cs) بسبب
            // ثغرة أمنية (GHSA-rvv3-g6hj-g44x) من غير Patch مجاني متاح بعد ما المكتبة بقت تجارية
            // من v15. الـ Mapping بقى Extension Methods عادية، فمحتاجش أي تسجيل في الـ DI أصلًا.

            // FluentValidation: بيسجّل كل الـ Validators الموجودة في الـ Assembly ده تلقائيًا
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());

            // الـ Services (منطق العمل الفعلي - Business Logic)
            services.AddScoped<ISubscriptionService, SubscriptionService>();
            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IPaymentMethodService, PaymentMethodService>();
            services.AddScoped<ITagService, TagService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IAnalyticsService, AnalyticsService>();
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<IAdminService, AdminService>();

            return services;
        }
    }
}
