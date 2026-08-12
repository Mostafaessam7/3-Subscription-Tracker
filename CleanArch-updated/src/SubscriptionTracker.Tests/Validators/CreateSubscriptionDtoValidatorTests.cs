using FluentValidation.TestHelper;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Validators;
using SubscriptionTracker.Domain.Enums;
using Xunit;

namespace SubscriptionTracker.Tests.Validators
{
    public class CreateSubscriptionDtoValidatorTests
    {
        private readonly CreateSubscriptionDtoValidator _validator = new();

        private static CreateSubscriptionDto ValidDto() => new()
        {
            Name = "Netflix",
            Price = 150,
            BillingCycle = BillingCycle.Monthly,
            NextRenewalDate = DateTime.UtcNow.AddMonths(1),
            UserId = 1
        };

        [Fact]
        public void Valid_Dto_HasNoErrors()
        {
            var result = _validator.TestValidate(ValidDto());

            result.ShouldNotHaveAnyValidationErrors();
        }

        [Fact]
        public void Price_Negative_HasError()
        {
            var dto = ValidDto();
            dto.Price = -10;

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.Price);
        }

        [Fact]
        public void Price_AboveMax_HasError()
        {
            var dto = ValidDto();
            dto.Price = 100001;

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.Price);
        }

        [Fact]
        public void UserId_Zero_HasError()
        {
            var dto = ValidDto();
            dto.UserId = 0;

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.UserId);
        }

        [Theory]
        [InlineData("not-a-url")]
        [InlineData("just plain text")]
        public void Invalid_WebsiteUrl_HasError(string url)
        {
            var dto = ValidDto();
            dto.WebsiteUrl = url;

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.WebsiteUrl);
        }

        [Fact]
        public void Empty_WebsiteUrl_IsAllowed()
        {
            var dto = ValidDto();
            dto.WebsiteUrl = null;

            var result = _validator.TestValidate(dto);

            result.ShouldNotHaveValidationErrorFor(x => x.WebsiteUrl);
        }
    }
}
