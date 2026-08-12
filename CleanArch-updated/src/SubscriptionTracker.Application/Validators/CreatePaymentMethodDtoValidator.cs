using FluentValidation;
using SubscriptionTracker.Application.DTOs;

namespace SubscriptionTracker.Application.Validators
{
    public class CreatePaymentMethodDtoValidator : AbstractValidator<CreatePaymentMethodDto>
    {
        public CreatePaymentMethodDtoValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MaximumLength(50);
        }
    }
}
