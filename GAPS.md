# الفجوات الناقصة

الملف ده بيتبع تنفيذ الفجوات اللي اتلقت (الفرونت اند والباك اند سوا). كل بند بيتحدّث لـ ✅ أول ما يتعمل ويتفحص فعليًا.

## فجوة 11: ترقية Angular 18 → 22 (8 ثغرات `@angular/core` عالية)

الفجوة الأمنية الوحيدة الباقية بعد فجوة 10 — 8 ثغرات XSS عالية في `@angular/core` نفسه، والتصليح محتاج ترقية 4 Majors دفعة واحدة (18→19→20→21→22)، Breaking Change حقيقي محتاج تجربة شاملة.

1. [x] فرع منفصل `angular-upgrade` (بعيد عن `main`) قبل ما نبدأ — شغل خطر محتمل يحتاج Rollback نضيف
2. [x] ترقية تدريجية بـ `ng update @angular/cli@N @angular/core@N` لكل Major لوحده، مع `ng build` + كامل الـ 169 Karma Test بعد كل خطوة قبل ما نكمل اللي بعدها (مش دفعة واحدة عشان لو حاجة اتكسرت نعرف بالظبط فين)
3. [x] v19: Migration تلقائي شال `standalone: true` من 20 Component (بقت الافتراضي)
4. [x] v20: TypeScript 5.5.4 → 5.9.3
5. [x] v21: Migration تلقائي حوّل كل الـ Templates من `*ngIf`/`*ngFor`/`*ngSwitch` لصيغة `@if`/`@for`/`@switch` الجديدة - أكبر تغيير في الترقية كلها، عبر كل الـ 20 Component
6. [x] v22: `ChangeDetectionStrategy.Eager` صريحة على كل Component، `withXhr()` في `provideHttpClient()`، TypeScript 6.0.3
   - 🐛 **إصلاح صغير اتكشف بعد v22**: الـ Production Bundle زاد ~3.6kb وتخطى سقف `1mb` في `angular.json` - اترفع لـ `1.05mb`
7. [x] `npm audit` بعد الترقية: الـ **8 ثغرات العالية في `@angular/core` اتصلحت بالكامل** (مبقتش موجودة خالص)

**قرار متعمّد**: ظهرت 7 ثغرات جديدة (3 عالية، 4 متوسطة) في `less`/`webpack-dev-server`/`image-size`/`uuid` - كلها Transitive عن طريق `@angular-devkit/build-angular` (أدوات Build فقط، مش بتتشحن في الـ Production Bundle). التصليح محتاج `npm audit fix --force` (Breaking Change زيادة في `@angular-devkit/build-angular`) - سابتها كفجوة جديدة في `README.md` بدل ما أعملها من غير قرار وتجربة، زي بالظبط قرار jspdf وقرار الترقية دي نفسها قبل كده.

النتيجة: **169/169 Frontend Test** نجحوا بعد كل خطوة من الأربعة، والـ `ng build` ناجح في الآخر بدون أخطاء.

## فجوة 10: E2E Tests لتأكيد الإيميل ومسح الحساب

من الفجوات اللي فجوة 9 سابتها عمدًا (E2E بتاع الفيتشرز الجديدة).

1. [x] `e2e/account.spec.ts` — بانر تأكيد الإيميل، إعادة الإرسال، `/confirm-email` بتوكن غلط/ناقص، ومسح الحساب (نجاح، كلمة سر غلط، إلغاء)
2. [x] **قرار متعمّد**: Rate Limiting سابته من غير E2E - اختبار الـ `429` هنا كان هيقفل باقي الـ Auth Endpoints لباقي التستات في نفس الـ Run (نفس الـ IP)، ومغطى بالفعل بالكامل بـ `RateLimitingTests.cs` المعزول على الباك اند

