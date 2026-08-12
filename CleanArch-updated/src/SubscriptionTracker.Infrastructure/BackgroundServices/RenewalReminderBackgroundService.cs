using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Infrastructure.BackgroundServices
{
    // Background Service بيشتغل طول عمر التطبيق، وبيعمل الفحص مرة كل فترة زمنية محددة
    public class RenewalReminderBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RenewalReminderBackgroundService> _logger;

        // كل قد إيه بيتكرر الفحص (24 ساعة في الإنتاج، تقدر تقلله وقت التجربة)
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(24);

        // هيبعت تنبيه لو الاشتراك هيتجدد خلال عدد الأيام دول
        private const int ReminderThresholdDays = 3;

        public RenewalReminderBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<RenewalReminderBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndSendRemindersAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "حصل خطأ أثناء فحص تنبيهات التجديد");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task CheckAndSendRemindersAsync(CancellationToken stoppingToken)
        {
            // بنعمل Scope جديد لأن BackgroundService بيعيش طول عمر التطبيق،
            // بينما الـ UnitOfWork (وبداخله الـ DbContext) المفروض يتعمله Dispose بعد كل استخدام
            using var scope = _scopeFactory.CreateScope();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            var thresholdDate = DateTime.UtcNow.Date.AddDays(ReminderThresholdDays);

            var subscriptionsDueForReminder = await unitOfWork.Subscriptions.Query()
                .Include(s => s.User)
                .Where(s => s.Status == SubscriptionStatus.Active
                    && s.NextRenewalDate.Date <= thresholdDate
                    && s.NextRenewalDate.Date >= DateTime.UtcNow.Date
                    // منبعتش تنبيه تاني لو بعتنا واحد خلال آخر يوم
                    && (s.LastReminderSentAt == null || s.LastReminderSentAt < DateTime.UtcNow.AddDays(-1)))
                .ToListAsync(stoppingToken);

            _logger.LogInformation("لقينا {Count} اشتراك محتاج تنبيه", subscriptionsDueForReminder.Count);

            foreach (var subscription in subscriptionsDueForReminder)
            {
                if (subscription.User is null) continue;

                await emailService.SendRenewalReminderAsync(
                    subscription.User.Email,
                    subscription.User.Name,
                    subscription.Name,
                    subscription.Price,
                    subscription.NextRenewalDate);

                subscription.LastReminderSentAt = DateTime.UtcNow;
            }

            await unitOfWork.SaveChangesAsync();
        }
    }
}
