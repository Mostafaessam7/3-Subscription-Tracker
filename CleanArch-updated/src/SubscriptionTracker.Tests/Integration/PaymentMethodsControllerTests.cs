using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Domain.Enums;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    public class PaymentMethodsControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public PaymentMethodsControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task GetAll_WithoutToken_ReturnsUnauthorized()
        {
            var response = await _client.GetAsync("/api/paymentmethods");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Create_ThenGetById_ReturnsCreatedPaymentMethod()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var dto = new CreatePaymentMethodDto { Name = "فيزا", Type = PaymentMethodType.Card };
            var createResponse = await _client.PostAsJsonAsync("/api/paymentmethods", dto);

            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
            var created = await createResponse.Content.ReadFromJsonAsync<PaymentMethodDto>();
            Assert.NotNull(created);

            var getResponse = await _client.GetAsync($"/api/paymentmethods/{created!.Id}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        }

        [Fact]
        public async Task Update_ExistingPaymentMethod_ReturnsNoContent()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var createResponse = await _client.PostAsJsonAsync("/api/paymentmethods", new CreatePaymentMethodDto { Name = "فيزا", Type = PaymentMethodType.Card });
            var created = await createResponse.Content.ReadFromJsonAsync<PaymentMethodDto>();

            var updateResponse = await _client.PutAsJsonAsync(
                $"/api/paymentmethods/{created!.Id}",
                new UpdatePaymentMethodDto { Name = "ماستركارد", Type = PaymentMethodType.Card });

            Assert.Equal(HttpStatusCode.NoContent, updateResponse.StatusCode);
        }

        [Fact]
        public async Task Delete_UnknownPaymentMethod_ReturnsNotFound()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.DeleteAsync("/api/paymentmethods/999999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