### 🐛 إصلاحين استقرار حقيقيين اتكشفوا أثناء التنفيذ (مش افتراضيين - حصلوا فعليًا أول ما شغّلت الـ Suite الأكبر)
1. أول تشغيل للـ Suite الكامل (20 Test بدل 13) فشل جزئيًا (12 Test) لأن سقف الـ Rate Limiting الافتراضي (10 طلبات/دقيقة) كان بيتلامس فعليًا - كل الطلبات من نفس الـ IP محليًا. اتصلح بإضافة Override في `appsettings.Development.json` (100 طلب/دقيقة) - الإنتاج فاضل على السقف الأصح (10).
2. بعد كده لسه فيه 7 Test فاشلين + 3 Flaky من غير أي 429 في اللوج خالص - السبب الحقيقي كان `expect()` Timeout الافتراضي بتاع Playwright (5 ثواني) قليل قدام تسجيل مستخدمين بالتوازي (BCrypt بطيء عمدًا، بياخد 2.8+ ثانية تحت ضغط). اترفع لـ 15 ثانية في `playwright.config.ts`.

النتيجة: **20/20 E2E Test** نجحوا فعليًا على Backend + DB حقيقيين (مش موك)، مرتين متتاليتين للتأكد.

## فجوة 9: Email Verification, Rate Limiting, Delete Account, كلمة سر أقوى

مراجعة شاملة تانية للمشروع كله بعد فجوة 5-8 كشفت 4 فجوات حقيقية باقية: مفيش تأكيد إيميل بعد التسجيل، مفيش أي Rate Limiting على Endpoints الـ Auth (Brute-force مفتوح)، مفيش Delete Account، وكلمة السر كانت من غير أي قاعدة تعقيد (6 حروف بس).

1. [x] **Email Verification**: `User.EmailConfirmed`/`EmailConfirmationTokenHash`/`EmailConfirmationTokenExpiresAt` + Migration (`AddEmailConfirmation`) — نفس نمط Password Reset بالظبط (توكن Hash بس، One-Time Use، 3 أيام صلاحية)
2. [x] `POST /api/auth/confirm-email` و `POST /api/auth/resend-confirmation` (بيرجع 200 دايمًا منعًا لتسريب معلومة)
3. [x] **قرار متعمّد**: مفيش منع تسجيل دخول للمستخدمين غير المؤكدين — عشان منقفلش على حسابات قديمة/تجريبية. الفرونت اند بس بيعرض بانر + زرار Resend
4. [x] **الفرونت اند**: صفحة `/confirm-email` (بتأكّد أوتوماتيك من غير فورم) + بانر في الداشبورد
5. [x] **Rate Limiting**: `[EnableRateLimiting("AuthEndpoints")]` على `AuthController` بالكامل + `AdminController.Bootstrap` — سقف 10 طلبات/دقيقة لكل IP (Partitioned)، `Microsoft.AspNetCore.RateLimiting` المدمجة (مفيش Package جديد). السقف قابل للتعديل من `appsettings.json` ومقروء وقت كل طلب عن طريق `IOptionsMonitor<RateLimitSettings>` (عشان بيئة الاختبار تقدر ترفعه من غير ما تلمس appsettings.json)
6. [x] **Delete Account**: `DELETE /api/users/{id}` بيتطلب كلمة السر الحالية (زي Change Password)، الاشتراكات بتتمسح Cascade. الفرونت اند: قسم "Danger Zone" في `/profile` مع نافذة تأكيد إضافية
7. [x] **كلمة سر أقوى**: من `MinimumLength(6)` لـ 8 حروف + حرف كبير + حرف صغير + رقم — `PasswordRules.cs` (باك اند) و `password-validators.ts` (فرونت اند) مشتركين، مطبّقين على التسجيل/إعادة التعيين/تغيير كلمة السر كلهم
8. [x] **Tests**: 6 Integration Tests جداد لـ Email Verification، `RateLimitingTests.cs` (فاكتوري خاصة بسقف صغير عشان يتأكد من الـ 429 فعليًا)، 3 Integration Tests لـ Delete Account، Component Tests لـ `ConfirmEmailComponent` وDelete Account في `profile.component.spec.ts`، Test لـ `CategoryNamePipe` اللي كان ناقص من فجوة سابقة

