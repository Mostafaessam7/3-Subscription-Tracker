using SubscriptionTracker.Domain.Common;
using SubscriptionTracker.Domain.Enums;
using Xunit;

namespace SubscriptionTracker.Tests.Domain
{
    // بيتأكد إن منطق تحويل دورة الدفع لمكافئ شهري/سنوي صحيح لكل قيمة في BillingCycle -
    // ده هو نفس المنطق اللي اتصلحت بسببه Bugs حقيقية في الفرونت اند (راجع P2 في README الفرونت اند)
    public class BillingCycleHelperTests
    {
        [Theory]
        [InlineData(100, BillingCycle.Weekly, 433.33)]      // 100 * 52 / 12
        [InlineData(100, BillingCycle.Monthly, 100)]
        [InlineData(300, BillingCycle.Quarterly, 100)]      // 300 / 3
        [InlineData(1200, BillingCycle.Yearly, 100)]        // 1200 / 12
        public void ToMonthlyEquivalent_ReturnsCorrectValue(decimal price, BillingCycle cycle, decimal expected)
        {
            var result = BillingCycleHelper.ToMonthlyEquivalent(price, cycle);

            Assert.Equal(expected, Math.Round(result, 2));
        }

        [Theory]
        [InlineData(100, BillingCycle.Weekly, 5200)]        // 100 * 52
        [InlineData(100, BillingCycle.Monthly, 1200)]       // 100 * 12
        [InlineData(100, BillingCycle.Quarterly, 400)]      // 100 * 4
        [InlineData(1200, BillingCycle.Yearly, 1200)]
        public void ToYearlyEquivalent_ReturnsCorrectValue(decimal price, BillingCycle cycle, decimal expected)
        {
            var result = BillingCycleHelper.ToYearlyEquivalent(price, cycle);

            Assert.Equal(expected, result);
        }

        [Fact]
        public void ToMonthlyEquivalent_And_ToYearlyEquivalent_AreConsistent_ForMonthly()
        {
            // لو الدورة شهرية، المكافئ السنوي المفروض يساوي المكافئ الشهري * 12 بالظبط
            const decimal price = 250;

            var monthly = BillingCycleHelper.ToMonthlyEquivalent(price, BillingCycle.Monthly);
            var yearly = BillingCycleHelper.ToYearlyEquivalent(price, BillingCycle.Monthly);

            Assert.Equal(yearly, monthly * 12);
        }
    }
}
