# Changelog

كل التغييرات المهمة في المشروع. الشكل مبني على [Keep a Changelog](https://keepachangelog.com/) تقريبًا — بدون أرقام إصدار رسمية لحد دلوقتي لأن المشروع لسه من غير Git Tags.

## [Unreleased]

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