### 🐛 باگ حقيقي اتكشف أثناء التنفيذ (مش جزء من الفجوات المطلوبة، لقيته بالصدفة)
تعديلات سابقة (فجوة 5-8 وشغل تاني) كانت ضايفة قواعد `body.light-theme .selector` جوه CSS Components (زي `.eyebrow`, `.budget-label`, تدرّج خلفية الـ Vanta) عشان تظبط الألوان في الوضع الفاتح — بس القواعد دي **كانت ميتة تمامًا من غير ما يظهر أي خطأ**. السبب: Angular's View Encapsulation بيضيف Attribute Scoping لكل جزء في الـ Selector جوه CSS الكومبوننت، بما فيه `body` نفسه — والـ `body` الحقيقي في الصفحة معندوش الـ Attribute ده أبدًا، فالقاعدة مستحيل تتطابق. اتصلح بـ `:host-context(body.light-theme)` بدل `body.light-theme` — البديل الرسمي بتاع Angular بالظبط للحالة دي (فحص Class على عنصر أب برّه الكومبوننت). اتصلح في 4 ملفات (6 قواعد).

النتيجة: **89/89 Backend Tests** (كانت 75)، **169/169 Frontend Tests** (كانت 153).

## فجوة 5: Forgot Password / Reset Password (Backend + Frontend)

كانت أكبر فجوة فيتشر فعلية في المشروع كله — مفيش أي Flow لاسترجاع كلمة السر، رغم إن `EmailService` جاهز بالفعل (بيستخدم بس للتذكير بالتجديد).

1. [x] **الباك اند**: `PasswordResetTokenHash`/`PasswordResetTokenExpiresAt` في `User` Entity + Migration (`AddPasswordResetToken`)
2. [x] `POST /api/auth/forgot-password` — بيرجع نفس الرد دايمًا (منعًا لتسريب الإيميلات المسجلة)
3. [x] `POST /api/auth/reset-password` — توكن One-Time Use، بينتهي بعد ساعة
4. [x] `IEmailService.SendPasswordResetEmailAsync` + `Frontend:BaseUrl` Setting جديد لبناء لينك الإيميل
5. [x] **الفرونت اند**: صفحات `/forgot-password` و `/reset-password` + `AuthService.forgotPassword()`/`resetPassword()` + لينك في صفحة الدخول
6. [x] **Tests**: 5 Integration Tests (باك اند) + 10 Component Tests (فرونت اند)

### 🐛 Timing Side-Channel اتصلح أثناء التنفيذ نفسه (قبل ما يوصل لأي بيئة حقيقية)
أول تنفيذ لـ `ForgotPasswordAsync` كان بيستنى (`await`) نتيجة إرسال الإيميل فعليًا قبل ما يرجّع الرد للـ Controller. ده معناه وقت الرد كان بيبقى **مختلف بشكل واضح** بين إيميل مسجّل (بينتظر اتصال SMTP كامل، ممكن ياخد ثواني) وإيميل مش مسجّل (بيرجع فورًا من غير ما يعمل حاجة) — يعني حتى لو الـ Response Body نفسه واحد في الحالتين، وقت الرد وحده كان كفاية إنه يسرّب بالظبط المعلومة اللي الـ Endpoint مصمم يمنعها (إيه الإيميلات المسجلة في النظام). اتصلح بجعل إرسال الإيميل Fire-and-Forget (`_ = _emailService.SendPasswordResetEmailAsync(...)` من غير `await`) — الـ Endpoint بيرجع فورًا في الحالتين، والإرسال بيكمل في الخلفية (وأصلًا `EmailService` بيمسك أي Exception جواه ويسجّلها، فمفيش داعي نستنى نتيجته).

النتيجة: **75/75 Backend Tests**، **153/153 Frontend Tests**.

## فجوة 6: Integration Tests لباقي الـ Controllers

كان فيه Integration Tests بس لـ `AuthController` — باقي الـ 7 Controllers (`Subscriptions`, `Categories`, `Tags`, `PaymentMethods`, `Admin`, `Users`, `Analytics`) كانت من غير أي تغطية Integration، رغم إن أهم فحص أمني في المشروع (`CanAccessUser` / 403 لمحاولة الوصول لبيانات مستخدم تاني) موزّع على كل الـ Controllers دي.

1. [x] `SubscriptionsControllerTests` — CRUD + Duplicate + فحص الملكية (403)
2. [x] `CategoriesControllerTests`, `TagsControllerTests`, `PaymentMethodsControllerTests` — CRUD كامل
3. [x] `AdminControllerTests` — Bootstrap (مفتاح غلط / Admin موجود بالفعل)، 403 لمستخدم عادي، إحصائيات، ترقية دور
4. [x] `UsersControllerTests` — بروفايل، تغيير كلمة السر، الميزانية، فحص الملكية
5. [x] `AnalyticsControllerTests` — فحص الملكية على الـ Endpoints التحليلية
6. [x] `IntegrationTestHelpers.cs` (Extension Methods مشتركة) و `FakeEmailService.cs` (بديل `IEmailService` الحقيقي)

