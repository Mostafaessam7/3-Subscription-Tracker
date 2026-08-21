using FluentValidation;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Validators
{
    public class ResendConfirmationDtoValidator : AbstractValidator<ResendConfirmationDto>
    {
        public ResendConfirmationDtoValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
        }
    }
}
