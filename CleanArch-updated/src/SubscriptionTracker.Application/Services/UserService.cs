using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Mapping;

namespace SubscriptionTracker.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;

        public UserService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
        }

        public async Task<ProfileDto?> GetByIdAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            return user?.ToDto();
        }

        public async Task<ProfileDto?> UpdateProfileAsync(int id, UpdateProfileDto dto)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user is null) return null;

            user.Name = dto.Name;
            await _unitOfWork.SaveChangesAsync();

            return user.ToDto();
        }

        public async Task<(bool Success, string? ErrorMessage)> ChangePasswordAsync(int id, ChangePasswordDto dto)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user is null) return (false, "المستخدم مش موجود");

            var isCurrentPasswordValid = _passwordHasher.Verify(dto.CurrentPassword, user.PasswordHash);
            if (!isCurrentPasswordValid)
            {
                return (false, "كلمة السر الحالية غلط");
            }

            user.PasswordHash = _passwordHasher.Hash(dto.NewPassword);
            await _unitOfWork.SaveChangesAsync();

            return (true, null);
        }

        public async Task<BudgetDto?> GetBudgetAsync(int id)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user is null) return null;

            return new BudgetDto { MonthlyBudget = user.MonthlyBudget };
        }

        public async Task<BudgetDto?> UpdateBudgetAsync(int id, UpdateBudgetDto dto)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(id);
            if (user is null) return null;

            user.MonthlyBudget = dto.MonthlyBudget;
            await _unitOfWork.SaveChangesAsync();

            return new BudgetDto { MonthlyBudget = user.MonthlyBudget };
        }
    }
}
