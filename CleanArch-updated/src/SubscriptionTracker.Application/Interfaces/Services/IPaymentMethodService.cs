using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface IPaymentMethodService
    {
        Task<List<PaymentMethodDto>> GetAllAsync();
        Task<PaymentMethodDto?> GetByIdAsync(int id);
        Task<PaymentMethodDto> CreateAsync(CreatePaymentMethodDto dto);
        Task<bool> UpdateAsync(int id, UpdatePaymentMethodDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
