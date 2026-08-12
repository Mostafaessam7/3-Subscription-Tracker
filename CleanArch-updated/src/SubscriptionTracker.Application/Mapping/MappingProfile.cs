using AutoMapper;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Domain.Entities;

namespace SubscriptionTracker.Application.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Subscription -> SubscriptionDto
            // DaysUntilRenewal مش عمود في قاعدة البيانات - بيتحسب وقت الطلب نفسه، فمحتاج .MapFrom مخصص
            CreateMap<Subscription, SubscriptionDto>()
                .ForMember(dest => dest.DaysUntilRenewal,
                    opt => opt.MapFrom(src => (src.NextRenewalDate.Date - DateTime.UtcNow.Date).Days))
                .ForMember(dest => dest.Category, opt => opt.MapFrom(src => src.Category))
                .ForMember(dest => dest.PaymentMethod, opt => opt.MapFrom(src => src.PaymentMethod))
                .ForMember(dest => dest.Tags, opt => opt.MapFrom(src => src.Tags));

            CreateMap<Category, CategoryDto>();
            CreateMap<PaymentMethod, PaymentMethodDto>();
            CreateMap<Tag, TagDto>();
            CreateMap<User, ProfileDto>();
        }
    }
}
