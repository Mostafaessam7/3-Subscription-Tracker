using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        // POST: api/admin/bootstrap
        // ⚠️ الـ Endpoint الوحيد هنا اللي من غير [Authorize] - لأنه بيتستخدم عشان تعمل أول Admin
        // من الأساس (قبل ما يكون عندك أي حساب Admin تسجّل دخول بيه). بيرفض يشتغل لو فيه Admin بالفعل.
        [HttpPost("bootstrap")]
        public async Task<ActionResult<AuthResponseDto>> Bootstrap(BootstrapAdminDto dto)
        {
            var result = await _adminService.BootstrapFirstAdminAsync(dto);
            if (result is null)
            {
                return BadRequest(new { message = "فشل إنشاء أول Admin - إما المفتاح غلط، أو فيه Admin موجود بالفعل، أو الإيميل مستخدم" });
            }
            return Ok(result);
        }

        // كل الـ Endpoints تحت دي محتاجة يكون المستخدم مسجّل دخول بدور Admin بالظبط
        [Authorize(Roles = "Admin")]
        [HttpGet("users")]
        public async Task<ActionResult<List<AdminUserDto>>> GetAllUsers()
        {
            return Ok(await _adminService.GetAllUsersAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("stats")]
        public async Task<ActionResult<SystemStatsDto>> GetStats()
        {
            return Ok(await _adminService.GetSystemStatsAsync());
        }

        [Authorize(Roles = "Admin")]
        [HttpPut("users/{userId}/role")]
        public async Task<IActionResult> UpdateUserRole(int userId, UpdateUserRoleDto dto)
        {
            var success = await _adminService.UpdateUserRoleAsync(userId, dto);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
