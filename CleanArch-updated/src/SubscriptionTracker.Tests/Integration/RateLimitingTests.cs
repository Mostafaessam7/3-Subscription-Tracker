using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    // Test مستقل بفاكتوري خاصة بيه (مش IClassFixture مشترك) عشان يقدر يحط سقف صغير جدًا
    // من غير ما يأثر على باقي الـ Integration Tests اللي محتاجة تعمل طلبات كتير بسرعة
    public class RateLimitingTests : IDisposable
    {
        private readonly CustomWebApplicationFactory _factory;
        private readonly HttpClient _client;

        public RateLimitingTests()
        {
            _factory = new CustomWebApplicationFactory { AuthRateLimitPermitLimit = 3 };
            _client = _factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task Login_ExceedingPermitLimit_ReturnsTooManyRequests()
        {
            var dto = new LoginDto { Email = "nobody@example.com", Password = "WrongPassword123" };

            // أول 3 طلبات (السقف اللي حطيناه) لازم تعدي عادي لحد Unauthorized (إيميل مش موجود) -
            // يعني الـ Rate Limiter نفسه مش اللي بيوقفهم
            for (var i = 0; i < 3; i++)
            {
                var response = await _client.PostAsJsonAsync("/api/auth/login", dto);
                Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            }

            // الطلب الرابع لازم يترفض بـ 429 - تعدّى السقف
            var fourthResponse = await _client.PostAsJsonAsync("/api/auth/login", dto);
            Assert.Equal(HttpStatusCode.TooManyRequests, fourthResponse.StatusCode);
        }

        [Fact]
        public async Task NonAuthEndpoint_IsNotRateLimited()
        {
            // Endpoint من غير [EnableRateLimiting] (زي /api/categories) - مفروض السقف الصغير
            // بتاع AuthEndpoints ميأثرش عليه خالص
            for (var i = 0; i < 5; i++)
            {
                var response = await _client.GetAsync("/api/categories");
                // Unauthorized (مفيش Token) مش TooManyRequests - يثبت إن الـ Endpoint ده برّه الـ Policy
                Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
            }
        }

        public void Dispose()
        {
            _client.Dispose();
            _factory.Dispose();
        }
    }
}
