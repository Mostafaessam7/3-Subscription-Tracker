using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Settings;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Services
{
    // ملحوظة معمارية: الكلاس ده بقى مايعرفش حاجة عن BCrypt ولا JWT بالتحديد -
    // بيتعامل بس مع IPasswordHasher و ITokenService (Interfaces)، والتنفيذ الفعلي التقني
    // (اختيار خوارزمية التشفير، تفاصيل توليد التوكن) موجود في طبقة Infrastructure
    public class AuthService : IAuthService
    {
        private static readonly TimeSpan ResetTokenLifetime = TimeSpan.FromHours(1);
        private static readonly TimeSpan EmailConfirmationTokenLifetime = TimeSpan.FromDays(3);

        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly FrontendSettings _frontendSettings;

        public AuthService(
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IEmailService emailService,
            IOptions<FrontendSettings> frontendSettings)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _emailService = emailService;
            _frontendSettings = frontendSettings.Value;
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
        {
            var emailExists = await _unitOfWork.Users.Query().AnyAsync(u => u.Email == dto.Email);
            if (emailExists) return null; // الإيميل مستخدم قبل كده

            var rawConfirmationToken = GenerateSecureToken();

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = _passwordHasher.Hash(dto.Password),
                CreatedAt = DateTime.UtcNow,
                EmailConfirmed = false,
                EmailConfirmationTokenHash = HashToken(rawConfirmationToken),
                EmailConfirmationTokenExpiresAt = DateTime.UtcNow.Add(EmailConfirmationTokenLifetime)
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            // Fire-and-forget عن قصد (زي ForgotPasswordAsync) - عشان مانستناش SMTP قبل ما نرجّع
            // للـ Frontend بالتوكن، ومنعًا لأي Timing Side-Channel
            var confirmLink = $"{_frontendSettings.BaseUrl.TrimEnd('/')}/confirm-email?token={Uri.EscapeDataString(rawConfirmationToken)}";
            _ = _emailService.SendEmailConfirmationAsync(user.Email, user.Name, confirmLink);

            return GenerateAuthResponse(user);
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email);
            if (user is null) return null;

            var validPassword = _passwordHasher.Verify(dto.Password, user.PasswordHash);
            if (!validPassword) return null;

            return GenerateAuthResponse(user);
        }

        public async Task ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email);
            // بنرجع من غير خطأ حتى لو الإيميل مش موجود - عشان محدش يقدر يستخدم الـ Endpoint ده
            // عشان يكتشف إيه الإيميلات المسجلة في النظام (User Enumeration)
            if (user is null) return;

            var rawToken = GenerateSecureToken();
            user.PasswordResetTokenHash = HashToken(rawToken);
            user.PasswordResetTokenExpiresAt = DateTime.UtcNow.Add(ResetTokenLifetime);

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var resetLink = $"{_frontendSettings.BaseUrl.TrimEnd('/')}/reset-password?token={Uri.EscapeDataString(rawToken)}";

            // من غير await هنا عن قصد: لو استنينا إرسال الإيميل فعليًا (اتصال SMTP ممكن ياخد
            // ثواني لغاية ما يفشل)، وقت رد الـ Endpoint هيبقى مختلف بشكل واضح بين إيميل موجود
            // (بينتظر الإرسال) وإيميل مش موجود (بيرجع فورًا) - ده Timing Side-Channel بيسرّب بالظبط
            // المعلومة اللي إحنا بنحاول نمنعها (إن الإيميل ده مسجل). EmailService بيمسك أي Exception
            // جواه ويسجّلها، فمفيش داعي نستنى نتيجته هنا.
            _ = _emailService.SendPasswordResetEmailAsync(user.Email, user.Name, resetLink);
        }

        public async Task<bool> ResetPasswordAsync(ResetPasswordDto dto)
        {
            var tokenHash = HashToken(dto.Token);
            var user = await _unitOfWork.Users.GetByPasswordResetTokenHashAsync(tokenHash);

            if (user is null || user.PasswordResetTokenExpiresAt is null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
                return false;

            user.PasswordHash = _passwordHasher.Hash(dto.NewPassword);
            // بنمسح التوكن فورًا بعد الاستخدام - عشان ميتعملش استخدام تاني بيه (One-Time Use)
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task<bool> ConfirmEmailAsync(ConfirmEmailDto dto)
        {
            var tokenHash = HashToken(dto.Token);
            var user = await _unitOfWork.Users.GetByEmailConfirmationTokenHashAsync(tokenHash);

            if (user is null || user.EmailConfirmationTokenExpiresAt is null || user.EmailConfirmationTokenExpiresAt < DateTime.UtcNow)
                return false;

            user.EmailConfirmed = true;
            // بنمسح التوكن فورًا بعد الاستخدام - عشان ميتعملش استخدام تاني بيه (One-Time Use)
            user.EmailConfirmationTokenHash = null;
            user.EmailConfirmationTokenExpiresAt = null;

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            return true;
        }

        public async Task ResendConfirmationAsync(ResendConfirmationDto dto)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email);
            // بنرجع من غير خطأ حتى لو الإيميل مش موجود أو متأكد بالفعل - منعًا لتسريب معلومة
            if (user is null || user.EmailConfirmed) return;

            var rawToken = GenerateSecureToken();
            user.EmailConfirmationTokenHash = HashToken(rawToken);
            user.EmailConfirmationTokenExpiresAt = DateTime.UtcNow.Add(EmailConfirmationTokenLifetime);

            _unitOfWork.Users.Update(user);
            await _unitOfWork.SaveChangesAsync();

            var confirmLink = $"{_frontendSettings.BaseUrl.TrimEnd('/')}/confirm-email?token={Uri.EscapeDataString(rawToken)}";
            _ = _emailService.SendEmailConfirmationAsync(user.Email, user.Name, confirmLink);
        }

        private static string GenerateSecureToken()
        {
            // 32 بايت عشوائية Cryptographically Secure، بصيغة URL-Safe عشان تتحط في Query String من غير مشاكل
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes)
                .Replace('+', '-')
                .Replace('/', '_')
                .TrimEnd('=');
        }

        private static string HashToken(string rawToken)
        {
            var bytes = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(rawToken));
            return Convert.ToHexString(bytes);
        }

        private AuthResponseDto GenerateAuthResponse(User user)
        {
            var (token, expiresAt) = _tokenService.GenerateToken(user);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                EmailConfirmed = user.EmailConfirmed,
                Token = token,
                ExpiresAt = expiresAt
            };
        }
    }
}
