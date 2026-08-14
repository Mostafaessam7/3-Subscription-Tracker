using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    public class UsersControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public UsersControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task GetById_ForAnotherUser_ReturnsForbidden()
        {
            var (otherUserId, _) = await _client.RegisterUserAsync();
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/users/{otherUserId}");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetById_ForOwnUser_ReturnsProfile()
        {
            var (userId, token) = await _client.RegisterUserAsync("Mostafa");
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/users/{userId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var profile = await response.Content.ReadFromJsonAsync<ProfileDto>();
            Assert.Equal("Mostafa", profile!.Name);
        }

        [Fact]
        public async Task UpdateProfile_ForOwnUser_UpdatesName()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.PutAsJsonAsync($"/api/users/{userId}", new UpdateProfileDto { Name = "اسم جديد" });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var profile = await response.Content.ReadFromJsonAsync<ProfileDto>();
            Assert.Equal("اسم جديد", profile!.Name);
        }

        [Fact]
        public async Task ChangePassword_WithWrongCurrentPassword_ReturnsBadRequest()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.PutAsJsonAsync(
                $"/api/users/{userId}/password",
                new ChangePasswordDto { CurrentPassword = "WrongPassword", NewPassword = "NewPassword456" });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task ChangePassword_WithCorrectCurrentPassword_ReturnsNoContent()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.PutAsJsonAsync(
                $"/api/users/{userId}/password",
                new ChangePasswordDto { CurrentPassword = "Password123", NewPassword = "NewPassword456" });

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task GetBudget_ThenUpdateBudget_ForOwnUser_Works()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var getResponse = await _client.GetAsync($"/api/users/{userId}/budget");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
            var initial = await getResponse.Content.ReadFromJsonAsync<BudgetDto>();
            Assert.Null(initial!.MonthlyBudget);

            var updateResponse = await _client.PutAsJsonAsync($"/api/users/{userId}/budget", new UpdateBudgetDto { MonthlyBudget = 1500 });
            Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
            var updated = await updateResponse.Content.ReadFromJsonAsync<BudgetDto>();
            Assert.Equal(1500, updated!.MonthlyBudget);
        }

        [Fact]
        public async Task GetBudget_ForAnotherUser_ReturnsForbidden()
        {
            var (otherUserId, _) = await _client.RegisterUserAsync();
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/users/{otherUserId}/budget");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }
}
