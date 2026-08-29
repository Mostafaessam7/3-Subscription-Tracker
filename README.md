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
| [Node.js](https://nodejs.org/) | ‎20.19+‎ / 22.12+‎ (متوافق مع Angular 22) | تشغيل الـ Frontend |
| Angular CLI | `^22.1.0` (بيتثبت مع `npm install`) | أوامر `ng` |

## تشغيل المشروع كامل (أول مرة)

### 1. الـ Backend

```bash
cd CleanArch-updated
dotnet restore
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
Angular (localhost:4200)  →  HTTP + كوكي HttpOnly  →  ASP.NET Core API (localhost:5000)  →  SQL Server
```

- التوكن في **كوكي HttpOnly**، مش في `localStorage`. `auth.interceptor.ts` بيحط `withCredentials: true` على كل طلب عشان المتصفح يبعت الكوكي؛ مفيش `Authorization` Header بيتحط يدوي. المقصود إن أي JavaScript على الصفحة (بما فيه XSS) ميقدرش يقرا التوكن.
- عشان المتصفح بيبعت الكوكي تلقائيًا، فيه حماية CSRF بـ double-submit: كوكي `XSRF-TOKEN` (مقروءة من JS عن قصد) بترجع في هيدر `X-XSRF-TOKEN`.
- الـ API بيتحقق من الـ Token، ولو فيه `{userId}` في الرابط بيتأكد إن صاحب الطلب مصرّح له (نفسه أو Admin).
- الـ CORS بياخد الـ Origins من `appsettings` (مش Hardcoded)، و**لازم** يكون فيه `AllowCredentials()` — من غيره المتصفح بيرفض كل رد فيه كوكي والدخول بيفشل من غير أي خطأ من السيرفر.

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
| Backend | `dotnet test SubscriptionTracker.slnx` (من `CleanArch-updated`) | 109 Test — xUnit (Unit + Integration لكل الـ Controllers) — راجع [قسم Testing في README الباك اند](CleanArch-updated/README.md#testing) |
| Frontend | `npm test` (من `subscription-tracker-app`) | 169 Test — Karma + Jasmine (كل الـ Components والـ Services) — راجع [قسم Testing في README الفرونت اند](subscription-tracker-app/README.md#testing) |
| Frontend (E2E) | `npm run e2e` (من `subscription-tracker-app`) | 28 Test — Playwright على النظام كامل حقيقي (Frontend + Backend)، شامل فحص الإتاحة. راجع [e2e/README.md](subscription-tracker-app/e2e/README.md) |

## CI (GitHub Actions)

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) بيشغّل تلقائيًا على كل `push`/`pull_request` لـ `main`:
- **Backend**: `dotnet build` لكل المشاريع الخمسة + `dotnet test`
- **Frontend**: `npm ci` + `ng test` (Chrome Headless) + `npm run build`

[`.github/workflows/e2e.yml`](.github/workflows/e2e.yml) بيشغّل Playwright كامل على نفس الأحداث، بـ SQL Server حقيقي كـ service container. منفصل عن `ci.yml` لأنه محتاج الباك اند والفرونت اند شغالين مع بعض وقاعدة بيانات حقيقية — واختبارات الإتاحة اتنين منها محتاجين داشبورد بمستخدم مسجّل دخول، فمش ممكن تتعمل كفحص ثابت.

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

## حالة المشروع

[PROJECT-STATUS.md](PROJECT-STATUS.md) فيه الحالة الكاملة والمحدّثة: اللي اتقفل، القرارات
المعتمدة، اللي لسه مفتوح، الـ technical debt، والحاجات اللي اتأجّلت عن قصد وليه. ابدأ منه.

راجع الـ README الخاص بكل مشروع للتفاصيل الكاملة (الـ Architecture، الفيتشرز، الـ Bugs اللي اتصلحت، والقرارات التصميمية).
