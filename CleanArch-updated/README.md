# Subscription Tracker API — Clean Architecture

النسخة دي إعادة هيكلة كاملة للباك اند من مشروع واحد (Controllers → DbContext مباشرة) لـ **4 مشاريع منفصلة** بتتبع مبادئ Clean Architecture. السلوك الوظيفي (كل الـ Endpoints، الـ Business Logic) **متطابق 100%** مع النسخة القديمة — الفرق كله في **البنية والتنظيم**، مش في الفيتشرز.

## المتطلبات (Prerequisites)

| الأداة | الإصدار | ملاحظة |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | `10.0.100` | محدد في `global.json` بـ `rollForward: latestMinor` |
| SQL Server / SQL Server Express / LocalDB | أي إصدار حديث | لازم يكون شغال قبل أي Migration |
| EF Core CLI Tools | يتوافق مع `Microsoft.EntityFrameworkCore.Design 10.0.0` | `dotnet tool install --global dotnet-ef` لو مش متثبت |

## ليه عملنا الهيكلة دي؟

في النسخة القديمة، كل حاجة كانت في مشروع واحد (`SubscriptionTracker.Api`)، والـ Controllers كانت أحيانًا بتتكلم مع `AppDbContext` مباشرة (زي `CategoriesController`, `UsersController`). ده شغال كويس لمشروع صغير، لكنه بيبقى صعب الصيانة والاختبار كل ما المشروع يكبر، لأن:
- الـ Business Logic والـ Data Access مبعوتين في نفس الطبقة
- صعب تستبدل SQL Server بحاجة تانية من غير ما تلمس منطق العمل
- صعب تعمل Unit Tests للـ Controllers لوحدها من غير قاعدة بيانات حقيقية

## هيكل المشاريع الأربعة

```
CleanArch/
├── SubscriptionTracker.sln          ← هيتولد لما تشغّل setup-solution.sh
├── global.json
├── setup-solution.sh                ← شغّله مرة واحدة بعد فك الضغط
└── src/
    ├── SubscriptionTracker.Domain/          ← الطبقة الأعمق - مفيهاش أي Dependency خارجي
    │   ├── Entities/                        (User, Subscription, Category, PaymentMethod, Tag)
    │   ├── Enums/                           (BillingCycle, Currency, SubscriptionStatus, PaymentMethodType)
    │   └── Common/                          (BaseEntity, BillingCycleHelper)
    │
    ├── SubscriptionTracker.Application/     ← منطق العمل (Business Logic) - بيرجع على Domain بس
    │   ├── DTOs/
    │   ├── Interfaces/
    │   │   ├── Repositories/                (IGenericRepository, IUnitOfWork, ISubscriptionRepository...)
    │   │   └── Services/                    (ISubscriptionService, IAuthService, IPasswordHasher...)
    │   ├── Services/                        (التنفيذ الفعلي لمنطق العمل - بيستخدم IUnitOfWork بس)
    │   ├── Mapping/                         (Extension Methods - MappingExtensions.cs)
    │   ├── Validators/                      (FluentValidation)
    │   └── Settings/                        (JwtSettings, EmailSettings - Options Pattern)
    │
    ├── SubscriptionTracker.Infrastructure/  ← التفاصيل التقنية - بيرجع على Application
    │   ├── Persistence/
    │   │   ├── AppDbContext.cs
    │   │   ├── Configurations/              (إعداد كل Entity في ملف منفصل بدل OnModelCreating ضخم)
    │   │   └── Repositories/                (التنفيذ الفعلي - GenericRepository, UnitOfWork)
    │   ├── Security/                        (BCryptPasswordHasher, TokenService)
    │   ├── Services/                        (EmailService)
    │   └── BackgroundServices/              (RenewalReminderBackgroundService)
    │
    └── SubscriptionTracker.Api/             ← الطبقة الخارجية - بيرجع على Application و Infrastructure
        ├── Controllers/                      (بقت Thin جدًا - بتنادي Application Services بس)
        ├── Middleware/                       (GlobalExceptionHandler)
        └── Program.cs                        (Composition Root)
```

## قاعدة الاعتماد (Dependency Rule) — أهم حاجة في Clean Architecture

```
Api  →  Infrastructure  →  Application  →  Domain
Api  →  Application  →  Domain
```

