using FluentValidation;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Validators
{
    public class DeleteAccountDtoValidator : AbstractValidator<DeleteAccountDto>
    {
        public DeleteAccountDtoValidator()
        {
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
