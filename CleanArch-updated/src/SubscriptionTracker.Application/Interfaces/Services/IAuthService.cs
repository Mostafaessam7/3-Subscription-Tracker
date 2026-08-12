using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
        Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    }
}