**السهم بيوضح "بيعتمد على"، والاتجاه دايمًا للجوّه.** يعني:
- الـ Domain مايعرفش حاجة عن أي حاجة تانية خالص (مفيهوش حتى EF Core)
- الـ Application بيعرف Domain بس، ومايعرفش SQL Server ولا BCrypt ولا JWT بالتحديد (بيتعامل مع Interfaces زي `IPasswordHasher`)
- الـ Infrastructure هي اللي بتـ"نفّذ" الـ Interfaces دي فعليًا (BCrypt الحقيقي، JWT الحقيقي، EF Core الحقيقي)
- الـ Api هي نقطة التجميع اللي بتوصّل كل حاجة ببعض عن طريق Dependency Injection

## أهم التغييرات التقنية

### 1. Repository Pattern + Unit of Work
بدل ما كل Service يتكلم مع `AppDbContext` مباشرة، دلوقتي فيه:
- `IGenericRepository<T>`: عمليات أساسية مشتركة (Query, GetById, Add, Update, Remove)
- Repository متخصص لكل Entity (`ISubscriptionRepository` فيه كمان `QueryWithDetails()` للـ Eager Loading)
- `IUnitOfWork`: بيجمع كل الـ Repositories، وبيضمن إن كل التعديلات في نفس العملية بتتحفظ مع بعض دفعة واحدة

### 2. Mapping مركزي (Extension Methods)
كل دالة `MapToDto` يدوية اتشالت، ومكانها `MappingExtensions.cs` واحد فيه Extension Method (`ToDto()`) لكل Entity.

