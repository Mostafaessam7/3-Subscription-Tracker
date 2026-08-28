using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using SubscriptionTracker.Infrastructure.Persistence;

namespace SubscriptionTracker.Api.HealthChecks;

/// <summary>
/// فحص جاهزية (readiness) بيتأكد إن الـ API قادر يوصل لقاعدة البيانات فعليًا.
///
/// متسجّل بـ tag اسمه "ready" بس، مش في فحص الحياة (liveness) — والفرق ده مقصود: لو قاعدة البيانات
/// وقعت، الـ Orchestrator المفروض يشيل الـ instance من الـ load balancer (readiness) مش يقتلها ويعيد
/// تشغيلها (liveness)، لأن إعادة التشغيل مش هتصلّح قاعدة بيانات واقعة — هتزوّد الضغط عليها بس.
/// </summary>
public sealed class DatabaseHealthCheck(AppDbContext dbContext) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var canConnect = await dbContext.Database.CanConnectAsync(cancellationToken);

            return canConnect
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("تعذر الاتصال بقاعدة البيانات.");
        }
        catch (Exception exception)
        {
            // بيترجع Unhealthy بدل ما الاستثناء يطلع بره: نقطة الفحص المفروض تجاوب دايمًا بحالة،
            // لأن 500 من غير تفاصيل مش بيفرّق بين "التطبيق واقع" و"قاعدة البيانات واقعة".
            return HealthCheckResult.Unhealthy("فشل فحص قاعدة البيانات.", exception);
        }
    }
}
