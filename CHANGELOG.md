# Changelog

كل التغييرات المهمة في المشروع. الشكل مبني على [Keep a Changelog](https://keepachangelog.com/) تقريبًا — بدون أرقام إصدار رسمية لحد دلوقتي لأن المشروع لسه من غير Git Tags.

## [Unreleased]

### ترقية — Angular 18 → 22 (على فرع `angular-upgrade`) (2026-08-23)
- ترقية تدريجية بـ `ng update` لكل Major لوحده (18→19→20→21→22)، مع `ng build` + كامل الـ 169 Karma Test بعد كل خطوة قبل ما نكمل اللي بعدها (نفس المنهج المتبع مع باقي الترقيات في المشروع).
- **v19**: `standalone: true` اتشالت من 20 Component (بقت القيمة الافتراضية)، `zone.js` 0.14.10 → 0.15.1.
- **v20**: TypeScript 5.5.4 → 5.9.3، Migration بسيط لإعدادات `angular.json` الافتراضية.
- **v21**: **كل الـ Templates اتحولت أوتوماتيك من `*ngIf`/`*ngFor`/`*ngSwitch` لصيغة الـ Block Control Flow الجديدة (`@if`/`@for`/`@switch`)** عبر كل الـ 20 Component - أكبر تغيير في الترقية كلها. `main.ts` bootstrap options اتنقلت لـ Providers، `tsconfig.json` `lib` اترفعت لـ `es2022+`.
- **v22**: كل الـ Components بقت `ChangeDetectionStrategy.Eager` بشكل صريح (Migration تلقائي)، `withXhr()` اتضافت لـ `provideHttpClient()`، Optional Chaining في `dashboard.component.html` اتلفت بـ `$safeNavigationMigration()`، TypeScript 5.9.3 → 6.0.3.
  - 🐛 **إصلاح صغير بعد الترقية**: الـ Production Bundle الابتدائي زاد ~3.6kb وتخطى سقف الـ Budget (`1mb`) في `angular.json` — اترفع لـ `1.05mb`.
- **النتيجة**: `ng build` ناجح و**169/169 Karma Test** بعد كل خطوة من الأربعة، وأهم حاجة — **الـ 8 ثغرات الأمنية العالية في `@angular/core`** (XSS متنوعة، كانت مذكورة كـ Known Gap) **اتصلحت بالكامل** (`npm audit` مبقاش فيهم). ظهرت بدالهم 7 ثغرات جديدة (3 عالية، 4 متوسطة) لكن في أدوات الـ Build بس (`less`/`webpack-dev-server` Transitive عن طريق `@angular-devkit/build-angular`) — مش بتتشحن في الـ Production Bundle، والتصليح ليها محتاج `--force` (Breaking Change زيادة)، فسايبينها كـ Known Gap جديد بدل ما نعملها من غير تفكير.

### إضافات — E2E Tests لتأكيد الإيميل ومسح الحساب + إصلاح Flakiness (2026-08-22)
- `e2e/account.spec.ts` جديد (7 Tests): بانر تأكيد الإيميل على مستخدم جديد، زرار إعادة الإرسال، صفحة `/confirm-email` بتوكن غلط/ناقص، ومسح الحساب (كلمة سر صح/غلط، إلغاء نافذة التأكيد). إجمالي E2E دلوقتي **20/20 Test**.
- **Rate Limiting عمدًا مش متغطي بـ E2E**: تكرار اختبار الـ 429 هنا كان هيقفل باقي الـ Auth Endpoints لباقي الـ Suite (نفس الـ IP) - مغطى بالكامل ومضمون بـ `RateLimitingTests.cs` على الباك اند لوحده.
- 🐛 **إصلاحين استقرار حقيقيين اتكشفوا أثناء تشغيل الـ Suite الأكبر (20 Test بدل 13)**:
  1. سقف الـ Rate Limiting الافتراضي (10 طلبات/دقيقة) كان بيتلامس فعليًا مع E2E Suite أكبر (كل الطلبات من نفس الـ IP محليًا) - `appsettings.Development.json` بقى فيه Override لـ 100 طلب/دقيقة، الإنتاج (`appsettings.json`) فاضل على 10 زي ما هو.
  2. Timeout الافتراضي بتاع `expect()` في Playwright (5 ثواني) كان قليل لما كذا Test بيسجّلوا مستخدمين بالتوازي (BCrypt بطيء عمدًا تحت ضغط) - اترفع لـ 15 ثانية في `playwright.config.ts`.

### إضافات — Email Verification, Rate Limiting, Delete Account, كلمة سر أقوى (2026-08-22)
- **Email Verification**: `User.EmailConfirmed` جديد + توكن تأكيد (نفس نمط Password Reset - Hash فقط، صلاحية 3 أيام). `POST /api/auth/confirm-email` و`POST /api/auth/resend-confirmation` (بيرجع 200 دايمًا منعًا لتسريب معلومة). التسجيل مبيبقاش ممنوع للمستخدمين غير المؤكدين (قرار متعمّد - عشان منقفلش على حسابات قديمة/تجريبية)، بس الداشبورد بيعرض تنبيه واضح لو الإيميل لسه مش متأكد مع زرار "ابعت اللينك تاني". صفحة `/confirm-email` جديدة في الفرونت اند.
- **Rate Limiting**: كل Endpoints الـ Auth (`register`, `login`, `forgot-password`, `reset-password`, `confirm-email`, `resend-confirmation`, `admin/bootstrap`) بقى عليها سقف 10 طلبات/دقيقة لكل IP (`Microsoft.AspNetCore.RateLimiting` المدمجة، مفيش Package جديد) - كانت من غير أي حماية من Brute-force خالص قبل كده. السقف قابل للتعديل من `appsettings.json` (`RateLimiting:AuthEndpoints`).
- **Delete Account**: `DELETE /api/users/{id}` بيتطلب كلمة السر الحالية للتأكيد (زي Change Password بالظبط)، والاشتراكات بتتمسح Cascade تلقائي. في الفرونت اند: قسم "Danger Zone" في صفحة البروفايل مع نافذة تأكيد إضافية.
- **قواعد كلمة سر أقوى**: من `MinimumLength(6)` بس لـ 8 حروف + حرف كبير + حرف صغير + رقم (Backend عن طريق `PasswordRules.cs` مشتركة، Frontend عن طريق `password-validators.ts` مشتركة) - مطبّقة على التسجيل، إعادة التعيين، وتغيير كلمة السر كلهم.
- Tests: 6 Integration Tests جداد لـ Email Verification، Test مخصوص لـ Rate Limiting (`RateLimitingTests.cs`) بفاكتوري خاصة بيه بسقف صغير عشان يتأكد من الـ 429 فعليًا، 3 Integration Tests لـ Delete Account. **89/89 Backend Tests** (كانت 75).
- النتيجة على الفرونت اند: **169/169 Tests** (كانت 153).

### إصلاح — شيل AutoMapper نهائيًا (2026-08-14)
- AutoMapper 13.0.1 فيه ثغرة أمنية معروفة (`GHSA-rvv3-g6hj-g44x` - Denial of Service عن طريق Recursion) من غير Patch مجاني متاح — النسخة اللي فيها التصليح (15.1.1+) بقت مرخّصة تجاريًا بعد ما المكتبة اتباعت في يوليو 2025.
- بما إن الـ Mapping هنا كان بسيط أصلًا (5 DTOs مسطّحة)، الحل كان نشيل الـ Dependency بالكامل ونستبدلها بـ `MappingExtensions.cs` (Extension Methods عادية زي `ToDto()`) بدل ما نمشي في قرار ترخيص تجاري لحاجة صغيرة.
- الخدمات الخمسة اللي كانت بتستخدم `IMapper` (`CategoryService`, `PaymentMethodService`, `TagService`, `UserService`, `SubscriptionService`) اتحدثت، وشيلنا `AddAutoMapper()` من الـ DI والـ Package Reference بالكامل.
- النتيجة: صفر Advisories NuGet لـ AutoMapper، والـ 75 Test لسه شغالين تمام.

### إضافات — Forgot Password / Reset Password (2026-08-14)
- **الباك اند**: `POST /api/auth/forgot-password` و `POST /api/auth/reset-password` جداد في `AuthController`. توكن عشوائي (32 بايت Cryptographically Secure) بيتخزن Hash بتاعه بس (SHA-256) في عمودين جداد في `Users` (Migration: `AddPasswordResetToken`)، وبينتهي بعد ساعة أو أول استخدام. `forgot-password` بيرجع نفس الرد دايمًا (منعًا لتسريب الإيميلات المسجلة)، و`Frontend:BaseUrl` إعداد جديد لبناء لينك الإيميل.
  - 🐛 **Timing Side-Channel اتصلح قبل ما يوصل لأي بيئة حقيقية**: أول تنفيذ كان بيستنى (`await`) إرسال الإيميل فعليًا قبل الرد، يعني وقت الرد كان بيبقى مختلف بشكل واضح بين إيميل موجود (بينتظر اتصال SMTP) وإيميل مش موجود (بيرجع فورًا) — بالظبط المعلومة اللي الـ Endpoint مصمم يخفيها. اتصلح بجعل إرسال الإيميل Fire-and-Forget.
- **الفرونت اند**: صفحتين جداد `/forgot-password` و `/reset-password`، لينك "نسيت كلمة السر؟" في صفحة الدخول، و`AuthService.forgotPassword()`/`resetPassword()`.
- Tests: 5 Integration Tests جداد في `AuthControllerTests` (إيميل مسجل/مش مسجل، توكن صحيح/غلط/مستخدم قبل كده)، و10 Component Tests جداد (`forgot-password`, `reset-password`, `auth.service`).

### إضافات — Integration Tests لكل الـ Controllers (2026-08-14)
- `SubscriptionsControllerTests`, `CategoriesControllerTests`, `TagsControllerTests`, `PaymentMethodsControllerTests`, `AdminControllerTests`, `UsersControllerTests`, `AnalyticsControllerTests` — تغطية كاملة CRUD + فحص الملكية (403) للـ Controllers اللي ماكانش عليها أي Integration Test قبل كده (كانت `AuthController` بس).
- `IntegrationTestHelpers.cs` (Extension Methods مشتركة) و `FakeEmailService.cs` (بديل `IEmailService` الحقيقي في كل الـ Tests، عشان محدش يحاول يتصل بـ SMTP فعلي).
- 🐛 **إصلاح استقرار**: تشغيل كل الـ Integration Tests بالتوازي (افتراضي xUnit) كان بيسبب Timeouts وهمية (Host كامل لكل Test Class بيتشغّل في نفس الوقت). `xunit.runner.json` بيقفل الـ Parallelization دلوقتي — الوقت زاد شوية بس النتائج بقت مستقرة 100%.
- النتيجة: **75/75 Backend Tests** (كانت 35).

### إضافات — Component Tests لكل الـ Frontend (2026-08-14)
- الـ 16 Component اللي ماكانش عليهم Tests خالص (`login`, `register`, `admin`, `profile`, `category-manager`, `tag-manager`, `payment-method-manager`, `subscription-form`, `subscription-list`, `subscription-detail`, `reports`, `calendar-view`, `category-spending-chart`, `theme-switch`, `language-switch`, `confirm-dialog`) بقى عندهم `.spec.ts` كامل.
- النتيجة: **153/153 Frontend Tests** (كانت 47) — دلوقتي كل الـ 20 Component عندهم تغطية.

### إضافات — E2E Tests بـ Playwright (2026-08-14)
- إعداد Playwright كامل (`playwright.config.ts` + `e2e/`) بيشغّل النظام كامل حقيقي (Angular + ASP.NET Core Backend حقيقيين مع بعض، مش Mocked).
- `auth.spec.ts` (تسجيل/دخول/خروج/نسيان كلمة السر)، `subscription.spec.ts` (إضافة/تعديل/حذف اشتراك)، `admin.spec.ts` (منع مستخدم عادي، دخول Admin حقيقي).
- `npm run e2e` — راجع [e2e/README.md](subscription-tracker-app/e2e/README.md) لخطوات التشغيل الكاملة (الباك اند لازم يكون شغال على قاعدة بيانات تجربة).

### إصلاح — ثغرات أمنية في تصدير PDF (2026-08-12)
- `npm audit` كان بيطلع **11 ثغرة (منها 1 Critical و9 High)** في سلسلة `jspdf → jspdf-autotable → dompurify` (XSS-related). اتصلح بترقية `jspdf` لـ `^4.2.1` و`jspdf-autotable` لـ `^5.0.8` بس (Scoped Upgrade، من غير ما نلمس Angular خالص). النتيجة: صفر Advisories باقية لـ `jspdf`/`dompurify`، والـ Build + الـ 47 Test لسه شغالين تمام.
- ⚠️ **ملحوظة صادقة**: أول محاولة كانت بـ `npm audit fix --force` اللي رقّى Angular نفسه من 18 لـ 22 (4 Majors!) — ده اتلغى فورًا واستُبدل بترقية مستهدفة للحزمتين بس، عشان منعملش Breaking Change مش مطلوب.

### إصلاح — Migration ناقصة (2026-08-12)
- **`AddUserRoles` migration ماكانتش متتبعة في الريبو** رغم إن `User.Role` موجود في الـ Entity والكود بيفترض وجود العمود ده من ساعة فيتشر الـ Roles — يعني `dotnet ef database update` كان هيفشل بـ `PendingModelChangesWarning` لأي حد يعمل Clone جديد ويتبع الخطوات في README. اتصلح بإضافة الـ Migration الناقصة فعليًا.

### إضافات — Admin UI في الفرونت اند (2026-08-12)
- الباك اند كان فيه نظام Admin كامل (`/api/admin/*`) من غير أي واجهة تستخدمه في الفرونت اند خالص، ولا حتى `role` في الـ Models. اتضاف:
  - `role` في `AuthResponse` و `Profile`, و `UserRole` enum يطابق الباك اند
  - `AdminService`, `adminGuard`, صفحة `/admin` (إحصائيات + جدول مستخدمين + ترقية/تخفيض دور)
  - لينك 🛠 لوحة الأدمن يظهر بس للـ Admin في الداشبورد
  - ترجمات كاملة (ar.json/en.json) + Tests لـ `AdminService` و `adminGuard`
- **Tests لـ `DashboardComponent`** (أكبر Component في المشروع، 357 سطر) — ماكانش عليه أي Test خالص.
- راجع [GAPS.md](GAPS.md) للتفاصيل الكاملة لخطوات التنفيذ والتحقق.

### إضافات — DevOps / Infrastructure (2026-08-12)
- مشروع Unit Tests للباك اند (`SubscriptionTracker.Tests` - xUnit): تغطية لـ `BillingCycleHelper`, `BCryptPasswordHasher`, و FluentValidation Validators.
- Integration Tests حقيقية (`AuthControllerTests`) بـ `WebApplicationFactory` + EF Core InMemory.
- Test Scaffolding كامل للفرونت اند (Karma + Jasmine — ماكانش موجود خالص قبل كده) + تغطية لـ `SubscriptionService`, `AuthService`, `ToastService`, `ToastComponent`, و `billing-cycle.util`.
- CI Pipeline (`.github/workflows/ci.yml`): Build + Test تلقائي للمشروعين على كل push/PR لـ `main`.
- CD Pipeline (`.github/workflows/cd.yml`): بناء ونشر Docker Images لـ Azure Web Apps بعد نجاح الـ CI (غير مُختبر فعليًا — محتاج موارد Azure حقيقية).
- Docker: `Dockerfile` (API), `Dockerfile.frontend` + `nginx.conf`، و `docker-compose.yml` لتشغيل النظام كامل محليًا.
- `appsettings.example.json`, `.env.example`, `.gitignore` (جذر + الفرونت اند), `.dockerignore`.
- `LICENSE` (MIT), `CONTRIBUTING.md`, `README.md` رئيسي يربط المشروعين.

### إضافات — المنتج (تواريخ غير مؤكدة، من توثيق سابق)
- **Roles & Permissions**: `UserRole` (User/Admin)، `AdminController`، فحص ملكية البيانات على كل Endpoint حساس. تصليح ثغرة أمنية حقيقية (`GET /api/users` كان بيرجّع كل المستخدمين لأي حد).
- **P3**: Favorites, Tags (Many-to-Many), Duplicate Subscription, Calendar View, Logo تلقائي من الموقع، Dark/Light Toggle.
- **P2**: صفحات التقارير والبروفايل، تصدير CSV/PDF/طباعة، تصليح حساب `BillingCycle` (كان بيدعم بس Monthly/Yearly).
- **الهيكلة الأساسية**: إعادة هيكلة الباك اند كامل لـ Clean Architecture (4 طبقات)، Repository Pattern + Unit of Work، AutoMapper، FluentValidation، Global Exception Handling، Serilog.
- دعم اللغتين (عربي/إنجليزي) بـ ngx-translate، هوية تصميم "Financial Terminal"، خلفيات Vanta.js، Motion/Animations.

راجع [CleanArch-updated/README.md](CleanArch-updated/README.md) و [subscription-tracker-app/README.md](subscription-tracker-app/README.md) للتفاصيل الكاملة لكل نقطة.
