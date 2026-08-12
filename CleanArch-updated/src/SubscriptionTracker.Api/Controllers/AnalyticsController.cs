using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ApiControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        // GET: api/analytics/spending-by-category/5
        [HttpGet("spending-by-category/{userId}")]
        public async Task<ActionResult<List<CategorySpendingDto>>> GetSpendingByCategory(int userId)
        {
            if (!CanAccessUser(userId)) return Forbid();
            return Ok(await _analyticsService.GetSpendingByCategoryAsync(userId));
        }

        // GET: api/analytics/insights/5
        [HttpGet("insights/{userId}")]
        public async Task<ActionResult<AnalyticsInsightsDto>> GetInsights(int userId)
        {
            if (!CanAccessUser(userId)) return Forbid();
            return Ok(await _analyticsService.GetInsightsAsync(userId));
        }
    }
}
