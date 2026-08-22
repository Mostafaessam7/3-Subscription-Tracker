# Subscription Tracker

مشروع متابعة الاشتراكات — Backend بـ ASP.NET Core (Clean Architecture) و Frontend بـ Angular. الريبو ده فيه مشروعين منفصلين لازم يشتغلوا مع بعض:

```
3-Subscription Tracker/
├── CleanArch-updated/          ← الـ Backend (ASP.NET Core Web API)
│   └── README.md                 (تفاصيل الطبقات، الـ Roles، الـ Migrations...)
└── subscription-tracker-app/   ← الـ Frontend (Angular)
    └── README.md                 (تفاصيل الكومبوننتس، الفيتشرز، التصميم...)
```

كل مشروع ليه README تفصيلي خاص بيه — الملف ده بس بيوضح **إزاي تشغّل الاتنين مع بعض** كنظام واحد.

## المتطلبات (Prerequisites)

| الأداة | الإصدار | ليه محتاجه |
|---|---|---|
| [.NET SDK](https://dotnet.microsoft.com/download) | `10.0.100` (محدد في `global.json`) | تشغيل الـ Backend |
| SQL Server (أو LocalDB) | أي إصدار حديث | قاعدة البيانات |
| [Node.js](https://nodejs.org/) | ‎18+‎ (متوافق مع Angular 18) | تشغيل الـ Frontend |
| Angular CLI | `^18.2.0` (بيتثبت مع `npm install`) | أوامر `ng` |

## تشغيل المشروع كامل (أول مرة)

### 1. الـ Backend

```bash
cd CleanArch-updated
chmod +x setup-solution.sh
./setup-solution.sh
```

راجع تفصيلًا كامل لخطوات الـ Migrations في [CleanArch-updated/README.md](CleanArch-updated/README.md#️-خطوات-إجبارية-قبل-التشغيل)، وقسم "الإعدادات" تحت لإعداد `appsettings.json`.

بعد ما تعمل الـ Migrations، شغّل السيرفر:

```bash
dotnet run --project src/SubscriptionTracker.Api
```

هيشتغل افتراضيًا على `http://localhost:5000`.

### 2. الـ Frontend

في نافذة Terminal تانية:

```bash
cd subscription-tracker-app
npm install
npm start
```

هيفتح على `http://localhost:4200` تلقائيًا، وبيكلم الـ Backend على `http://localhost:5000` (متظبط في `src/environments/environment.ts`).

> **مهم**: شغّل الـ Backend الأول قبل الـ Frontend، عشان أول طلب (تسجيل دخول/تسجيل حساب) يلاقي السيرفر شغال.

### 3. أول Admin (اختياري)

لو محتاج صلاحيات Admin، اتبع خطوات "إزاي تعمل أول Admin؟" في [CleanArch-updated/README.md](CleanArch-updated/README.md#إزاي-تعمل-أول-admin-خطوة-واحدة-مرة-واحدة-بس).

## إزاي البيانات بتتحرك بين المشروعين

```
Angular (localhost:4200)  →  HTTP + JWT Token  →  ASP.NET Core API (localhost:5000)  →  SQL Server
```

- كل طلب من الفرونت اند بيمر على `auth.interceptor.ts` اللي بيضيف الـ JWT Token تلقائيًا.
- الـ API بيتحقق من الـ Token، ولو فيه `{userId}` في الرابط بيتأكد إن صاحب الطلب مصرّح له (نفسه أو Admin).
- الـ CORS متظبط في `Program.cs` بتاع الـ API عشان يسمح بطلبات من `http://localhost:4200`.

## الإعدادات (Configuration)

نسخة نموذجية من الإعدادات المطلوبة موجودة في [`appsettings.example.json`](CleanArch-updated/src/SubscriptionTracker.Api/appsettings.example.json). انسخها باسم `appsettings.json` (أو `appsettings.Development.json`) واملأ:
- `ConnectionStrings:DefaultConnection`
- `Jwt:Key` (32 حرف على الأقل)
- `Email:Username` / `Email:Password` (App Password لو Gmail)
- `Admin:BootstrapKey`
- `Frontend:BaseUrl` (بيتستخدم في بناء لينك إعادة تعيين كلمة السر جوه الإيميل)

> ⚠️ لو عبّيت أسرار حقيقية (مش Placeholders)، ضيف `appsettings.json` و `appsettings.Development.json` لملف `CleanArch-updated/.gitignore` عشان متترفعش على Git بالغلط. حاليًا الملفين في الريبو فيهم Placeholders بس.

## الترخيص (License)

المشروع تحت رخصة [MIT](LICENSE).

## تشغيل بـ Docker (اختياري)

بدل تشغيل كل مشروع يدوي، تقدر تشغّل النظام كامل (Frontend + Backend + SQL Server) بأمر واحد:

```bash
cp .env.example .env   # واملأ القيم - راجع .env.example للتفاصيل
docker compose up --build
```

- الفرونت اند هيبقى على `http://localhost:4200`
- الباك اند هيبقى على `http://localhost:5000`
- قاعدة البيانات (SQL Server في Container) هتبقى على `localhost:1433`

> ⚠️ القيم في [`.env.example`](.env.example) Placeholders لتجربة محلية بس — غيّرها قبل أي استخدام حقيقي. ملف `.env` نفسه متجاهل في `.gitignore` عشان متترفعش على Git بالغلط.

> **ملحوظة**: أول تشغيل، لازم تعمل الـ Migrations يدوي جوه الـ `api` container (أو تشغّلها من جهازك على `localhost:1433`) زي الموضح في [README الباك اند](CleanArch-updated/README.md#️-خطوات-إجبارية-قبل-التشغيل) — الـ Compose الحالي مبيعملش Migration تلقائي.

## Testing

| المشروع | الأمر | التفاصيل |
|---|---|---|
| Backend | `dotnet test src/SubscriptionTracker.Tests` (من `CleanArch-updated`) | xUnit (Unit + Integration لكل الـ Controllers) — راجع [قسم Testing في README الباك اند](CleanArch-updated/README.md#testing) |
| Frontend | `npm test` (من `subscription-tracker-app`) | Karma + Jasmine (كل الـ Components والـ Services) — راجع [قسم Testing في README الفرونت اند](subscription-tracker-app/README.md#testing) |
| Frontend (E2E) | `npm run e2e` (من `subscription-tracker-app`) | Playwright — النظام كامل حقيقي (Frontend + Backend). راجع [e2e/README.md](subscription-tracker-app/e2e/README.md) |

## CI (GitHub Actions)

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) بيشغّل تلقائيًا على كل `push`/`pull_request` لـ `main`:
- **Backend**: `dotnet build` لكل المشاريع الخمسة + `dotnet test`
- **Frontend**: `npm ci` + `ng test` (Chrome Headless) + `npm run build`

## CD (نشر تلقائي على Azure)

> ⚠️ **ملحوظة صادقة**: الـ Workflow ده اتكتب حسب أفضل الممارسات المعروفة لـ Azure Web Apps for Containers، لكن **مقدرتش أختبره فعليًا** لأنه محتاج Azure Subscription وموارد حقيقية مالوش وصول ليها من هنا. جرّبه على بيئة تجربة الأول قبل ما تعتمد عليه.

[`.github/workflows/cd.yml`](.github/workflows/cd.yml) بيشتغل تلقائيًا **بعد** ما [CI](.github/workflows/ci.yml) ينجح على `main` (`workflow_run` — مش هينشر كود فشل فيه Test):

1. **يبني ويرفع Docker Images** لـ [GitHub Container Registry](https://ghcr.io) (`ghcr.io/<owner>/<repo>/api` و `.../frontend`), بـ tag يساوي الـ commit SHA + `latest`.
2. **ينشر الاتنين** على [Azure Web App for Containers](https://learn.microsoft.com/en-us/azure/app-service/quickstart-custom-container) (اتنين App Services منفصلين — واحد للـ API وواحد للفرونت اند) عن طريق `azure/webapps-deploy`.

### خطوات لازم تعملها إنت قبل أول تشغيل (مرة واحدة بس)

1. **اعمل الموارد على Azure**:
   - 2× [App Service (Linux, Container)](https://portal.azure.com) — واحد للـ API وواحد للفرونت اند
   - [Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/) للباك اند (الـ Workflow ده **مبيعملش Provision** لقاعدة البيانات ولا الـ Migrations تلقائيًا)
2. **حمّل Publish Profile لكل App Service** (من الـ Portal: App Service → Overview → Get publish profile)
3. **في إعدادات الريبو على GitHub** (`Settings → Secrets and variables → Actions`):
   - **Secrets**: `AZURE_WEBAPP_PUBLISH_PROFILE_API`, `AZURE_WEBAPP_PUBLISH_PROFILE_FRONTEND` (محتوى ملفات الـ Publish Profile)
   - **Variables**: `AZURE_WEBAPP_NAME_API`, `AZURE_WEBAPP_NAME_FRONTEND` (أسماء الـ App Services بالظبط)
4. **في إعدادات كل App Service بتاع الـ API** (Configuration → Application settings)، ضيف نفس المتغيرات الموضحة في [appsettings.example.json](CleanArch-updated/src/SubscriptionTracker.Api/appsettings.example.json) بصيغة Environment Variables (`ConnectionStrings__DefaultConnection`, `Jwt__Key`, `Admin__BootstrapKey`...) — الـ Workflow **مبيبعتش** الأسرار دي، لازم تتظبط يدوي على مستوى Azure نفسه.
5. **لو الـ Images بريفت** على GHCR، لازم تربط الـ App Service بـ Registry Credentials (Deployment Center → Registry settings) أو تخلي الـ Packages عامة (Public) من إعدادات الريبو على GitHub.
6. شغّل الـ Migrations مرة واحدة على قاعدة بيانات Azure SQL (زي الموضح في [README الباك اند](CleanArch-updated/README.md#️-خطوات-إجبارية-قبل-التشغيل)) قبل أول طلب حقيقي.

## المساهمة والتاريخ

- [CONTRIBUTING.md](CONTRIBUTING.md) — سير العمل المتوقع، قواعد الكود، إزاي تشغّل الاختبارات قبل أي Commit.
- [CHANGELOG.md](CHANGELOG.md) — تاريخ التغييرات المهمة في المشروع.

## حاجات ناقصة/معروفة (Known Gaps)

- **CD على Azure غير مُختبر فعليًا** (راجع تحذير قسم CD فوق) — الكود مكتوب حسب أفضل الممارسات المعروفة لكن محتاج تجربة على بيئة حقيقية.
- **مفيش Provisioning تلقائي** لموارد Azure (App Services, SQL Database) — لازم تتعمل يدوي مرة واحدة قبل أول Deploy.
- **مفيش CODEOWNERS ولا Issue/PR Templates** — اختياري، مش ضروري لمشروع شخصي.
- **تحذير NuGet واحد لسه موجود**: `System.Security.Cryptography.Xml 9.0.0` (Transitive عن طريق `JwtBearer`) — بيظهر في كل `dotnet build`/`restore`. مفيش قرار مطلوب منك بخصوصه (مش استخدام مباشر في الكود، والترقية محتاجة تحديث حزمة `JwtBearer` نفسها من مايكروسوفت).
- **`environment.prod.ts`** لسه فيه دومين Placeholder (`https://your-production-api.com/api`) — محتاج دومين إنتاج حقيقي قبل أي Deploy فعلي.
- **8 ثغرات أمنية عالية في `@angular/core` نفسه** (XSS متنوعة - راجع `npm audit` في `subscription-tracker-app`) — التصليح متاح بس محتاج ترقية Angular من v18 لـ v22 (**4 Majors دفعة واحدة**، Breaking Change حقيقي)، فمحتاج قرار وتجربة شاملة قبل ما نعملها، مش حاجة نعملها بـ `--force` من غير تفكير (زي قرار jspdf السابق بالظبط).
- **Rate Limiting لسه مش متغطي بـ E2E عمدًا** — مغطى بالكامل ومضمون بـ `RateLimitingTests.cs` على الباك اند (فاكتوري معزولة بسقف صغير خاص بيها)، لكن تكرار نفس الاختبار في E2E هيقفل باقي الـ Auth Endpoints لباقي الـ Suite (نفس الـ IP). راجع [`e2e/README.md`](subscription-tracker-app/e2e/README.md) للتفاصيل.

> ✅ **اتصلح**: Forgot Password/Reset Password، Email Verification (تأكيد الإيميل بعد التسجيل)، Rate Limiting على كل Endpoints الـ Auth (منع Brute-force)، قواعد كلمة سر أقوى (8 حروف + حرف كبير/صغير/رقم)، Delete Account، Integration Tests لكل الـ Controllers، Component Tests لكل الـ Components، E2E Tests (Playwright - دلوقتي 20 Test شاملين تأكيد الإيميل ومسح الحساب)، وثغرة `AutoMapper` الأمنية (اتشال نهائيًا واتستبدل بـ Mapping يدوي بسيط - راجع [README الباك اند](CleanArch-updated/README.md#أهم-التغييرات-التقنية)). راجع [CHANGELOG.md](CHANGELOG.md) و[GAPS.md](GAPS.md) للتفاصيل.

راجع الـ README الخاص بكل مشروع للتفاصيل الكاملة (الـ Architecture، الفيتشرز، الـ Bugs اللي اتصلحت، والقرارات التصميمية).
