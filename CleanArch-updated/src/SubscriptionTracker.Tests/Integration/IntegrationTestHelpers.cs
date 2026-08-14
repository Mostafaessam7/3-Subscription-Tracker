using System.Net.Http.Headers;
using System.Net.Http.Json;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Tests.Integration
{
    // Helpers مشتركة بين كل الـ Integration Tests - عشان مانكررش نفس كود التسجيل/الدخول في كل ملف
    public static class IntegrationTestHelpers
    {
        // مفتاح الـ Bootstrap زي ما هو في appsettings.json (بيئة الاختبار بتستخدمه لأن
        // appsettings.Development.json مبيغيّرش قسم Admin)
        public const string AdminBootstrapKey = "CHANGE_THIS_TO_A_RANDOM_SECRET_BEFORE_FIRST_RUN";

        public static async Task<(int UserId, string Token)> RegisterUserAsync(this HttpClient client, string? name = null)
        {
            var dto = new RegisterDto
            {
                Name = name ?? "Test User",
                Email = $"{Guid.NewGuid()}@example.com",
                Password = "Password123"
            };

            var response = await client.PostAsJsonAsync("/api/auth/register", dto);
            response.EnsureSuccessStatusCode();

            var body = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
            return (body!.UserId, body.Token);
        }

        // بيبوتستراب أول Admin في الـ DB بتاع الـ Factory دي، أو لو حصل قبل كده (Test تاني في نفس
        // الكلاس) بيعمل Login بنفس البيانات الثابتة بدل ما يفشل
        public static async Task<(int UserId, string Token)> BootstrapOrLoginAdminAsync(this HttpClient client)
        {
            const string email = "fixture-admin@example.com";
            const string password = "AdminPass123";

            var bootstrapDto = new BootstrapAdminDto
            {
                BootstrapKey = AdminBootstrapKey,
                Name = "Fixture Admin",
                Email = email,
                Password = password
            };

            var bootstrapResponse = await client.PostAsJsonAsync("/api/admin/bootstrap", bootstrapDto);
            if (bootstrapResponse.IsSuccessStatusCode)
            {
                var body = await bootstrapResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
                return (body!.UserId, body.Token);
            }

            var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new LoginDto { Email = email, Password = password });
            loginResponse.EnsureSuccessStatusCode();
            var loginBody = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>();
            return (loginBody!.UserId, loginBody.Token);
        }

        public static void AuthenticateAs(this HttpClient client, string token)
        {
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        public static void ClearAuthentication(this HttpClient client)
        {
            client.DefaultRequestHeaders.Authorization = null;
        }
    }
}
