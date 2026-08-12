using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ApiControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // ⚠️ ملحوظة: GET api/users (كل المستخدمين) اتشالت من هنا نهائيًا - كانت متاحة لأي مستخدم
        // مسجّل دخول قبل كده (ثغرة أمنية حقيقية!). البديل الصح دلوقتي: GET /api/admin/users
        // (محتاج دور Admin بالظبط، وفيه إحصائيات إضافية مفيدة للأدمن أصلًا)

        // GET: api/users/2
        [HttpGet("{id}")]
        public async Task<ActionResult<ProfileDto>> GetById(int id)
        {
            if (!CanAccessUser(id)) return Forbid();

            var user = await _userService.GetByIdAsync(id);
            if (user is null) return NotFound();
            return Ok(user);
        }
        // ملحوظة: إنشاء مستخدم جديد بقى بيتم عن طريق POST /api/auth/register

        // PUT: api/users/2 - تعديل الاسم بس
        [HttpPut("{id}")]
        public async Task<ActionResult<ProfileDto>> UpdateProfile(int id, UpdateProfileDto dto)
        {
            if (!CanAccessUser(id)) return Forbid();

            var profile = await _userService.UpdateProfileAsync(id, dto);
            if (profile is null) return NotFound();
            return Ok(profile);
        }

        // PUT: api/users/2/password
        [HttpPut("{id}/password")]
        public async Task<IActionResult> ChangePassword(int id, ChangePasswordDto dto)
        {
            // مقصودة إنها CurrentUserId بس هنا (مش CanAccessUser) - حتى الأدمن مايقدرش يغيّر
            // كلمة سر حد تاني من غير ما يعرفها؛ ده إجراء حساس بيخص صاحب الحساب هو بس
            if (CurrentUserId != id) return Forbid();

            var (success, error) = await _userService.ChangePasswordAsync(id, dto);
            if (!success) return BadRequest(new { message = error });
            return NoContent();
        }

        // GET: api/users/2/budget
        [HttpGet("{id}/budget")]
        public async Task<ActionResult<BudgetDto>> GetBudget(int id)
        {
            if (!CanAccessUser(id)) return Forbid();

            var budget = await _userService.GetBudgetAsync(id);
            if (budget is null) return NotFound();
            return Ok(budget);
        }

        // PUT: api/users/2/budget
        [HttpPut("{id}/budget")]
        public async Task<ActionResult<BudgetDto>> UpdateBudget(int id, UpdateBudgetDto dto)
        {
            if (!CanAccessUser(id)) return Forbid();

            var budget = await _userService.UpdateBudgetAsync(id, dto);
            if (budget is null) return NotFound();
            return Ok(budget);
        }
    }
}
