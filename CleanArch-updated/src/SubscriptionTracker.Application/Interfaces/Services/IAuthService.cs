using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto?> LoginAsync(LoginDto dto);

        // بيرجع دايمًا من غير ما يوضح لو الإيميل موجود أو لأ (منعًا لتسريب معلومة إن الإيميل ده مسجل)
        Task ForgotPasswordAsync(ForgotPasswordDto dto);

        // بيرجع false لو التوكن غلط/منتهي، عشان الـ Controller يرجّع 400 مناسب
        Task<bool> ResetPasswordAsync(ResetPasswordDto dto);

        // بيرجع false لو التوكن غلط/منتهي
        Task<bool> ConfirmEmailAsync(ConfirmEmailDto dto);

        // زي ForgotPasswordAsync - بيرجع دايمًا من غير ما يوضح لو الإيميل موجود/متأكد بالفعل
        Task ResendConfirmationAsync(ResendConfirmationDto dto);
    }
}
