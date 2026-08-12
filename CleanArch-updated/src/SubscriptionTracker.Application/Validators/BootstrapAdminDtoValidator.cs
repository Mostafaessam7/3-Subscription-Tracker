using FluentValidation;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Validators
{
    public class BootstrapAdminDtoValidator : AbstractValidator<BootstrapAdminDto>
    {
        public BootstrapAdminDtoValidator()
        {
            RuleFor(x => x.BootstrapKey).NotEmpty();
            RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
            RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        }
    }
}
