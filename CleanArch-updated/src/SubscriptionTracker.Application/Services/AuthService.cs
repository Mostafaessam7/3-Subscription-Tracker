using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Services
{
    // ملحوظة معمارية: الكلاس ده بقى مايعرفش حاجة عن BCrypt ولا JWT بالتحديد -
    // بيتعامل بس مع IPasswordHasher و ITokenService (Interfaces)، والتنفيذ الفعلي التقني
    // (اختيار خوارزمية التشفير، تفاصيل توليد التوكن) موجود في طبقة Infrastructure
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;

        public AuthService(IUnitOfWork unitOfWork, IPasswordHasher passwordHasher, ITokenService tokenService)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
        }

        public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
        {
            var emailExists = await _unitOfWork.Users.Query().AnyAsync(u => u.Email == dto.Email);
            if (emailExists) return null; // الإيميل مستخدم قبل كده

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = _passwordHasher.Hash(dto.Password),
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(user);
            await _unitOfWork.SaveChangesAsync();

            return GenerateAuthResponse(user);
        }

        public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(dto.Email);
            if (user is null) return null;

            var validPassword = _passwordHasher.Verify(dto.Password, user.PasswordHash);
            if (!validPassword) return null;

            return GenerateAuthResponse(user);
        }

        private AuthResponseDto GenerateAuthResponse(User user)
        {
            var (token, expiresAt) = _tokenService.GenerateToken(user);

            return new AuthResponseDto
            {
                UserId = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role,
                Token = token,
                ExpiresAt = expiresAt
            };
        }
    }
}
