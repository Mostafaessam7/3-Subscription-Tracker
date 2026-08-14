using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Domain.Enums;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    public class AdminControllerTests : IClassFixture<CustomWebApplicationFactory>, IAsyncLifetime
    {
        private readonly HttpClient _client;
        private string _adminToken = string.Empty;

        public AdminControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        // بيتنفذ قبل كل Test - بيضمن إن فيه Admin واحد على الأقل جاهز نستخدمه (Bootstrap أول مرة،
        // أو Login لو Test تاني في نفس الكلاس بوتستراب قبل كده على نفس الـ DB المشتركة)
        public async Task InitializeAsync()
        {
            var (_, token) = await _client.BootstrapOrLoginAdminAsync();
            _adminToken = token;
        }

        public Task DisposeAsync() => Task.CompletedTask;

        [Fact]
        public async Task Bootstrap_WithWrongKey_ReturnsBadRequest()
        {
            var response = await _client.PostAsJsonAsync("/api/admin/bootstrap", new BootstrapAdminDto
            {
                BootstrapKey = "wrong-key",
                Name = "Hacker",
                Email = $"{Guid.NewGuid()}@example.com",
                Password = "Password123"
            });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Bootstrap_WhenAdminAlreadyExists_ReturnsBadRequest()
        {
            // InitializeAsync ضمن بالفعل إن فيه Admin - فمحاولة Bootstrap تانية لازم ترفض
            var response = await _client.PostAsJsonAsync("/api/admin/bootstrap", new BootstrapAdminDto
            {
                BootstrapKey = IntegrationTestHelpers.AdminBootstrapKey,
                Name = "Second Admin",
                Email = $"{Guid.NewGuid()}@example.com",
                Password = "Password123"
            });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task GetAllUsers_AsRegularUser_ReturnsForbidden()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync("/api/admin/users");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetAllUsers_AsAdmin_ReturnsOkWithUsers()
        {
            var (regularUserId, _) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(_adminToken);

            var response = await _client.GetAsync("/api/admin/users");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var users = await response.Content.ReadFromJsonAsync<List<AdminUserDto>>();
            Assert.Contains(users!, u => u.Id == regularUserId);
        }

        [Fact]
        public async Task GetStats_AsAdmin_ReturnsOk()
        {
            _client.AuthenticateAs(_adminToken);

            var response = await _client.GetAsync("/api/admin/stats");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var stats = await response.Content.ReadFromJsonAsync<SystemStatsDto>();
            Assert.NotNull(stats);
        }

        [Fact]
        public async Task UpdateUserRole_AsAdmin_PromotesUserToAdmin()
        {
            var (regularUserId, regularToken) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(_adminToken);

            var response = await _client.PutAsJsonAsync(
                $"/api/admin/users/{regularUserId}/role",
                new UpdateUserRoleDto { Role = UserRole.Admin });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            // ملحوظة: الـ Token القديم بتاع المستخدم متسجّل فيه الدور القديم (User) لغاية ما يعمل
            // Login تاني - الدور بيتحدّث في الـ DB فورًا، بس مش في التوكن الحالي (سلوك JWT طبيعي)
            _client.AuthenticateAs(_adminToken);
            var usersResponse = await _client.GetAsync("/api/admin/users");
            var users = await usersResponse.Content.ReadFromJsonAsync<List<AdminUserDto>>();
            Assert.Equal(UserRole.Admin, users!.First(u => u.Id == regularUserId).Role);
        }

        [Fact]
        public async Task UpdateUserRole_ForUnknownUser_ReturnsNotFound()
        {
            _client.AuthenticateAs(_adminToken);

            var response = await _client.PutAsJsonAsync(
                "/api/admin/users/999999/role",
                new UpdateUserRoleDto { Role = UserRole.Admin });

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
