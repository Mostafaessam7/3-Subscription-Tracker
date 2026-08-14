using Microsoft.EntityFrameworkCore;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Interfaces.Repositories;
using SubscriptionTracker.Application.Interfaces.Services;
using SubscriptionTracker.Application.Mapping;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Services
{
    public class TagService : ITagService
    {
        private readonly IUnitOfWork _unitOfWork;

        public TagService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<TagDto>> GetAllAsync()
        {
            var tags = await _unitOfWork.Tags.Query()
                .OrderBy(t => t.Name)
                .ToListAsync();

            return tags.ToDtoList();
        }

        public async Task<TagDto> CreateAsync(CreateTagDto dto)
        {
            var tag = new Tag { Name = dto.Name, Color = dto.Color };

            await _unitOfWork.Tags.AddAsync(tag);
            await _unitOfWork.SaveChangesAsync();

            return tag.ToDto();
        }

        public async Task<bool> UpdateAsync(int id, UpdateTagDto dto)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            if (tag is null) return false;

            tag.Name = dto.Name;
            tag.Color = dto.Color;

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            if (tag is null) return false;

            // مش محتاجين نعمل حاجة إضافية للاشتراكات المرتبطة - EF بيشيل الربط من جدول SubscriptionTags تلقائيًا
            _unitOfWork.Tags.Remove(tag);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }
    }
}
