using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    public class CategoriesControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public CategoriesControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task GetAll_WithoutToken_ReturnsUnauthorized()
        {
            var response = await _client.GetAsync("/api/categories");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Create_ThenGetById_ReturnsCreatedCategory()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var dto = new CreateCategoryDto { Name = "اشتراكات ترفيه", Color = "#35D0C6", Icon = "🎬" };
            var createResponse = await _client.PostAsJsonAsync("/api/categories", dto);

            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
            var created = await createResponse.Content.ReadFromJsonAsync<CategoryDto>();
            Assert.NotNull(created);
            Assert.Equal(dto.Name, created!.Name);

            var getResponse = await _client.GetAsync($"/api/categories/{created.Id}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        }

        [Fact]
        public async Task GetById_WithUnknownId_ReturnsNotFound()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.GetAsync("/api/categories/999999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Update_ExistingCategory_ReturnsNoContent()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var created = await CreateCategoryAsync();

            var updateDto = new UpdateCategoryDto { Name = "اسم جديد", Color = "#000000", Icon = "📁" };
            var response = await _client.PutAsJsonAsync($"/api/categories/{created.Id}", updateDto);

            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        }

        [Fact]
        public async Task Delete_ExistingCategory_ReturnsNoContentThenNotFound()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var created = await CreateCategoryAsync();

            var deleteResponse = await _client.DeleteAsync($"/api/categories/{created.Id}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            var getResponse = await _client.GetAsync($"/api/categories/{created.Id}");
            Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        }

        private async Task<CategoryDto> CreateCategoryAsync()
        {
            var dto = new CreateCategoryDto { Name = "اشتراكات ترفيه", Color = "#35D0C6", Icon = "🎬" };
            var response = await _client.PostAsJsonAsync("/api/categories", dto);
            return (await response.Content.ReadFromJsonAsync<CategoryDto>())!;
        }
    }
}
