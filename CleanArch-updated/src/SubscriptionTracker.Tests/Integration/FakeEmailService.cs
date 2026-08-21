using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Tests.Integration
{
    // بديل لـ EmailService الحقيقي في الـ Integration Tests - بيسجّل آخر إيميل اتبعت بدل ما يحاول
    // يتصل بـ SMTP حقيقي (اللي هيفشل دايمًا بإعدادات appsettings.json الافتراضية وقت الاختبار)
    public class FakeEmailService : IEmailService
    {
        public string? LastPasswordResetLink { get; private set; }
        public string? LastPasswordResetToEmail { get; private set; }
        public string? LastEmailConfirmationLink { get; private set; }
        public string? LastEmailConfirmationToEmail { get; private set; }

        public Task SendRenewalReminderAsync(string toEmail, string userName, string subscriptionName, decimal price, DateTime renewalDate)
        {
            return Task.CompletedTask;
        }

        public Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
        {
            LastPasswordResetToEmail = toEmail;
            LastPasswordResetLink = resetLink;
            return Task.CompletedTask;
        }

        public Task SendEmailConfirmationAsync(string toEmail, string userName, string confirmLink)
        {
            LastEmailConfirmationToEmail = toEmail;
            LastEmailConfirmationLink = confirmLink;
            return Task.CompletedTask;
        }
    }
}
