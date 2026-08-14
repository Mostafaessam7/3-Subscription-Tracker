using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Domain.Enums;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    public class SubscriptionsControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public SubscriptionsControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task GetAllForUser_WithoutToken_ReturnsUnauthorized()
        {
            var response = await _client.GetAsync("/api/subscriptions/user/1");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Create_ForOwnUser_ReturnsCreated()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.PostAsJsonAsync("/api/subscriptions", BuildDto(userId));

            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var created = await response.Content.ReadFromJsonAsync<SubscriptionDto>();
            Assert.Equal(userId, created!.UserId);
        }

        [Fact]
        public async Task Create_ForAnotherUser_ReturnsForbidden()
        {
            // الثغرة اللي اتصلحت: مستخدم كان يقدر يبعت UserId بتاع حد تاني في جسم الطلب
            var (_, token) = await _client.RegisterUserAsync();
            var (otherUserId, _) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.PostAsJsonAsync("/api/subscriptions", BuildDto(otherUserId));

            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetById_ForAnotherUsersSubscription_ReturnsForbidden()
        {
            var (ownerId, ownerToken) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(ownerToken);
            var createResponse = await _client.PostAsJsonAsync("/api/subscriptions", BuildDto(ownerId));
            var created = await createResponse.Content.ReadFromJsonAsync<SubscriptionDto>();

            var (_, otherToken) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(otherToken);

            var response = await _client.GetAsync($"/api/subscriptions/{created!.Id}");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetById_UnknownId_ReturnsNotFound()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync("/api/subscriptions/999999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Update_OwnSubscription_ReturnsNoContent()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);
            var createResponse = await _client.PostAsJsonAsync("/api/subscriptions", BuildDto(userId));
            var created = await createResponse.Content.ReadFromJsonAsync<SubscriptionDto>();

            var updateDto = new UpdateSubscriptionDto
            {
                Name = "Netflix Premium",
                Price = 250,
                Currency = Currency.EGP,
                BillingCycle = BillingCycle.Monthly,
                NextRenewalDate = DateTime.UtcNow.AddMonths(1),
                AutoRenew = true,
                IsFavorite = false,
                Status = SubscriptionStatus.Active
            };

            var response = await _client.PutAsJsonAsync($"/api/subscriptions/{created!.Id}", updateDto);
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task Delete_AnotherUsersSubscription_ReturnsForbiddenAndDoesNotDelete()
        {
            var (ownerId, ownerToken) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(ownerToken);
            var createResponse = await _client.PostAsJsonAsync("/api/subscriptions", BuildDto(ownerId));
            var created = await createResponse.Content.ReadFromJsonAsync<SubscriptionDto>();

            var (_, otherToken) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(otherToken);
            var deleteResponse = await _client.DeleteAsync($"/api/subscriptions/{created!.Id}");
            Assert.Equal(HttpStatusCode.Forbidden, deleteResponse.StatusCode);

            _client.AuthenticateAs(ownerToken);
            var getResponse = await _client.GetAsync($"/api/subscriptions/{created.Id}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        }

        [Fact]
        public async Task Duplicate_OwnSubscription_ReturnsNewCreatedSubscription()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);
            var createResponse = await _client.PostAsJsonAsync("/api/subscriptions", BuildDto(userId));
            var created = await createResponse.Content.ReadFromJsonAsync<SubscriptionDto>();

            var duplicateResponse = await _client.PostAsync($"/api/subscriptions/{created!.Id}/duplicate", null);

            Assert.Equal(HttpStatusCode.Created, duplicateResponse.StatusCode);
            var duplicated = await duplicateResponse.Content.ReadFromJsonAsync<SubscriptionDto>();
            Assert.NotEqual(created.Id, duplicated!.Id);
            // بيضيف لاحقة "(نسخة)" للاسم عشان تفرّق بينه وبين الأصلي (راجع SubscriptionService.DuplicateAsync)
            Assert.Contains(created.Name, duplicated.Name);
        }

        [Fact]
        public async Task GetMonthlyTotal_ForAnotherUser_ReturnsForbidden()
        {
            var (otherUserId, _) = await _client.RegisterUserAsync();
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/subscriptions/user/{otherUserId}/monthly-total");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        private static CreateSubscriptionDto BuildDto(int userId) => new()
        {
            Name = "Netflix",
            Price = 200,
            Currency = Currency.EGP,
            BillingCycle = BillingCycle.Monthly,
            NextRenewalDate = DateTime.UtcNow.AddMonths(1),
            AutoRenew = true,
            UserId = userId
        };
    }
}