### 🐛 استقرار الـ Test Suite
تشغيل كل الـ Integration Test Classes بالتوازي (سلوك xUnit الافتراضي) كان بيسبب فشل عشوائي (`"The entry point exited without ever building an IHost"`, `13 Failed`) — كل Class بيشغّل `WebApplicationFactory` (Host + Kestrel-less Server) كامل لوحده، وتشغيل عدد كبير منهم في نفس اللحظة كان بيخنق الجهاز. اتصلح بـ `xunit.runner.json` (`parallelizeAssembly`/`parallelizeTestCollections: false`) — النتيجة بقت **75/75 مستقرة 100%** بدل ما تاخد 16 دقيقة وتفشل جزئيًا، لبقت 14 ثانية تمام.

## فجوة 7: Component Tests لباقي الـ Components

كان فيه Tests بس لـ 6 من أصل 22 Component (`Toast`, `Dashboard`, وخدمات مرتبطة). باقي الـ 16 اتضافلهم `.spec.ts`.

1. [x] `login`, `register`, `forgot-password`, `reset-password` — فورمات الـ Auth كاملة
2. [x] `admin`, `profile` — صفحات فيها منطق (Toggle Role، تعديل بروفايل/كلمة سر)
3. [x] `category-manager`, `tag-manager`, `payment-method-manager` — مديري البيانات المرجعية (نفس النمط تقريبًا في التلاتة)
4. [x] `subscription-form`, `subscription-list`, `subscription-detail` — أكبر 3 Components في المشروع من ناحية المنطق
5. [x] `reports`, `calendar-view`, `category-spending-chart` — التحليلات والتقارير
6. [x] `theme-switch`, `language-switch`, `confirm-dialog` — الأصغر، بس كانت من غير تغطية خالص

### 🐛 ملحوظة تقنية اتكشفت أثناء كتابة الـ Tests
أي Test بينادي Method فيها `await this.confirmDialogService.confirm(...)` وبعدها بتبعت HTTP Request، لازم يستخدم `fakeAsync`/`tick()` مش `async/await` عادي — لأن فحص `HttpTestingController.expectOne()` فورًا بعد نداء الـ Method (من غير `tick()`) بيسبق تنفيذ الكود اللي بعد الـ `await` (Race Condition حقيقي، مش وهمي — 6 Tests فشلوا بالظبط بالسبب ده أول مرة). ولو الـ Component بينادي `ToastService.show()` الحقيقي (من غير Mock)، لازم `tick(3000)` في الآخر عشان تصرّف الـ `setTimeout` بتاع الإخفاء التلقائي بعد 3 ثواني، وإلا `fakeAsync` هيرفض ينهي الـ Test.

النتيجة: **153/153 Angular Tests**، والـ Production Build نجح من غير أي Compile Errors.

## فجوة 8: E2E Tests حقيقية (Playwright)

مفيش أي E2E Test كان موجود — كل التغطية كانت Unit/Integration بس (Mocked HTTP في الفرونت اند، InMemory DB في الباك اند). ده معناه مفيش ضمان إن النظام الحقيقي (Angular + ASP.NET Core + SQL Server) شغال مع بعض فعلاً.

1. [x] `playwright.config.ts` — بيشغّل الفرونت اند تلقائيًا (`npm start`)، الباك اند لازم يتشغّل يدوي (موثّق في `e2e/README.md`)
2. [x] `auth.spec.ts` — تسجيل حساب، دخول بإيميل غلط، خروج ثم دخول تاني، نسيان/إعادة تعيين كلمة السر (باللينك واللينك الغلط)
3. [x] `subscription.spec.ts` — إضافة/تعديل/حذف اشتراك، وإلغاء حوار التأكيد
4. [x] `admin.spec.ts` — مستخدم عادي ممنوع من `/admin`، Admin حقيقي (عن طريق `POST /api/admin/bootstrap` مباشرة) بيشوف الإحصائيات
5. [x] `e2e/README.md` — خطوات كاملة للتشغيل (قاعدة بيانات تجربة، الـ Bootstrap Key، تحذير من التشغيل على DB إنتاج)

