# الفجوات الناقصة — الفرونت اند

الملف ده بيتبع تنفيذ الفجوات اللي اتلقت في الفرونت اند. كل بند بيتحدّث لـ ✅ أول ما يتعمل ويتفحص فعليًا.

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
