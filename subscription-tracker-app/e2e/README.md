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
