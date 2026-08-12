using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    // بديل الاستخدام المباشر لـ AppDbContext في UsersController القديم
    // ملحوظة: جلب كل المستخدمين دفعة واحدة بقى مسؤولية IAdminService.GetAllUsersAsync بس (Admin-only)
    public interface IUserService
    {
        Task<ProfileDto?> GetByIdAsync(int id);
        Task<ProfileDto?> UpdateProfileAsync(int id, UpdateProfileDto dto);
        Task<(bool Success, string? ErrorMessage)> ChangePasswordAsync(int id, ChangePasswordDto dto);
        Task<BudgetDto?> GetBudgetAsync(int id);
        Task<BudgetDto?> UpdateBudgetAsync(int id, UpdateBudgetDto dto);
    }
}
