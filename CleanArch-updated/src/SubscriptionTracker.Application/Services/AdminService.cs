using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Settings;
using SubscriptionTracker.Domain.Common;
using SubscriptionTracker.Domain.Entities;
using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Application.Services
{
    public class AdminService : IAdminService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly ITokenService _tokenService;
        private readonly AdminSettings _adminSettings;

        public AdminService(
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            ITokenService tokenService,
            IOptions<AdminSettings> adminSettings)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _tokenService = tokenService;
            _adminSettings = adminSettings.Value;
        }

        public async Task<List<AdminUserDto>> GetAllUsersAsync()
        {
            var users = await _unitOfWork.Users.Query().ToListAsync();
            var subscriptions = await _unitOfWork.Subscriptions.Query()
                .Where(s => s.Status == SubscriptionStatus.Active)
                .ToListAsync();

            return users.Select(u =>
            {
                var userSubscriptions = subscriptions.Where(s => s.UserId == u.Id).ToList();
                return new AdminUserDto
                {
                    Id = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Role = u.Role,
                    CreatedAt = u.CreatedAt,
                    SubscriptionsCount = userSubscriptions.Count,
                    MonthlySpend = userSubscriptions.Sum(s => BillingCycleHelper.ToMonthlyEquivalent(s.Price, s.BillingCycle))
                };
            })
            .OrderByDescending(u => u.CreatedAt)
            .ToList();
        }

        public async Task<SystemStatsDto> GetSystemStatsAsync()
        {
            var users = await _unitOfWork.Users.Query().ToListAsync();
            var activeSubscriptions = await _unitOfWork.Subscriptions.Query()
                .Where(s => s.Status == SubscriptionStatus.Active)
                .ToListAsync();

            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);

            return new SystemStatsDto
            {
                TotalUsers = users.Count,
                TotalActiveSubscriptions = activeSubscriptions.Count,
                TotalMonthlySpendAcrossAllUsers = activeSubscriptions.Sum(s => BillingCycleHelper.ToMonthlyEquivalent(s.Price, s.BillingCycle)),
                NewUsersLast30Days = users.Count(u => u.CreatedAt >= thirtyDaysAgo)
            };
        }

        public async Task<bool> UpdateUserRoleAsync(int userId, UpdateUserRoleDto dto)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId);
            if (user is null) return false;

            user.Role = dto.Role;
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<AuthResponseDto?> BootstrapFirstAdminAsync(BootstrapAdminDto dto)
        {
            // شرط أساسي: الـ Endpoint ده مبيشتغلش إلا لو المفتاح السري في الطلب مطابق للمفتاح في appsettings.json
            if (string.IsNullOrWhiteSpace(_adminSettings.BootstrapKey) || dto.BootstrapKey != _adminSettings.BootstrapKey)
            {
                return null;
            }

            // وشرط تاني أهم: مبيشتغلش خالص لو أصلاً فيه Admin موجود في النظام - عشان محدش يقدر
            // يستخدمه تاني بعد أول مرة حتى لو عرف المفتاح بطريقة ما
            var adminAlreadyExists = await _unitOfWork.Users.Query().AnyAsync(u => u.Role == UserRole.Admin);
            if (adminAlreadyExists)
            {
                return null;
            }

            var emailExists = await _unitOfWork.Users.Query().AnyAsync(u => u.Email == dto.Email);
            if (emailExists)
            {
                return null;
            }

            var admin = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                PasswordHash = _passwordHasher.Hash(dto.Password),
                Role = UserRole.Admin,
                CreatedAt = DateTime.UtcNow
            };

            await _unitOfWork.Users.AddAsync(admin);
            await _unitOfWork.SaveChangesAsync();

            var (token, expiresAt) = _tokenService.GenerateToken(admin);

            return new AuthResponseDto
            {
                UserId = admin.Id,
                Name = admin.Name,
                Email = admin.Email,
                Role = admin.Role,
                Token = token,
                ExpiresAt = expiresAt
            };
        }
    }
}