### تجربة فعلية اتعملت أثناء البناء (مش افتراضية)
اتعمل تشغيل حقيقي كامل: `LocalDB` + Migrations + `dotnet run` على بورت 5000 + `npm run e2e`. اكتشفنا مشكلتين حقيقيتين مش هيظهروا في أي بيئة Mocked:
- **الـ Timing Side-Channel** المذكور في فجوة 5 — ظهر أول مرة هنا كـ Test Timeout حقيقي (طلب `forgot-password` كان بياخد لغاية 20+ ثانية لإنه بيحاول يتصل بـ SMTP حقيقي مش موجود).
- **تسجيل مستخدمين كتير بالتوازي (BCrypt بطيء عمدًا) بيخنق LocalDB/الباك اند المحلي** — قللنا `workers` في `playwright.config.ts` لـ 2 بدل عدد الأنوية الافتراضي.

النتيجة: **13/13 E2E Test** نجحوا فعليًا على Backend + DB حقيقيين (مش موك).

## فجوة 1: Admin UI

**الباك اند فيه نظام Admin كامل (`/api/admin/*`)، والفرونت اند معندوش أي واجهة أو حتى بيانات (`role`) تستخدمه.**

## الترتيب

1. [x] **`AuthResponse` model** (`auth.model.ts`) — إضافة حقل `role` (مفقود رغم إن الباك اند بيرجّعه من `AuthResponseDto`)
2. [x] **`Profile` model** (`subscription.model.ts`) — إضافة حقل `role` (مفقود رغم إن الباك اند بيرجّعه من `ProfileDto`)
3. [x] **`UserRole` enum** جديد في الفرونت اند يطابق الباك اند (`User = 0, Admin = 1`)
4. [x] **`AdminService`** (`services/admin.service.ts`) — بيكلم `GET /api/admin/users`, `GET /api/admin/stats`, `PUT /api/admin/users/{id}/role`
5. [x] **`adminGuard`** (`guards/admin.guard.ts`) — بيمنع فتح `/admin` لغير الـ Admin
6. [x] **Route `/admin`** في `app.routes.ts`
7. [x] **`AdminComponent`** — صفحة فيها: إحصائيات النظام (Stats Cards) + جدول المستخدمين + تغيير دور أي مستخدم
8. [x] **لينك لصفحة `/admin`** يظهر بس للـ Admin (في الداشبورد أو التوب بار)
9. [x] **ترجمات** (`ar.json` / `en.json`) لكل نصوص صفحة الـ Admin
10. [x] **Tests** لـ `AdminService` و `adminGuard`
11. [x] تحديث `README` الفرونت اند بقسم Admin UI

النتيجة: **37/37 Angular tests نجحوا** (شاملين 7 تست جداد لـ `AdminService` و`adminGuard`)، والـ Production Build نجح من غير أي Compile Errors.

## فجوة 2: Tests لـ `DashboardComponent`

أكبر Component في المشروع (357 سطر) كان من غير أي Test خالص — منطق حساب مهم فيه (Budget Warning، الفلاتر، الإحصائيات) مكانش متغطي.

1. [x] `dashboard.component.spec.ts` — 10 Tests بتغطي: `isAdmin`, `activeCount`/`expiredCount`/`renewingSoonCount`, `budgetPercentage`/`isOverBudget`, الـ Toast التحذيري (مرة واحدة بس)، `hasActiveFilters`, `clearFilters`, `onLogout`
   - التستات دي مش بتعمل Render كامل للـ Template (تجنّب الاعتماد على كل الـ Child Components المتداخلة زي Vanta/Charts) — بتنادي `ngOnInit()` يدوي وتطلع الـ HTTP Requests بـ `HttpTestingController`، وده أسلوب سليم لتغطية منطق الكومبوننت وحده.

النتيجة: **47/47 Angular tests نجحوا** (10 تست جداد)، والـ Production Build لسه نضيف.

## حاجة واحدة فاضلة — مش قابلة للحل من هنا

- **`environment.prod.ts`** لسه فيه Placeholder دومين (`https://your-production-api.com/api`) — دي مش فجوة كود، دي قيمة محتاجة **دومين إنتاج حقيقي** منك. لو عندك دومين فعلي للباك اند، قولّيه وأحدّثه فورًا.
