using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    public class AnalyticsControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public AnalyticsControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task GetSpendingByCategory_ForOwnUser_ReturnsOk()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/analytics/spending-by-category/{userId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<List<CategorySpendingDto>>();
            Assert.NotNull(result);
        }

        [Fact]
        public async Task GetSpendingByCategory_ForAnotherUser_ReturnsForbidden()
        {
            var (otherUserId, _) = await _client.RegisterUserAsync();
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/analytics/spending-by-category/{otherUserId}");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }

        [Fact]
        public async Task GetInsights_ForOwnUser_ReturnsOk()
        {
            var (userId, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/analytics/insights/{userId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var result = await response.Content.ReadFromJsonAsync<AnalyticsInsightsDto>();
            Assert.NotNull(result);
        }

        [Fact]
        public async Task GetInsights_ForAnotherUser_ReturnsForbidden()
        {
            var (otherUserId, _) = await _client.RegisterUserAsync();
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync($"/api/analytics/insights/{otherUserId}");
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }
}
