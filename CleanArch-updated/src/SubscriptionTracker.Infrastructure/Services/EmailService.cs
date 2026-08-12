using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Settings;

namespace SubscriptionTracker.Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendRenewalReminderAsync(string toEmail, string userName, string subscriptionName, decimal price, DateTime renewalDate)
        {
            var subject = $"تنبيه: {subscriptionName} هيتجدد قريب";
            var body = $@"
                <div style='font-family: Segoe UI, Tahoma, sans-serif; direction: rtl;'>
                    <p>أهلاً {userName}،</p>
                    <p>اشتراكك في <strong>{subscriptionName}</strong> هيتجدد في تاريخ
                    <strong>{renewalDate:yyyy-MM-dd}</strong> بمبلغ <strong>{price} ج.م</strong>.</p>
                    <p>لو حابب تلغي الاشتراك قبل التجديد، ده الوقت المناسب.</p>
                </div>";

            using var message = new MailMessage
            {
                From = new MailAddress(_emailSettings.FromAddress, _emailSettings.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            message.To.Add(toEmail);

            using var client = new SmtpClient(_emailSettings.SmtpHost, _emailSettings.SmtpPort)
            {
                Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
                EnableSsl = true
            };

            try
            {
                await client.SendMailAsync(message);
                _logger.LogInformation("تم إرسال تنبيه تجديد لـ {Email} عن اشتراك {Subscription}", toEmail, subscriptionName);
            }
            catch (Exception ex)
            {
                // ما بنوقفش العملية كلها لو إيميل واحد فشل، بس بنسجل الخطأ
                _logger.LogError(ex, "فشل إرسال تنبيه لـ {Email}", toEmail);
            }
        }
    }
}
