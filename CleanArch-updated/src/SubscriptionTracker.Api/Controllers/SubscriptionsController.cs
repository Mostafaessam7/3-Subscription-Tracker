using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class SubscriptionsController : ApiControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;

        public SubscriptionsController(ISubscriptionService subscriptionService)
        {
            _subscriptionService = subscriptionService;
        }

        // GET: api/subscriptions/user/5?search=netflix&status=Active&billingCycle=Monthly&categoryId=1&tagId=2&onlyFavorites=true&sortBy=Cost&sortDescending=true
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<SubscriptionDto>>> GetAllForUser(
            int userId,
            [FromQuery] string? search = null,
            [FromQuery] SubscriptionStatus? status = null,
            [FromQuery] BillingCycle? billingCycle = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? tagId = null,
            [FromQuery] bool? onlyFavorites = null,
            [FromQuery] DateTime? renewalFrom = null,
            [FromQuery] DateTime? renewalTo = null,
            [FromQuery] SubscriptionSortBy sortBy = SubscriptionSortBy.RenewalDate,
            [FromQuery] bool sortDescending = false)
        {
            // بدون الفحص ده، أي مستخدم مسجّل دخول كان يقدر يغيّر userId في الرابط ويشوف اشتراكات حد تاني!
            if (!CanAccessUser(userId)) return Forbid();

            var options = new SubscriptionQueryOptions
            {
                Search = search,
                Status = status,
                BillingCycle = billingCycle,
                CategoryId = categoryId,
                TagId = tagId,
                OnlyFavorites = onlyFavorites,
                RenewalFrom = renewalFrom,
                RenewalTo = renewalTo,
                SortBy = sortBy,
                SortDescending = sortDescending
            };

            var subscriptions = await _subscriptionService.GetAllForUserAsync(userId, options);
            return Ok(subscriptions);
        }

        // GET: api/subscriptions/3
        [HttpGet("{id}")]
        public async Task<ActionResult<SubscriptionDto>> GetById(int id)
        {
            var subscription = await _subscriptionService.GetByIdAsync(id);
            if (subscription is null) return NotFound();
            if (!CanAccessUser(subscription.UserId)) return Forbid();
            return Ok(subscription);
        }

        // POST: api/subscriptions
        [HttpPost]
        public async Task<ActionResult<SubscriptionDto>> Create(CreateSubscriptionDto dto)
        {
            // من غير الفحص ده، مستخدم كان يقدر يبعت UserId بتاع حد تاني في جسم الطلب ويضيفله اشتراك!
            if (!CanAccessUser(dto.UserId)) return Forbid();

            var created = await _subscriptionService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        // PUT: api/subscriptions/3
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateSubscriptionDto dto)
        {
            var existing = await _subscriptionService.GetByIdAsync(id);
            if (existing is null) return NotFound();
            if (!CanAccessUser(existing.UserId)) return Forbid();

            var success = await _subscriptionService.UpdateAsync(id, dto);
            if (!success) return NotFound();
            return NoContent();
        }

        // DELETE: api/subscriptions/3
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _subscriptionService.GetByIdAsync(id);
            if (existing is null) return NotFound();
            if (!CanAccessUser(existing.UserId)) return Forbid();

            var success = await _subscriptionService.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        // POST: api/subscriptions/3/duplicate
        [HttpPost("{id}/duplicate")]
        public async Task<ActionResult<SubscriptionDto>> Duplicate(int id)
        {
            var existing = await _subscriptionService.GetByIdAsync(id);
            if (existing is null) return NotFound();
            if (!CanAccessUser(existing.UserId)) return Forbid();

            var duplicated = await _subscriptionService.DuplicateAsync(id);
            if (duplicated is null) return NotFound();
            return CreatedAtAction(nameof(GetById), new { id = duplicated.Id }, duplicated);
        }

        // GET: api/subscriptions/user/5/monthly-total
        [HttpGet("user/{userId}/monthly-total")]
        public async Task<ActionResult<decimal>> GetMonthlyTotal(int userId)
        {
            if (!CanAccessUser(userId)) return Forbid();

            var total = await _subscriptionService.GetMonthlyTotalAsync(userId);
            return Ok(total);
        }
    }
}
