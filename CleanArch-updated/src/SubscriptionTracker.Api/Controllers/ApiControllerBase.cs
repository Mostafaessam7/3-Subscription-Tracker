using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace SubscriptionTracker.Api.Controllers
{
    // أي Controller محتاج يتحقق من ملكية البيانات (إن المستخدم بيشوف بياناته هو بس) بيرث من هنا
    public abstract class ApiControllerBase : ControllerBase
    {
        // بيجيب الـ Id بتاع المستخدم المسجّل دخول حاليًا من جوه الـ JWT Token نفسه
        protected int CurrentUserId =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub")
                ?? throw new InvalidOperationException("مفيش Claim فيه الـ Sub جوه التوكن"));

        protected bool IsAdmin => User.IsInRole("Admin");

        // القاعدة الأساسية: المستخدم يقدر يشوف بياناته هو بس، إلا لو كان Admin وقتها يقدر يشوف أي حاجة
        protected bool CanAccessUser(int userId) => IsAdmin || CurrentUserId == userId;
    }
}
