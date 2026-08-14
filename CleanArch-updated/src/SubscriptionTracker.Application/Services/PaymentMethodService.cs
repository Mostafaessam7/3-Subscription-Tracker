using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Mapping;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Services
{
    public class PaymentMethodService : IPaymentMethodService
    {
        private readonly IUnitOfWork _unitOfWork;

        public PaymentMethodService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<PaymentMethodDto>> GetAllAsync()
        {
            var methods = await _unitOfWork.PaymentMethods.Query()
                .OrderBy(p => p.Name)
                .ToListAsync();

            return methods.ToDtoList();
        }

        public async Task<PaymentMethodDto?> GetByIdAsync(int id)
        {
            var method = await _unitOfWork.PaymentMethods.GetByIdAsync(id);
            return method?.ToDto();
        }

        public async Task<PaymentMethodDto> CreateAsync(CreatePaymentMethodDto dto)
        {
            var method = new PaymentMethod { Name = dto.Name, Type = dto.Type };

            await _unitOfWork.PaymentMethods.AddAsync(method);
            await _unitOfWork.SaveChangesAsync();

            return method.ToDto();
        }

        public async Task<bool> UpdateAsync(int id, UpdatePaymentMethodDto dto)
        {
            var method = await _unitOfWork.PaymentMethods.GetByIdAsync(id);
            if (method is null) return false;

            method.Name = dto.Name;
            method.Type = dto.Type;

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var method = await _unitOfWork.PaymentMethods.GetByIdAsync(id);
            if (method is null) return false;

            _unitOfWork.PaymentMethods.Remove(method);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}
