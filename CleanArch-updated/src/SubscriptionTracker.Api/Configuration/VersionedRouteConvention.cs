using Microsoft.AspNetCore.Mvc.ApplicationModels;

namespace SubscriptionTracker.Api.Configuration;

/// <summary>
/// بيضيف مسار متأصدر (<c>api/v1/...</c>) لكل Controller **جنب** مساره الحالي غير المؤصدر
/// (<c>api/...</c>)، من غير ما يشيل أي حاجة.
///
/// ليه Convention مش <c>[Route]</c> تانية على كل Controller: الطريقة التانية كانت هتبقى 8 تعديلات
/// يدوية دلوقتي، وسطر لازم كل حد يفتكر يكتبه في كل Controller جديد بعد كده — وأول واحد ينساه بيخرج
/// من نظام الإصدارات من غير ما حد ياخد باله. الـ Convention بتتنفّذ على كل Controller موجود ومستقبلي
/// تلقائيًا.
///
/// المسار القديم بيفضل شغال عن قصد: الفرونت اند الحالي بينده على <c>/api/subscriptions</c> مباشرة
/// (<c>environment.apiUrl</c> منتهي بـ <c>/api</c>)، فتحويل المسارات بدل ما نضيف كان هيكسر كل نداء
/// في التطبيق. الهدف من الخطوة دي إن الإصدارات تبقى موجودة **قبل** ما يبقى في عملاء خارجيين، مش إن
/// العملاء الحاليين يتنقلوا دلوقتي.
/// </summary>
public sealed class VersionedRouteConvention : IControllerModelConvention
{
    private const string VersionedPrefix = "api/v{version:apiVersion}";

    public void Apply(ControllerModel controller)
    {
        // بيتعامل مع الـ Selectors الموجودة كنسخة ثابتة، لأننا بنضيف للمجموعة نفسها وإحنا بنلف عليها.
        var existingSelectors = controller.Selectors.ToList();

        foreach (var selector in existingSelectors)
        {
            var template = selector.AttributeRouteModel?.Template;

            // بيتجاهل أي Controller من غير Route Attribute (مفيش مسار نضيف عليه إصدار)، وأي Controller
            // متأصدر بالفعل — عشان ماينتجش api/v1/api/v1/...
            if (string.IsNullOrEmpty(template) ||
                !template.StartsWith("api/", StringComparison.OrdinalIgnoreCase) ||
                template.Contains("v{version", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            // "api/subscriptions" -> "api/v{version:apiVersion}/subscriptions"
            var remainder = template["api/".Length..];

            controller.Selectors.Add(new SelectorModel(selector)
            {
                AttributeRouteModel = new AttributeRouteModel
                {
                    Template = $"{VersionedPrefix}/{remainder}",
                },
            });
        }
    }
}
