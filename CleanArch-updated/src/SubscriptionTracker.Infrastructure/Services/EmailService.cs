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

            await SendAsync(toEmail, subject, body, $"تنبيه تجديد لـ {toEmail} عن اشتراك {subscriptionName}");
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string userName, string resetLink)
        {
            var subject = "طلب إعادة تعيين كلمة السر";
            var body = $@"
                <div style='font-family: Segoe UI, Tahoma, sans-serif; direction: rtl;'>
                    <p>أهلاً {userName}،</p>
                    <p>وصلنا طلب لإعادة تعيين كلمة السر بتاعة حسابك. اضغط على اللينك ده عشان تعمل كلمة سر جديدة
                    (اللينك صالح لمدة ساعة واحدة بس):</p>
                    <p><a href='{resetLink}'>{resetLink}</a></p>
                    <p>لو انت مطلبتش الحاجة دي، تجاهل الإيميل ده وكلمة السر هتفضل زي ما هي.</p>
                </div>";

            await SendAsync(toEmail, subject, body, $"إيميل إعادة تعيين كلمة السر لـ {toEmail}");
        }

        private async Task SendAsync(string toEmail, string subject, string htmlBody, string successLogContext)
        {
            using var message = new MailMessage
            {
                From = new MailAddress(_emailSettings.FromAddress, _emailSettings.FromName),
                Subject = subject,
                Body = htmlBody,
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
                _logger.LogInformation("تم إرسال {Context}", successLogContext);
            }
            catch (Exception ex)
            {
                // ما بنوقفش العملية كلها لو إيميل واحد فشل، بس بنسجل الخطأ
                _logger.LogError(ex, "فشل إرسال إيميل لـ {Email}", toEmail);
            }
        }
    }
}
