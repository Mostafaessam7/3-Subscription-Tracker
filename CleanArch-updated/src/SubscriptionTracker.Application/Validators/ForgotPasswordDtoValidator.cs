using FluentValidation;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Validators
{
    public class ForgotPasswordDtoValidator : AbstractValidator<ForgotPasswordDto>
    {
        public ForgotPasswordDtoValidator()
        {
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
        }
    }
}
