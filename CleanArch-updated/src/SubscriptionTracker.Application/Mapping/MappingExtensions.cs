using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Mapping
{
    // Mapping يدوي بسيط بدل AutoMapper. الأسباب:
    // 1) ثغرة أمنية معروفة (GHSA-rvv3-g6hj-g44x - Denial of Service عن طريق Recursion) في نسخة
    //    AutoMapper المجانية اللي المشروع كان بيستخدمها (13.0.1)، ومفيش Patch متاح لها إلا في
    //    نسخ 15.1.1+/16.1.1+ اللي بقت مرخّصة تجاريًا (AutoMapper بقى منتج مدفوع من v15 - راجع
    //    https://luckypennysoftware.com/faq)
    // 2) الـ Mapping هنا بسيط وثابت (5 DTOs مسطّحة، مفيش تعقيد حقيقي) - مايستاهلش أصلًا Dependency
    //    خارجية بتعمل Reflection وقت التشغيل؛ Extension Methods عادية أسرع وأوضح وأسهل تتبّع في الـ
    //    Debugger (بتشتغل زي أي كود C# عادي، من غير "سحر" وقت التشغيل)
    public static class MappingExtensions
    {
        public static CategoryDto ToDto(this Category category) => new()
        {
            Id = category.Id,
            Name = category.Name,
            Color = category.Color,
            Icon = category.Icon
        };

        public static List<CategoryDto> ToDtoList(this IEnumerable<Category> categories) =>
            categories.Select(ToDto).ToList();

        public static PaymentMethodDto ToDto(this PaymentMethod method) => new()
        {
            Id = method.Id,
            Name = method.Name,
            Type = method.Type
        };

        public static List<PaymentMethodDto> ToDtoList(this IEnumerable<PaymentMethod> methods) =>
            methods.Select(ToDto).ToList();

        public static TagDto ToDto(this Tag tag) => new()
        {
            Id = tag.Id,
            Name = tag.Name,
            Color = tag.Color
        };

        public static List<TagDto> ToDtoList(this IEnumerable<Tag> tags) =>
            tags.Select(ToDto).ToList();

        public static ProfileDto ToDto(this User user) => new()
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };

        public static SubscriptionDto ToDto(this Subscription subscription) => new()
        {
            Id = subscription.Id,
            UserId = subscription.UserId,
            Name = subscription.Name,
            Description = subscription.Description,
            Price = subscription.Price,
            Currency = subscription.Currency,
            BillingCycle = subscription.BillingCycle,
            StartDate = subscription.StartDate,
            NextRenewalDate = subscription.NextRenewalDate,
            AutoRenew = subscription.AutoRenew,
            WebsiteUrl = subscription.WebsiteUrl,
            Notes = subscription.Notes,
            Status = subscription.Status,
            IsFavorite = subscription.IsFavorite,
            Icon = subscription.Icon,
            // DaysUntilRenewal مش عمود في قاعدة البيانات - بيتحسب وقت الطلب نفسه
            DaysUntilRenewal = (subscription.NextRenewalDate.Date - DateTime.UtcNow.Date).Days,
            Category = subscription.Category?.ToDto(),
            PaymentMethod = subscription.PaymentMethod?.ToDto(),
            Tags = subscription.Tags.ToDtoList()
        };

        public static List<SubscriptionDto> ToDtoList(this IEnumerable<Subscription> subscriptions) =>
            subscriptions.Select(ToDto).ToList();
    }
}
