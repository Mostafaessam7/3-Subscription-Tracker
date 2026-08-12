using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface IAdminService
    {
        Task<List<AdminUserDto>> GetAllUsersAsync();
        Task<SystemStatsDto> GetSystemStatsAsync();
        Task<bool> UpdateUserRoleAsync(int userId, UpdateUserRoleDto dto);
        Task<AuthResponseDto?> BootstrapFirstAdminAsync(BootstrapAdminDto dto);
    }
}
