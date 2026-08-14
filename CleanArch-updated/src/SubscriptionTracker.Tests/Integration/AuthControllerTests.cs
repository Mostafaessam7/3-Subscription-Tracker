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
        private readonly CustomWebApplicationFactory _factory;

        public AuthControllerTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;

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

        [Fact]
        public async Task ForgotPassword_WithRegisteredEmail_SendsResetLinkAndReturnsOk()
        {
            var email = $"{Guid.NewGuid()}@example.com";
            var registerDto = new RegisterDto { Name = "Test User", Email = email, Password = "Password123" };
            await _client.PostAsJsonAsync("/api/auth/register", registerDto);

            var response = await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordDto { Email = email });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            Assert.Equal(email, _factory.FakeEmailService.LastPasswordResetToEmail);
            Assert.False(string.IsNullOrWhiteSpace(_factory.FakeEmailService.LastPasswordResetLink));
        }

        [Fact]
        public async Task ForgotPassword_WithUnknownEmail_StillReturnsOk()
        {
            // منعًا لتسريب معلومة "الإيميل ده مسجل ولا لأ" (User Enumeration) - لازم يرجع نفس الرد
            var response = await _client.PostAsJsonAsync(
                "/api/auth/forgot-password",
                new ForgotPasswordDto { Email = $"{Guid.NewGuid()}@example.com" });

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ResetPassword_WithValidToken_ChangesPasswordAndAllowsLogin()
        {
            var email = $"{Guid.NewGuid()}@example.com";
            var registerDto = new RegisterDto { Name = "Test User", Email = email, Password = "OldPassword123" };
            await _client.PostAsJsonAsync("/api/auth/register", registerDto);
            await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordDto { Email = email });

            var token = ExtractTokenFromLink(_factory.FakeEmailService.LastPasswordResetLink!);
            var resetResponse = await _client.PostAsJsonAsync(
                "/api/auth/reset-password",
                new ResetPasswordDto { Token = token, NewPassword = "NewPassword456" });

            Assert.Equal(HttpStatusCode.OK, resetResponse.StatusCode);

            var oldLoginResponse = await _client.PostAsJsonAsync(
                "/api/auth/login", new LoginDto { Email = email, Password = "OldPassword123" });
            Assert.Equal(HttpStatusCode.Unauthorized, oldLoginResponse.StatusCode);

            var newLoginResponse = await _client.PostAsJsonAsync(
                "/api/auth/login", new LoginDto { Email = email, Password = "NewPassword456" });
            Assert.Equal(HttpStatusCode.OK, newLoginResponse.StatusCode);
        }

        [Fact]
        public async Task ResetPassword_WithSameTokenTwice_SecondAttemptFails()
        {
            var email = $"{Guid.NewGuid()}@example.com";
            var registerDto = new RegisterDto { Name = "Test User", Email = email, Password = "OldPassword123" };
            await _client.PostAsJsonAsync("/api/auth/register", registerDto);
            await _client.PostAsJsonAsync("/api/auth/forgot-password", new ForgotPasswordDto { Email = email });

            var token = ExtractTokenFromLink(_factory.FakeEmailService.LastPasswordResetLink!);
            var resetDto = new ResetPasswordDto { Token = token, NewPassword = "NewPassword456" };

            var first = await _client.PostAsJsonAsync("/api/auth/reset-password", resetDto);
            Assert.Equal(HttpStatusCode.OK, first.StatusCode);

            var second = await _client.PostAsJsonAsync("/api/auth/reset-password", resetDto);
            Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
        }

        [Fact]
        public async Task ResetPassword_WithInvalidToken_ReturnsBadRequest()
        {
            var response = await _client.PostAsJsonAsync(
                "/api/auth/reset-password",
                new ResetPasswordDto { Token = "not-a-real-token", NewPassword = "NewPassword456" });

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        private static string ExtractTokenFromLink(string resetLink)
        {
            // اللينك شكله .../reset-password?token=XXXX - بنستخرج قيمة الـ query param يدوي
            // من غير اعتماد على System.Web (مش متاحة افتراضيًا في ASP.NET Core)
            var uri = new Uri(resetLink);
            var tokenParam = uri.Query.TrimStart('?')
                .Split('&')
                .Select(p => p.Split('=', 2))
                .FirstOrDefault(p => p[0] == "token");

            if (tokenParam is null || tokenParam.Length < 2 || string.IsNullOrEmpty(tokenParam[1]))
                throw new InvalidOperationException("لينك إعادة التعيين من غير token");

            return Uri.UnescapeDataString(tokenParam[1]);
        }
    }
}
