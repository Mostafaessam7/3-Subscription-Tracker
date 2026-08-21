using FluentValidation;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Validators
{
    public class ConfirmEmailDtoValidator : AbstractValidator<ConfirmEmailDto>
    {
        public ConfirmEmailDtoValidator()
        {
            RuleFor(x => x.Token).NotEmpty();
        }
    }
}
