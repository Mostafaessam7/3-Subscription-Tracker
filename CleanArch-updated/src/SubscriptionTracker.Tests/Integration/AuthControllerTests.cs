using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    // Integration Tests حقيقية: بتشغّل التطبيق كامل (Controller → Service → Repository → DbContext)
    // على قاعدة بيانات InMemory، من غير أي Mocking للطبقات الداخلية - أقرب حاجة للسلوك الحقيقي
    public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public AuthControllerTests(CustomWebApplicationFactory factory)
        {
            // BaseAddress بـ https صراحة عشان نتفادى الـ 307 Redirect بتاع UseHttpsRedirection() في
            // Program.cs (TestServer مالوش HTTPS Port حقيقي، فلو بعتنا http هيحاول يعمل Redirect)
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task Register_WithNewEmail_ReturnsOkWithToken()
        {
            var dto = new RegisterDto
            {
                Name = "Test User",
                Email = $"{Guid.NewGuid()}@example.com",
                Password = "Password123"
            };

            var response = await _client.PostAsJsonAsync("/api/auth/register", dto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(body);
            Assert.False(string.IsNullOrWhiteSpace(body!.Token));
            Assert.Equal(dto.Email, body.Email);
        }

        [Fact]
        public async Task Register_WithDuplicateEmail_ReturnsConflict()
        {
            var email = $"{Guid.NewGuid()}@example.com";
            var dto = new RegisterDto { Name = "Test User", Email = email, Password = "Password123" };

            var first = await _client.PostAsJsonAsync("/api/auth/register", dto);
            Assert.Equal(HttpStatusCode.OK, first.StatusCode);

            var second = await _client.PostAsJsonAsync("/api/auth/register", dto);

            Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
        }

        [Fact]
        public async Task Register_WithInvalidPayload_ReturnsBadRequest()
        {
            // الباسورد أقل من 6 حروف - المفروض FluentValidation يرفضه قبل ما يوصل للـ Service خالص
            var dto = new RegisterDto { Name = "Test", Email = "invalid-email", Password = "123" };

            var response = await _client.PostAsJsonAsync("/api/auth/register", dto);

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Login_WithCorrectCredentials_ReturnsOkWithToken()
        {
            var email = $"{Guid.NewGuid()}@example.com";
            var registerDto = new RegisterDto { Name = "Test User", Email = email, Password = "Password123" };
            await _client.PostAsJsonAsync("/api/auth/register", registerDto);

            var loginDto = new LoginDto { Email = email, Password = "Password123" };
            var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            Assert.NotNull(body);
            Assert.False(string.IsNullOrWhiteSpace(body!.Token));
        }

        [Fact]
        public async Task Login_WithWrongPassword_ReturnsUnauthorized()
        {
            var email = $"{Guid.NewGuid()}@example.com";
            var registerDto = new RegisterDto { Name = "Test User", Email = email, Password = "Password123" };
            await _client.PostAsJsonAsync("/api/auth/register", registerDto);

            var loginDto = new LoginDto { Email = email, Password = "WrongPassword" };
            var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
