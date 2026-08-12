using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Interfaces.Services
{
    public interface ITagService
    {
        Task<List<TagDto>> GetAllAsync();
        Task<TagDto> CreateAsync(CreateTagDto dto);
        Task<bool> UpdateAsync(int id, UpdateTagDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
