using FluentValidation.TestHelper;
using SubscriptionTracker.Application.DTOs;
using SubscriptionTracker.Application.Validators;
using Xunit;

namespace SubscriptionTracker.Tests.Validators
{
    public class RegisterDtoValidatorTests
    {
        private readonly RegisterDtoValidator _validator = new();

        [Fact]
        public void Valid_Dto_HasNoErrors()
        {
            var dto = new RegisterDto { Name = "Mostafa", Email = "mostafa@example.com", Password = "Password123" };

            var result = _validator.TestValidate(dto);

            result.ShouldNotHaveAnyValidationErrors();
        }

        [Fact]
        public void Empty_Name_HasError()
        {
            var dto = new RegisterDto { Name = "", Email = "mostafa@example.com", Password = "123456" };

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.Name);
        }

        [Theory]
        [InlineData("not-an-email")]
        [InlineData("")]
        public void Invalid_Email_HasError(string email)
        {
            var dto = new RegisterDto { Name = "Mostafa", Email = email, Password = "123456" };

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.Email);
        }

        [Fact]
        public void Password_ShorterThanEightChars_HasError()
        {
            var dto = new RegisterDto { Name = "Mostafa", Email = "mostafa@example.com", Password = "Ab1" };

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.Password);
        }

        [Theory]
        [InlineData("alllowercase1")] // من غير حرف كبير
        [InlineData("ALLUPPERCASE1")] // من غير حرف صغير
        [InlineData("NoDigitsHere")]  // من غير رقم
        public void Password_MissingRequiredCharacterType_HasError(string password)
        {
            var dto = new RegisterDto { Name = "Mostafa", Email = "mostafa@example.com", Password = password };

            var result = _validator.TestValidate(dto);

            result.ShouldHaveValidationErrorFor(x => x.Password);
        }
    }
}
