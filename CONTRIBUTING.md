# المساهمة في المشروع

## قبل ما تبدأ

اقرأ [README.md](README.md) الرئيسي عشان تفهم شكل المشروع (Backend + Frontend)، وخطوات التشغيل المحلي.

## سير العمل (Workflow)

1. اعمل Branch جديد من `main` بوصف قصير للتغيير (`feature/add-x`, `fix/bug-y`).
2. اعمل التعديلات بتاعتك.
3. **شغّل الاختبارات قبل ما تعمل Commit**:
   ```bash
   # Backend
   dotnet test CleanArch-updated/src/SubscriptionTracker.Tests

   # Frontend
   cd subscription-tracker-app && npm test
   ```
4. اعمل Commit برسالة واضحة بتشرح **ليه** التغيير ده مش بس **إيه اللي اتغيّر**.
5. افتح Pull Request لـ `main` — الـ [CI](.github/workflows/ci.yml) هيشتغل تلقائيًا (Build + Test للمشروعين).

## قواعد الكود

- **الباك اند**: اتبع نفس نمط Clean Architecture الموجود (Domain → Application → Infrastructure → Api). أي منطق عمل (Business Logic) مكانه `Application/Services`، مش الـ Controllers.
- **الفرونت اند**: Standalone Components، وأي دالة حساب (زي `billing-cycle.util.ts`) لازم تفضل مطابقة لنفس المنطق في الباك اند لو بتكرر حسبة موجودة هناك.
- **التعليقات**: بالعربي، وبتشرح "ليه" مش "إيه" (الكود نفسه بيوضح الـ "إيه").
- **الترجمة**: أي نص جديد في الفرونت اند لازم يتضاف في `ar.json` و `en.json` مع بعض (راجع [قسم دعم اللغتين](subscription-tracker-app/README.md#دعم-اللغتين-عربي--إنجليزي)).

## الإبلاغ عن مشاكل (Issues)

لو لقيت Bug، وضّح:
- الخطوات اللي وصلتك للمشكلة
- السلوك المتوقع مقابل اللي فعلًا حصل
- أي رسائل خطأ أو Logs (`CleanArch-updated/src/SubscriptionTracker.Api/Logs/`)
