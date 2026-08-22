# E2E Tests (Playwright)

الـ Tests دي بتشغّل النظام كامل حقيقي — Angular Frontend بيكلم ASP.NET Core Backend حقيقي على
قاعدة بيانات حقيقية (SQL Server/LocalDB). مش زي `ng test` (Karma/Jasmine) اللي بيموك الـ HTTP.

## قبل ما تشغّل

1. **شغّل الباك اند** على `http://localhost:5000` (من `CleanArch-updated`):
   ```bash
   dotnet run --project src/SubscriptionTracker.Api
   ```
   لازم يكون عندك DB متظبطة ومعمول لها Migrations (راجع
   [README الباك اند](../../CleanArch-updated/README.md#️-خطوات-إجبارية-قبل-التشغيل)).

   > ⚠️ **متشغّلش الـ E2E دول على قاعدة بيانات إنتاج حقيقية** — بيسجّلوا مستخدمين جداد فعليًا في كل
   > Run. استخدم قاعدة بيانات تجربة منفصلة (Dev/LocalDB) بس.

2. **`admin.spec.ts`** بيستخدم `Admin:BootstrapKey` زي ما هي في `appsettings.json` (القيمة
   الافتراضية `CHANGE_THIS_TO_A_RANDOM_SECRET_BEFORE_FIRST_RUN`). لو غيّرتها، حدّث
   `BOOTSTRAP_KEY` في `e2e/admin.spec.ts` بنفس القيمة.

3. **متبعتش الفرونت اند يدوي** — `playwright.config.ts` بيشغّله تلقائيًا (`npm start`) لو مش شغال
   بالفعل على بورت 4200.

## التشغيل

```bash
npx playwright install chromium   # مرة واحدة بس، أول استخدام
npm run e2e
```

لعرض تقرير HTML بعد التشغيل:
```bash
npx playwright show-report
```

## البنية

- `auth.spec.ts` — تسجيل حساب، دخول، خروج، ونسيان/إعادة تعيين كلمة السر
- `subscription.spec.ts` — إضافة/تعديل/حذف اشتراك من الداشبورد
- `admin.spec.ts` — منع مستخدم عادي من `/admin`، ودخول Admin حقيقي وعرض الإحصائيات
- `account.spec.ts` — بانر/إعادة إرسال تأكيد الإيميل، صفحة `/confirm-email` بتوكن غلط/ناقص، ومسح الحساب (كلمة سر صح/غلط، إلغاء التأكيد)

### ⚠️ Rate Limiting مش متغطي بـ E2E عمدًا
كل Endpoints الـ Auth عليها سقف طلبات لكل IP (راجع [README الباك اند](../../CleanArch-updated/README.md#rate-limiting)). لو Test هنا حاول يتعدّى السقف ده عمدًا عشان يتأكد من الـ `429`، هيقفل باقي الـ Auth Endpoints (تسجيل/دخول) لنفس الـ IP لمدة دقيقة كاملة — يعني أي Test تاني في نفس الـ Run (خصوصًا إن `playwright.config.ts` بيشغّل Workers بالتوازي على نفس الجهاز/IP) ممكن يفشل بالغلط بـ `429` مش بسبب حقيقي فيه. الحماية نفسها مغطاة بالكامل ومضمونة بـ `RateLimitingTests.cs` على الباك اند (بفاكتوري معزولة بسقف صغير خاص بيها)، فمفيش داعي نخاطر باستقرار الـ E2E Suite كله عشان نكرر نفس التغطية هنا.

> ملحوظة: `appsettings.Development.json` بيرفع السقف لـ 100 طلب/دقيقة (بدل 10 الافتراضية في appsettings.json) بالظبط عشان الـ E2E Suite (20 Test دلوقتي، أغلبهم بيسجّلوا مستخدم جديد كأول خطوة) مايتحظرش بالغلط وهو شغال محليًا - الإنتاج لسه على السقف الأصح (10).

### ⚠️ `expect.timeout` رُفع لـ 15 ثانية (مش الـ 5 ثواني الافتراضية)
تسجيل مستخدم بيعمل BCrypt Hash (بطيء عمدًا)، ولما كذا Test بيسجّلوا مستخدمين بالتوازي (Workers=2) الطلب ممكن ياخد أكتر من 5 ثواني تحت ضغط من غير ما يبقى فيه مشكلة حقيقية في الـ Backend - كان بيسبب فشل عشوائي (`toHaveURL` Timeout) قبل ما نرفع الرقم في `playwright.config.ts`.
