using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    /// <summary>
    /// المسارات حاجة بتتكسر في صمت: لو الـ Convention بطّلت تشتغل، مفيش Build هيفشل ومفيش Test تاني
    /// هياخد باله — الفرونت اند بس هو اللي هيبدأ يرجّع 404 على كل نداء.
    ///
    /// الاختبارات دي بتثبّت الحاجتين اللي التغيير ده قايم عليهم: إن المسار القديم غير المؤصدر فضل
    /// شغال (الفرونت اند الحالي بينده عليه)، وإن المسار الجديد المؤصدر بقى موجود.
    /// </summary>
    public class ApiVersioningTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public ApiVersioningTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        /// <summary>
        /// المسار القديم لازم يفضل شغال: <c>environment.apiUrl</c> في الفرونت اند منتهي بـ
        /// <c>/api</c> والخدمات بتضيف عليه <c>/auth</c> و<c>/subscriptions</c> مباشرة، فلو المسار
        /// ده اتشال كل نداء في التطبيق بيتكسر.
        /// </summary>
        [Theory]
        [InlineData("/api/auth/login")]
        [InlineData("/api/auth/register")]
        public async Task المسار_القديم_غير_المؤصدر_لسه_شغال(string path)
        {
            var response = await _client.PostAsJsonAsync(path, new { });

            // المطلوب إثباته هنا إن المسار **موجود**، مش إن الطلب الفاضي بينجح. 400 معناها إن
            // الـ Routing لقى الـ Endpoint والـ Validation هي اللي رفضت - وده بالظبط المطلوب.
            Assert.NotEqual(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("/api/v1/auth/login")]
        [InlineData("/api/v1/auth/register")]
        public async Task المسار_الجديد_المؤصدر_شغال(string path)
        {
            var response = await _client.PostAsJsonAsync(path, new { });

            Assert.NotEqual(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task المسارين_بيوصّلوا_لنفس_الـEndpoint()
        {
            // لو الاتنين بيدّوا نفس النتيجة على نفس المدخلات، يبقى المسار المؤصدر إضافة فعلاً مش
            // نسخة تانية ليها سلوك مختلف.
            var legacy = await _client.PostAsJsonAsync("/api/auth/login", new { });
            var versioned = await _client.PostAsJsonAsync("/api/v1/auth/login", new { });

            Assert.Equal(legacy.StatusCode, versioned.StatusCode);
        }

        [Fact]
        public async Task إصدار_غير_معرّف_بيترفض_مش_بيتخدم_في_صمت()
        {
            // لو v9 اشتغلت، يبقى الإصدارات مجرد شكل في المسار من غير أي معنى.
            var response = await _client.PostAsJsonAsync("/api/v9/auth/login", new { });

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