> 🐛 **كان AutoMapper في الأول، اتشال وبقى Mapping يدوي بسيط**: AutoMapper 13.0.1 فيه ثغرة أمنية معروفة (`GHSA-rvv3-g6hj-g44x` - Denial of Service عن طريق Recursion) من غير Patch مجاني متاح — النسخة اللي فيها التصليح (15.1.1+) بقت مرخّصة تجاريًا بعد ما المكتبة اتباعت في يوليو 2025 ([التفاصيل](https://luckypennysoftware.com/faq)). بما إن الـ Mapping هنا بسيط (5 DTOs مسطّحة، مفيش تعقيد حقيقي يستاهل Reflection وقت التشغيل)، الحل الأنضف كان نستبدله بـ Extension Methods عادية بدل ما نمشي في قرار ترخيص تجاري لحاجة صغيرة أصلًا.

### 3. FluentValidation بدل بعض الـ Data Annotations
الـ Validators بقت في كلاسات منفصلة (`Validators/`)، وبتتفعّل تلقائيًا عن طريق `AddFluentValidationAutoValidation()` — لو الطلب مش صالح، بيرجع 400 تلقائيًا زي ما كان بيحصل قبل كده.

### 4. Global Exception Handling
أي Exception مش متوقع في أي مكان في التطبيق بيتمسك مركزيًا في `GlobalExceptionHandler.cs` (بيستخدم `IExceptionHandler` بتاع .NET 8+)، ويرجّع رد JSON موحّد بدل الـ Stack Trace الخام.

### 5. Options Pattern بدل الـ String Indexing
بدل `_configuration.GetSection("Jwt")["Key"]` (نص حر عرضة لأخطاء إملائية)، دلوقتي `JwtSettings` و `EmailSettings` كلاسات حقيقية بتتربط تلقائيًا بـ `appsettings.json`.

### 6. EF Configurations منفصلة
بدل `OnModelCreating` ضخم فيه كل حاجة، كل Entity ليه ملف Configuration منفصل (`SubscriptionConfiguration.cs`, `CategoryConfiguration.cs`...) في مجلد `Persistence/Configurations`.

---

## ⚠️ خطوات إجبارية قبل التشغيل

### 1. تجميع الـ Solution (مرة واحدة بس)
```bash
cd CleanArch
chmod +x setup-solution.sh   # لو محتاج
./setup-solution.sh
```
لو مش عايز تستخدم الـ Script، الأوامر يدوي:
```bash
dotnet new sln -n SubscriptionTracker
dotnet sln add src/SubscriptionTracker.Domain/SubscriptionTracker.Domain.csproj
dotnet sln add src/SubscriptionTracker.Application/SubscriptionTracker.Application.csproj
dotnet sln add src/SubscriptionTracker.Infrastructure/SubscriptionTracker.Infrastructure.csproj
dotnet sln add src/SubscriptionTracker.Api/SubscriptionTracker.Api.csproj
dotnet sln add src/SubscriptionTracker.Tests/SubscriptionTracker.Tests.csproj
dotnet restore
```

### 2. Migration جديدة بالكامل (مهم جدًا تقرا الجزء ده)

**الـ Migrations القديمة (اللي كانت عندك في المشروع القديم) مش هتشتغل هنا خالص.** السبب: الـ Entities والـ DbContext اتنقلوا لـ Namespace مختلف تمامًا (`SubscriptionTracker.Domain.Entities` بدل `SubscriptionTracker.Api.Models`، و `SubscriptionTracker.Infrastructure.Persistence.AppDbContext` بدل `SubscriptionTracker.Api.Data.AppDbContext`). الحل الوحيد هو **تعمل Migration جديدة من الصفر**.

> **لو عندك بيانات حقيقية في قاعدة البيانات القديمة عايز تحافظ عليها**: صدّرها الأول كـ CSV من صفحة التقارير في التطبيق (الفيتشر ده موجود بالفعل)، أو اعمل Backup يدوي لقاعدة البيانات القديمة قبل ما تكمل. لو المشروع لسه في مرحلة تجربة (زي أغلب الوقت)، ماشي عادي تمسح القديمة وتبدأ جديدة.

الأوامر (لازم تتشغّل من مجلد `CleanArch` نفسه، مش جوه أي مشروع فرعي):
```bash
dotnet ef migrations add InitialCreate \
  --project src/SubscriptionTracker.Infrastructure \
  --startup-project src/SubscriptionTracker.Api \
  --output-dir Persistence/Migrations

dotnet ef database update \
  --project src/SubscriptionTracker.Infrastructure \
  --startup-project src/SubscriptionTracker.Api
```

**ليه الأوامر شكلها مختلف عن قبل؟** لأن الـ `DbContext` دلوقتي في مشروع `Infrastructure` مش في نفس مشروع التشغيل (`Api`)، فمحتاجين نوضح لـ EF Core مين المشروع اللي فيه الـ `DbContext` (`--project`) ومين مشروع التشغيل الفعلي اللي فيه الإعدادات (`--startup-project`).

### 3. تشغيل المشروع
```bash
dotnet run --project src/SubscriptionTracker.Api
```
أو لو فاتح بـ Visual Studio: افتح `SubscriptionTracker.sln` بعد ما تشغّل `setup-solution.sh`، وحدد `SubscriptionTracker.Api` كمشروع بدء التشغيل (Startup Project).

### 4. Swagger / OpenAPI

في بيئة الـ Development بس (`app.Environment.IsDevelopment()` في `Program.cs`)، بيتفتح Swagger UI تلقائيًا على:
```
http://localhost:5000/swagger
```
فيه زرار "Authorize" بيقبل الـ JWT Token مباشرة (`Bearer {token}`) عشان تقدر تجرب أي Endpoint محمي من غير Postman. **في الإنتاج Swagger بيتقفل تلقائيًا** لأنه مسجّل جوه شرط `IsDevelopment()` بس.

---

## Logging حقيقي (Serilog)

بدل الـ `ILogger<T>` الأساسي بس، دلوقتي فيه **Serilog** كامل بيسجّل في مكانين مع بعض:
- **Console**: عشان تشوف اللوجز وانت شغّال في Development
- **ملفات**: `Logs/log-yyyyMMdd.txt` — ملف جديد كل يوم، وبيحتفظ بآخر 14 يوم بس (القديم بيتشال تلقائيًا)

### إيه اللي بيتسجّل؟
- **كل Request** بيوصل للسيرفر (المسار، الوقت اللي اتاخد، الـ Status Code) عن طريق `app.UseSerilogRequestLogging()`
- **أي Exception** غير متوقع (عن طريق `GlobalExceptionHandler` اللي بقى بيستخدم `ILogger<T>` العادي، وSerilog بيمسكه من تحت لأنه هو اللي مسجّل كـ Logging Provider الافتراضي للتطبيق كله)
- **بداية ونهاية تشغيل التطبيق** نفسه (مفيد جدًا لو التطبيق وقع فجأة تعرف السبب من آخر سطر في اللوج)

### تخصيص المستوى (Level) من appsettings.json
قسم `Serilog` في `appsettings.json` بيسمحلك تتحكم في مستوى التفصيل من غير ما تلمس الكود:
```json
"Serilog": {
  "MinimumLevel": {
    "Default": "Information",
    "Override": {
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  }
}
```
في `appsettings.Development.json` مظبوطة على `Debug` (تفاصيل أكتر وانت بتطوّر)، وفي الإنتاج تقدر تخليها `Information` أو `Warning` بس.

### ⚠️ ملحوظة
مجلد `Logs/` بيتولد تلقائيًا أول ما تشغّل التطبيق (مكانه: `src/SubscriptionTracker.Api/Logs/`)، ومش المفروض يترفع على Git — مضاف في `.gitignore` بالفعل.

## Roles & Permissions (Admin)

### 🐛 ثغرة أمنية حقيقية اكتشفتها وصلّحتها
`GET /api/users` كان بيرجّع **كل المستخدمين** لأي حد مسجّل دخول (مش بس Admin) — يعني أي مستخدم عادي كان يقدر يشوف إيميلات كل المستخدمين التانيين. وأخطر من كده: **كل الـ Endpoints اللي فيها `{userId}` في الرابط** (زي `GET /api/subscriptions/user/{userId}`) كانت بتشتغل لأي `userId` تحطه، مش بس بتاعك انت — يعني أي مستخدم كان يقدر يغيّر الرقم في الرابط ويشوف بيانات حد تاني بالكامل (اشتراكاته، ميزانيته، تحليلاته). الاتنين اتصلحوا دلوقتي بالكامل.

### إيه اللي اتضاف؟
- **`UserRole` enum** (`User` / `Admin`) — عمود جديد `Role` في جدول `Users`، كل حساب بيتسجّل بيبقى `User` افتراضيًا (مفيش طريقة تسجّل نفسك كـ Admin)
- **الدور بقى جزء من الـ JWT Token** نفسه (`ClaimTypes.Role`) — بيتقرا تلقائيًا مع كل طلب من غير أي Query إضافية لقاعدة البيانات
- **`ApiControllerBase`**: كلاس أساسي فيه `CurrentUserId`, `IsAdmin`, `CanAccessUser(userId)` — أي Controller محتاج يتحقق من الملكية بيرث منه
- **فحص الملكية مطبّق على**: كل Endpoints الاشتراكات، التحليلات، والبروفايل/الميزانية — لو مش بتاعك ومش Admin، بترجع `403 Forbidden`
- **`AdminController` جديد** (`/api/admin`):

| Method | Endpoint | الوصف | محمي؟ |
|---|---|---|---|
| POST | `/api/admin/bootstrap` | إنشاء أول Admin في النظام (مرة واحدة بس) | مفتاح سري بس، بيرفض لو فيه Admin أصلًا |
| GET | `/api/admin/users` | كل المستخدمين + عدد اشتراكاتهم ومصروفهم الشهري | Admin بس |
| GET | `/api/admin/stats` | إحصائيات عامة (عدد المستخدمين، إجمالي الاشتراكات النشطة، إجمالي المصروف، مستخدمين جدد آخر 30 يوم) | Admin بس |
| PUT | `/api/admin/users/{userId}/role` | ترقية/تخفيض دور مستخدم | Admin بس |

### ⚠️ ده فعليًا Breaking Change (خلاف الادعاء اللي كان هنا قبل كده)
كنا بنقول قبل كده إن "مفيش أي Endpoint اتغيّر" — ده بقى مش دقيق 100% بعد الجولة دي:
1. **`GET /api/users` (كل المستخدمين) اتشال نهائيًا** — البديل: `GET /api/admin/users` (محتاج Admin)
2. **`AuthResponseDto` و `ProfileDto` بقى فيهم حقل `role` جديد** — الفرونت اند (`AuthResponse`, `Profile` في `subscription-tracker-app`) بقى فيه الحقل ده بالفعل، وفيه واجهة Admin كاملة على `/admin` بتستخدمه (راجع [README الفرونت اند](../subscription-tracker-app/README.md#لوحة-تحكم-الأدمن-admin))
3. **أي Endpoint فيه `{userId}` ممكن يرجع `403`** دلوقتي لو حاولت توصل لبيانات مستخدم مش انت (ده التصليح الأمني نفسه)

باقي كل حاجة تانية (الـ Routes، شكل باقي الـ DTOs، منطق العمل) **زي ما هي بالظبط**.

### إزاي تعمل أول Admin؟ (خطوة واحدة، مرة واحدة بس)
1. غيّر `Admin:BootstrapKey` في `appsettings.json` لقيمة عشوائية طويلة (زي أي Secret تاني)
2. ابعت الطلب ده مرة واحدة (من Swagger أو Postman):
```http
POST /api/admin/bootstrap
{
  "bootstrapKey": "نفس القيمة اللي حطيتها في appsettings.json",
  "name": "اسمك",
  "email": "admin@example.com",
  "password": "كلمة سر قوية"
}
```
3. هيرجّعلك رد زي `/api/auth/login` بالظبط (Token جاهز تستخدمه فورًا كـ Admin)
4. **بعد أول مرة، الـ Endpoint ده بيرفض يشتغل تاني** طول ما فيه Admin واحد على الأقل في النظام — آمن حتى لو حد لقى الـ Bootstrap Key بعدين

> ✅ الـ Migration بتاعة `Role` (`AddUserRoles`) متضافة ومتبعة في الريبو بالفعل (كانت لفترة ناقصة من الـ Migrations المتتبعة رغم إن الكود بيفترض وجودها — ده كان هيسبب `dotnet ef database update` يفشل بـ `PendingModelChangesWarning` لأي حد يعمل Clone جديد؛ اتصلح دلوقتي). مش محتاج تعمل حاجة إضافية غير خطوات "Migration جديدة بالكامل" في الأول.

## نسيان / إعادة تعيين كلمة السر (Forgot / Reset Password)

| Method | Endpoint | الوصف |
|---|---|---|
| POST | `/api/auth/forgot-password` | بيرجع `200` **دايمًا** (حتى لو الإيميل مش مسجل) عشان محدش يقدر يكتشف الإيميلات المسجلة في النظام (User Enumeration). لو الإيميل مسجل فعلًا، بيتولّد توكن عشوائي (32 بايت، Cryptographically Secure) ويتخزن Hash بتاعه بس (SHA-256) في `Users.PasswordResetTokenHash` مع تاريخ انتهاء ساعة واحدة، وبيتبعت إيميل فيه لينك لـ `{Frontend:BaseUrl}/reset-password?token=...` |
| POST | `/api/auth/reset-password` | بياخد `token` + `newPassword`، بيرجع `400` لو التوكن غلط/منتهي/اتستخدم قبل كده. لو صح، بيغيّر الباسورد ويمسح التوكن فورًا (One-Time Use) |

- **إرسال الإيميل مش بيوقف الرد**: `AuthService.ForgotPasswordAsync` عمدًا مابيستناش (`await`) نتيجة إرسال الإيميل قبل ما يرجّع الرد — لو استنى، وقت الرد كان هيبقى مختلف بشكل واضح بين إيميل موجود (بينتظر اتصال SMTP) وإيميل مش موجود (بيرجع فورًا)، وده Timing Side-Channel كان هيسرّب بالظبط المعلومة اللي إحنا بنحاول نمنعها.
- **إعداد جديد مطلوب**: `Frontend:BaseUrl` في `appsettings.json` (افتراضيًا `http://localhost:4200`) — بيتحدد بيه دومين اللينك جوه إيميل إعادة التعيين.
- Migration: `AddPasswordResetToken` (عمودين جداد Nullable في `Users`: `PasswordResetTokenHash`, `PasswordResetTokenExpiresAt`).

## تأكيد الإيميل (Email Verification)

نفس نمط Forgot/Reset Password بالظبط (توكن عشوائي، Hash بس بيتخزن، One-Time Use):

| Method | Endpoint | الوصف |
|---|---|---|
| POST | `/api/auth/confirm-email` | بياخد `token`، بيرجع `400` لو غلط/منتهي/اتستخدم قبل كده. لو صح، بيحط `Users.EmailConfirmed = true` |
| POST | `/api/auth/resend-confirmation` | بياخد `email`، بيرجع `200` **دايمًا** (زي forgot-password، منعًا لتسريب معلومة) |

- **مفيش منع تسجيل دخول للمستخدمين غير المؤكدين** - قرار متعمّد عشان منقفلش على حسابات قديمة أو تجريبية معملتلهاش Migration. `AuthResponseDto.EmailConfirmed` بيوصل للفرونت اند عشان يعرض تنبيه بس، من غير ما يمنع الاستخدام.
- التوكن صلاحيته 3 أيام (أطول من الساعة بتاعة Password Reset - عادي محتاج وقت أطول عشان تفتح الإيميل).
- Migration: `AddEmailConfirmation` (`EmailConfirmed`, `EmailConfirmationTokenHash`, `EmailConfirmationTokenExpiresAt`).

## Rate Limiting

كل Endpoints الـ Auth (`AuthController` بالكامل + `AdminController.Bootstrap`) عليها `[EnableRateLimiting("AuthEndpoints")]` - سقف 10 طلبات/دقيقة لكل IP (Partitioned، مش سقف مشترك بين كل المستخدمين)، باستخدام `Microsoft.AspNetCore.RateLimiting` المدمجة في .NET (مفيش Package خارجي). أي طلب زيادة بيرجع `429 Too Many Requests`.

- السقف مقروء من `appsettings.json` (`RateLimiting:AuthEndpoints:PermitLimit`/`WindowSeconds`) عن طريق `IOptionsMonitor<RateLimitSettings>` بيتقرا وقت كل طلب - عشان بيئة الاختبار تقدر ترفعه بـ `services.Configure<RateLimitSettings>()` من غير ما تلمس appsettings.json.

## مسح الحساب (Delete Account)

`DELETE /api/users/{id}` - بياخد كلمة السر الحالية للتأكيد (زي Change Password بالظبط، ومقصودة إنها `CurrentUserId` بس حتى الأدمن مايقدرش يمسح حساب حد تاني). الاشتراكات بتتمسح Cascade تلقائي على مستوى الـ DB (`OnDelete(DeleteBehavior.Cascade)` موجودة أصلًا في `SubscriptionConfiguration.cs`).

## Testing

مشروع `SubscriptionTracker.Tests` (xUnit) بيغطي المنطق اللي مالوش علاقة بقاعدة البيانات مباشرة:
- **`BillingCycleHelperTests`**: كل حالات تحويل دورة الدفع (أسبوعي/شهري/ربع سنوي/سنوي) لمكافئ شهري وسنوي.
- **`BCryptPasswordHasherTests`**: الـ Hash بيطلع مختلف عن الباسورد الأصلي، وبيطلع Salt مختلف كل مرة، والـ Verify بيرجع صح/غلط صح.
- **`RegisterDtoValidatorTests` / `CreateSubscriptionDtoValidatorTests`**: قواعد الـ FluentValidation (طول الباسورد، شكل الإيميل، مدى السعر، شكل رابط الموقع).
- **Integration Tests (`WebApplicationFactory<Program>` + EF Core InMemory)**: بتشغّل التطبيق كامل Controller → Service → Repository → DbContext من غير أي Mocking للطبقات الداخلية، وبتغطي دلوقتي كل الـ Controllers:
  - **`AuthControllerTests`**: تسجيل/دخول، ونسيان/إعادة تعيين كلمة السر (تحقق من إيميل غير موجود بيرجع نفس الرد، توكن غلط/منتهي/One-Time Use)
  - **`SubscriptionsControllerTests`**: CRUD + Duplicate + فحص الملكية (403 لو حاولت توصل لاشتراك مستخدم تاني)
  - **`CategoriesControllerTests`**, **`TagsControllerTests`**, **`PaymentMethodsControllerTests`**: CRUD كامل
  - **`AdminControllerTests`**: Bootstrap (بمفتاح غلط / لما يكون فيه Admin بالفعل)، وصول مستخدم عادي (403)، إحصائيات، ترقية دور
  - **`UsersControllerTests`**: بروفايل، تغيير كلمة السر، الميزانية، وفحص الملكية
  - **`AnalyticsControllerTests`**: تحليلات الإنفاق والـ Insights + فحص الملكية
  - `IntegrationTestHelpers.cs` فيه Extension Methods مشتركة (`RegisterUserAsync`, `BootstrapOrLoginAdminAsync`, `AuthenticateAs`) بدل ما نكررها في كل ملف
  - `FakeEmailService` بديل `IEmailService` الحقيقي في كل الـ Tests دي - عشان محدش يحاول يتصل بـ SMTP فعلي وقت التستات (هيفشل دايمًا بإعدادات appsettings.json الافتراضية)، وبيسجّل آخر إيميل اتبعت عشان تستخدمه الـ Tests (زي استخراج توكن إعادة التعيين)

> ⚠️ الـ Integration Tests بتشتغل بالتوازي افتراضيًا (xUnit) - كل Test Class بيشغّل Host كامل لوحده، وده كان بيسبب Timeouts وهمية على أجهزة أضعف. `xunit.runner.json` بيقفل الـ Parallelization (`parallelizeAssembly`/`parallelizeTestCollections: false`) عشان الاستقرار، على حساب وقت تشغيل أطول شوية.

- **`BillingCycleHelperTests`**, **`BCryptPasswordHasherTests`**, **`RegisterDtoValidatorTests`**, **`CreateSubscriptionDtoValidatorTests`**: Unit Tests للمنطق اللي مالوش علاقة بقاعدة البيانات مباشرة.

```bash
dotnet test src/SubscriptionTracker.Tests
```

## CORS

الـ Policy الحالي (`AllowAngularApp` في `Program.cs`) بيسمح **بس** بطلبات من `http://localhost:4200` (`AllowAnyHeader` + `AllowAnyMethod`، لكن الـ Origin مثبّت Hardcoded). لو الفرونت اند هيتنشر على دومين تاني (Production)، لازم تعدّل الـ Origin ده — الأفضل تحوّله لقيمة تتقرا من `appsettings.json` (`Cors:AllowedOrigins`) بدل ما يفضل مكتوب في الكود مباشرة.

## النشر (Deployment) / متغيرات بيئة الإنتاج

المشروع مفيهوش لسه Pipeline نشر جاهز، لكن أهم حاجات لازم تتظبط قبل أي نشر حقيقي:

1. **الأسرار**: متسيبش `Jwt:Key` أو `Admin:BootstrapKey` أو `Email:Password` في `appsettings.json` نفسه وقت النشر — استخدم [Environment Variables](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/#environment-variables) (`Jwt__Key`, `Admin__BootstrapKey`...) أو [User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets) في التطوير، أو خدمة Secrets حقيقية (Azure Key Vault, AWS Secrets Manager) في الإنتاج.
2. **Connection String** لازم يتغيّر لسيرفر SQL حقيقي (مش `Server=.`).
3. **CORS** لازم يتحدّث لدومين الفرونت اند الحقيقي (راجع قسم CORS فوق).
4. **`ASPNETCORE_ENVIRONMENT=Production`** لازم يكون متظبط عشان Swagger يتقفل تلقائيًا ويستخدم `appsettings.Production.json` (لو موجود) بدل `appsettings.Development.json`.
5. **Migrations**: شغّل `dotnet ef database update` مرة واحدة على قاعدة بيانات الإنتاج قبل أول تشغيل (أو استخدم `dotnet ef migrations script` عشان تولّد SQL script تراجعه الأول).
6. راجع [Dockerfile](../Dockerfile) في جذر الريبو للنشر كـ Container.

## هل كل الـ Endpoints زي ما هي؟

**بعد إضافة الـ Roles، لأ مش كلها زي ما هي 100%** — راجع قسم "Roles & Permissions" فوق للتفاصيل الكاملة. غير كده، كل الـ Routes، أسماء الـ Query Parameters، وشكل باقي الـ Request/Response Bodies **متطابقين** مع النسخة القديمة.

## إيه اللي **معمولش** لسه من متطلبات "Clean Architecture" الكاملة

كنت صريح قبل كده إن الدوكيومنت الأصلي طالب حاجات إضافية زي Roles/Permissions، AI Features، وUnit Tests. الجولة دي ركّزت بس على:
- ✅ Clean Architecture (4 طبقات + قاعدة الاعتماد الصحيحة)
- ✅ Repository Pattern + Unit of Work
- ✅ Mapping مركزي (Extension Methods بدل AutoMapper - راجع الملحوظة في قسم "أهم التغييرات التقنية")
- ✅ FluentValidation
- ✅ Global Exception Handling
- ✅ Configuration Management (Options Pattern)
- ✅ Logging (Serilog كامل - Console + ملفات، مع Request Logging تلقائي)
- ✅ Role-Based Authorization (Admin/User + فحص ملكية البيانات على كل Endpoint حساس)

**لسه مش موجود**: Integration Tests حقيقية للـ Controllers/Repositories مع قاعدة بيانات (راجع قسم "Testing" فوق — Unit Tests الأساسية بقت موجودة دلوقتي في `SubscriptionTracker.Tests`)، الـ AI Features.
