using Microsoft.AspNetCore.Mvc;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        // POST: api/auth/register
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result is null) return Conflict(new { message = "الإيميل ده مستخدم بالفعل" });
            return Ok(result);
        }

        // POST: api/auth/login
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result is null) return Unauthorized(new { message = "الإيميل أو كلمة السر غلط" });
            return Ok(result);
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
    }
}
