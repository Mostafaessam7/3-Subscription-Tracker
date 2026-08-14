namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task SendRenewalReminderAsync(string toEmail, string userName, string subscriptionName, decimal price, DateTime renewalDate);
        Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink);
    }
}
