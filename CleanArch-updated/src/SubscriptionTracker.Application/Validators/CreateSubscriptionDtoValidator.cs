using FluentValidation;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Validators
{
    public class CreateSubscriptionDtoValidator : AbstractValidator<CreateSubscriptionDto>
    {
        public CreateSubscriptionDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Price).InclusiveBetween(0, 100000);
            RuleFor(x => x.NextRenewalDate).NotEmpty();
            RuleFor(x => x.UserId).GreaterThan(0);
            RuleFor(x => x.WebsiteUrl)
                .Must(url => string.IsNullOrWhiteSpace(url) || Uri.IsWellFormedUriString(url, UriKind.Absolute))
                .WithMessage("رابط الموقع لازم يكون رابط صحيح")
                .When(x => !string.IsNullOrWhiteSpace(x.WebsiteUrl));
        }
    }
}
