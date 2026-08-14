using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Mapping;
using SubscriptionTracker.Domain.Common;
using SubscriptionTracker.Domain.Entities;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly IUnitOfWork _unitOfWork;

        public SubscriptionService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<SubscriptionDto>> GetAllForUserAsync(int userId, SubscriptionQueryOptions options)
        {
            var query = _unitOfWork.Subscriptions.QueryWithDetails()
                .Where(s => s.UserId == userId);

            if (!string.IsNullOrWhiteSpace(options.Search))
            {
                var search = options.Search.Trim().ToLower();
                query = query.Where(s => s.Name.ToLower().Contains(search));
            }

            if (options.Status.HasValue)
                query = query.Where(s => s.Status == options.Status.Value);

            if (options.BillingCycle.HasValue)
                query = query.Where(s => s.BillingCycle == options.BillingCycle.Value);

            if (options.CategoryId.HasValue)
                query = query.Where(s => s.CategoryId == options.CategoryId.Value);

            if (options.TagId.HasValue)
                query = query.Where(s => s.Tags.Any(t => t.Id == options.TagId.Value));

            if (options.OnlyFavorites == true)
                query = query.Where(s => s.IsFavorite);

            if (options.RenewalFrom.HasValue)
                query = query.Where(s => s.NextRenewalDate >= options.RenewalFrom.Value);

            if (options.RenewalTo.HasValue)
                query = query.Where(s => s.NextRenewalDate <= options.RenewalTo.Value);

            query = options.SortBy switch
            {
                SubscriptionSortBy.Cost => options.SortDescending
                    ? query.OrderByDescending(s => s.Price)
                    : query.OrderBy(s => s.Price),
                SubscriptionSortBy.Name => options.SortDescending
                    ? query.OrderByDescending(s => s.Name)
                    : query.OrderBy(s => s.Name),
                _ => options.SortDescending
                    ? query.OrderByDescending(s => s.NextRenewalDate)
                    : query.OrderBy(s => s.NextRenewalDate)
            };

            var subscriptions = await query.ToListAsync();
            return subscriptions.ToDtoList();
        }

        public async Task<SubscriptionDto?> GetByIdAsync(int id)
        {
            var subscription = await _unitOfWork.Subscriptions.GetByIdWithDetailsAsync(id);
            return subscription?.ToDto();
        }

        public async Task<SubscriptionDto> CreateAsync(CreateSubscriptionDto dto)
        {
            var subscription = new Subscription
            {
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                Currency = dto.Currency,
                BillingCycle = dto.BillingCycle,
                StartDate = dto.StartDate,
                NextRenewalDate = dto.NextRenewalDate,
                AutoRenew = dto.AutoRenew,
                WebsiteUrl = dto.WebsiteUrl,
                Notes = dto.Notes,
                IsFavorite = dto.IsFavorite,
                Icon = dto.Icon,
                CategoryId = dto.CategoryId,
                PaymentMethodId = dto.PaymentMethodId,
                UserId = dto.UserId,
                Status = SubscriptionStatus.Active,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.TagIds is { Count: > 0 })
            {
                subscription.Tags = await _unitOfWork.Tags.Query()
                    .Where(t => dto.TagIds.Contains(t.Id))
                    .ToListAsync();
            }

            await _unitOfWork.Subscriptions.AddAsync(subscription);
            await _unitOfWork.SaveChangesAsync();

            // بعد الحفظ، بنجيب النسخة كاملة مع كل العلاقات عشان الـ DTO يرجع متكامل
            // (! آمن هنا: لسه فاكرين الـ Id من subscription.Id اللي اتحفظ فوق - مستحيل يرجع null)
            var created = await _unitOfWork.Subscriptions.GetByIdWithDetailsAsync(subscription.Id);
            return created!.ToDto();
        }

        public async Task<bool> UpdateAsync(int id, UpdateSubscriptionDto dto)
        {
            var subscription = await _unitOfWork.Subscriptions.GetByIdWithDetailsAsync(id);
            if (subscription is null) return false;

            subscription.Name = dto.Name;
            subscription.Description = dto.Description;
            subscription.Price = dto.Price;
            subscription.Currency = dto.Currency;
            subscription.BillingCycle = dto.BillingCycle;
            subscription.StartDate = dto.StartDate;
            subscription.NextRenewalDate = dto.NextRenewalDate;
            subscription.AutoRenew = dto.AutoRenew;
            subscription.WebsiteUrl = dto.WebsiteUrl;
            subscription.Notes = dto.Notes;
            subscription.IsFavorite = dto.IsFavorite;
            subscription.Icon = dto.Icon;
            subscription.CategoryId = dto.CategoryId;
            subscription.PaymentMethodId = dto.PaymentMethodId;
            subscription.Status = dto.Status;

            // بنستبدل التاجز بالكامل بالقائمة الجديدة (أبسط من مقارنة الفروقات)
            if (dto.TagIds is not null)
            {
                subscription.Tags = await _unitOfWork.Tags.Query()
                    .Where(t => dto.TagIds.Contains(t.Id))
                    .ToListAsync();
            }

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var subscription = await _unitOfWork.Subscriptions.GetByIdAsync(id);
            if (subscription is null) return false;

            _unitOfWork.Subscriptions.Remove(subscription);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<SubscriptionDto?> DuplicateAsync(int id)
        {
            var original = await _unitOfWork.Subscriptions.GetByIdWithDetailsAsync(id);
            if (original is null) return null;

            var copy = new Subscription
            {
                // بنضيف "(نسخة)" لاسم الاشتراك عشان يبقى واضح إنه مكرر
                Name = $"{original.Name} (نسخة)",
                Description = original.Description,
                Price = original.Price,
                Currency = original.Currency,
                BillingCycle = original.BillingCycle,
                StartDate = original.StartDate,
                NextRenewalDate = original.NextRenewalDate,
                AutoRenew = original.AutoRenew,
                WebsiteUrl = original.WebsiteUrl,
                Notes = original.Notes,
                IsFavorite = false, // النسخة مبتورثش حالة المفضلة
                Icon = original.Icon,
                CategoryId = original.CategoryId,
                PaymentMethodId = original.PaymentMethodId,
                UserId = original.UserId,
                Status = SubscriptionStatus.Active,
                CreatedAt = DateTime.UtcNow,
                Tags = original.Tags.ToList()
            };

            await _unitOfWork.Subscriptions.AddAsync(copy);
            await _unitOfWork.SaveChangesAsync();

            var created = await _unitOfWork.Subscriptions.GetByIdWithDetailsAsync(copy.Id);
            return created!.ToDto();
        }

        public async Task<decimal> GetMonthlyTotalAsync(int userId)
        {
            var subscriptions = await _unitOfWork.Subscriptions.Query()
                .Where(s => s.UserId == userId && s.Status == SubscriptionStatus.Active)
                .ToListAsync();

            return subscriptions.Sum(s => BillingCycleHelper.ToMonthlyEquivalent(s.Price, s.BillingCycle));
        }
    }
}
