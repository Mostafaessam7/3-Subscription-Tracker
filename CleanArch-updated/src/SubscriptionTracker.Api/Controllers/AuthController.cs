using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SubscriptionTracker.Api.Auth;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Api.Controllers
{
    // Rate Limiting على الكلاس كله - أربع Endpoints هنا (Register/Login/Forgot/Reset) كلهم
    // من غير [Authorize] وعرضة لمحاولات Brute-force أو إغراق (راجع تعريف "AuthEndpoints" في Program.cs)
    [ApiController]
    [Route("api/[controller]")]
    [EnableRateLimiting("AuthEndpoints")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IWebHostEnvironment _environment;

        public AuthController(IAuthService authService, IWebHostEnvironment environment)
        {
            _authService = authService;
            _environment = environment;
        }

        /// <summary>
        /// لو العميل طلب الـ Cookie Transport، بيحط التوكن في كوكي HttpOnly وبيشيله من الـ Body.
        /// رجوعه في الاتنين كان هيلغي الفايدة كلها — التوكن هيفضل مقروء من أي سكريبت على الصفحة.
        /// </summary>
        private ActionResult<AuthResponseDto> RespondWithSession(AuthResponseDto result)
        {
            if (!WebAuthCookies.UsesCookieTransport(Request) || string.IsNullOrEmpty(result.Token))
            {
                return Ok(result);
            }

            WebAuthCookies.Issue(Response, result.Token, result.ExpiresAt, _environment.IsDevelopment());

            // نسخة من نفس الـ DTO من غير التوكن. الباقي (الاسم، الدور، حالة تأكيد الإيميل) بيانات
            // عرض مش بيانات اعتماد، والفرونت اند محتاجها يرسم بيها الواجهة.
            return Ok(new AuthResponseDto
            {
                UserId = result.UserId,
                Name = result.Name,
                Email = result.Email,
                Role = result.Role,
                EmailConfirmed = result.EmailConfirmed,
                Token = string.Empty,
                ExpiresAt = result.ExpiresAt,
            });
        }

        // POST: api/auth/logout
        // موجود عشان الكوكي: قبل كده تسجيل الخروج كان بيحصل في الفرونت اند بس (مسح localStorage)،
        // لكن كوكي HttpOnly مش ممكن الفرونت اند يمسحها - لازم السيرفر يعملها.
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            WebAuthCookies.Clear(Response, _environment.IsDevelopment());

            return NoContent();
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result is null) return Conflict(new { message = "الإيميل ده مستخدم بالفعل" });
            return RespondWithSession(result);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result is null) return Unauthorized(new { message = "الإيميل أو كلمة السر غلط" });
            return RespondWithSession(result);
        }

        // POST: api/auth/forgot-password
        // بيرجع 200 دايمًا (حتى لو الإيميل مش موجود) عشان محدش يقدر يكتشف الإيميلات المسجلة في النظام
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto dto)
        {
            await _authService.ForgotPasswordAsync(dto);
            return Ok(new { message = "لو الإيميل ده مسجل عندنا، هيوصلك لينك إعادة تعيين كلمة السر" });
        }

        // POST: api/auth/reset-password
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto dto)
        {
            var success = await _authService.ResetPasswordAsync(dto);
            if (!success) return BadRequest(new { message = "لينك إعادة التعيين غلط أو منتهي الصلاحية" });
            return Ok(new { message = "تم تغيير كلمة السر بنجاح" });
        }

        // POST: api/auth/confirm-email
        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto dto)
        {
            var success = await _authService.ConfirmEmailAsync(dto);
            if (!success) return BadRequest(new { message = "لينك التأكيد غلط أو منتهي الصلاحية" });
            return Ok(new { message = "تم تأكيد الإيميل بنجاح" });
        }

        // POST: api/auth/resend-confirmation
        // بيرجع 200 دايمًا (حتى لو الإيميل مش موجود أو متأكد بالفعل) عشان محدش يقدر يكتشف
        // الإيميلات المسجلة في النظام
        [HttpPost("resend-confirmation")]
        public async Task<IActionResult> ResendConfirmation(ResendConfirmationDto dto)
        {
            await _authService.ResendConfirmationAsync(dto);
            return Ok(new { message = "لو الإيميل ده مسجل ومحتاج تأكيد، هيوصلك لينك تأكيد جديد" });
        }
    }
}
