using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Services;

namespace SubscriptionTracker.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentMethodsController : ControllerBase
    {
        private readonly IPaymentMethodService _paymentMethodService;

        public PaymentMethodsController(IPaymentMethodService paymentMethodService)
        {
            _paymentMethodService = paymentMethodService;
        }

        [HttpGet]
        public async Task<ActionResult<List<PaymentMethodDto>>> GetAll()
        {
            return Ok(await _paymentMethodService.GetAllAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PaymentMethodDto>> GetById(int id)
        {
            var method = await _paymentMethodService.GetByIdAsync(id);
            if (method is null) return NotFound();
            return Ok(method);
        }

        [HttpPost]
        public async Task<ActionResult<PaymentMethodDto>> Create(CreatePaymentMethodDto dto)
        {
            var created = await _paymentMethodService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdatePaymentMethodDto dto)
        {
            var success = await _paymentMethodService.UpdateAsync(id, dto);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _paymentMethodService.DeleteAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
