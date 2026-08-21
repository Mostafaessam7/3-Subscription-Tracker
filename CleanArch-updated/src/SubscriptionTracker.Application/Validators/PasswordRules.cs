using FluentValidation;

namespace SubscriptionTracker.Application.Validators
{
    // قاعدة كلمة السر مشتركة بين RegisterDtoValidator/ResetPasswordDtoValidator/ChangePasswordDtoValidator
    // - مكان واحد بس عشان لو غيّرنا الشروط منضطرش نلاقي نفس الـ Regex متكرر في 3 ملفات
    public static class PasswordRules
    {
        public static IRuleBuilderOptions<T, string> MustBeStrongPassword<T>(this IRuleBuilder<T, string> ruleBuilder)
        {
            return ruleBuilder
                .MinimumLength(8).WithMessage("كلمة السر لازم تكون 8 حروف على الأقل")
                .Matches("[A-Z]").WithMessage("كلمة السر لازم تحتوي على حرف كبير واحد على الأقل")
                .Matches("[a-z]").WithMessage("كلمة السر لازم تحتوي على حرف صغير واحد على الأقل")
                .Matches("[0-9]").WithMessage("كلمة السر لازم تحتوي على رقم واحد على الأقل");
        }
    }
}
