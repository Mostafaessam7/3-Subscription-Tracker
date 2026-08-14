using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using SubscriptionTracker.Application.DTOs;
using Xunit;

namespace SubscriptionTracker.Tests.Integration
{
    public class TagsControllerTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public TagsControllerTests(CustomWebApplicationFactory factory)
        {
            _client = factory.CreateClient(new WebApplicationFactoryClientOptions
            {
                BaseAddress = new Uri("https://localhost")
            });
        }

        [Fact]
        public async Task GetAll_WithoutToken_ReturnsUnauthorized()
        {
            var response = await _client.GetAsync("/api/tags");
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }

        [Fact]
        public async Task Create_ThenGetAll_IncludesNewTag()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var dto = new CreateTagDto { Name = "شغل", Color = "#818CF8" };
            var createResponse = await _client.PostAsJsonAsync("/api/tags", dto);
            Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);

            var created = await createResponse.Content.ReadFromJsonAsync<TagDto>();
            Assert.NotNull(created);
            Assert.Equal(dto.Name, created!.Name);

            var allResponse = await _client.GetAsync("/api/tags");
            var all = await allResponse.Content.ReadFromJsonAsync<List<TagDto>>();
            Assert.Contains(all!, t => t.Id == created.Id);
        }

        [Fact]
        public async Task Update_UnknownTag_ReturnsNotFound()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var response = await _client.PutAsJsonAsync("/api/tags/999999", new UpdateTagDto { Name = "x", Color = "#000000" });
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task Delete_ExistingTag_ReturnsNoContent()
        {
            var (_, token) = await _client.RegisterUserAsync();
            _client.AuthenticateAs(token);

            var createResponse = await _client.PostAsJsonAsync("/api/tags", new CreateTagDto { Name = "شغل", Color = "#818CF8" });
            var created = await createResponse.Content.ReadFromJsonAsync<TagDto>();

            var deleteResponse = await _client.DeleteAsync($"/api/tags/{created!.Id}");
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            var secondDelete = await _client.DeleteAsync($"/api/tags/{created.Id}");
            Assert.Equal(HttpStatusCode.NotFound, secondDelete.StatusCode);
        }
    }
}
