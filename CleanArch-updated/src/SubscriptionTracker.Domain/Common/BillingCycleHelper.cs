using SubscriptionTracker.Domain.Enums;

namespace SubscriptionTracker.Domain.Common
{
    // منطق حساب "قد إيه ده بيساوي شهريًا/سنويًا" لأي دورة دفع - في مكان واحد بس
    // ده Domain Logic حقيقي (قاعدة عمل ثابتة مالهاش علاقة بقاعدة البيانات ولا الـ API)،
    // فمكانه الطبيعي هو الـ Domain layer نفسها، مش Service في طبقة أعلى
    public static class BillingCycleHelper
    {
        public static decimal ToMonthlyEquivalent(decimal price, BillingCycle cycle)
        {
            return cycle switch
            {
                BillingCycle.Weekly => price * 52 / 12,
                BillingCycle.Monthly => price,
                BillingCycle.Quarterly => price / 3,
                BillingCycle.Yearly => price / 12,
                _ => price
            };
        }

        public static decimal ToYearlyEquivalent(decimal price, BillingCycle cycle)
        {
            return cycle switch
            {
                BillingCycle.Weekly => price * 52,
                BillingCycle.Monthly => price * 12,
                BillingCycle.Quarterly => price * 4,
                BillingCycle.Yearly => price,
                _ => price * 12
            };
        }
    }
}
