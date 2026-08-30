# حالة المشروع — Subscription Tracker

> آخر تحديث: 2026-08-29. الملف ده بيوصف **المشروع ده لوحده**. كل مشروع في الـ workspace
> ليه ملف زيه وحالته مستقلة تمامًا — متقيسش حاجة هنا على مشروع تاني.

---

## 1. اللي اتعمل واتقفل

### أمان وهوية
- **التوكن اتنقل لكوكي HttpOnly** بدل `localStorage`، فأي JavaScript على الصفحة (بما فيه XSS)
  مبقاش يقدر يقراه. اللي فاضل في `localStorage` بيانات عرض بس (`subscription_tracker_user`).
- **حماية CSRF** بـ double-submit (`CsrfProtectionMiddleware` + كوكي `XSRF-TOKEN` وهيدر
  `X-XSRF-TOKEN`) — لازمة لأن المتصفح بقى بيبعت الكوكي تلقائيًا.
- **`AllowCredentials()` في الـ CORS**. من غيره المتصفح بيرفض كل رد فيه كوكي، والدخول والتسجيل
  كانوا **مكسورين فعليًا** بعد نقل الكوكي. مفيش اختبار سيرفر يقدر يمسك ده — القاعدة بينفّذها
  المتصفح، فكل الـ 109 Test كانوا بينجحوا والتطبيق مكسور.
- **`SecretsValidator`** بيمنع الإقلاع في الإنتاج لو الأسرار لسه Placeholders. الكشف بالنمط
  (pattern) مش بقائمة قيم معروفة، عشان أي Placeholder جديد يتمسك كمان.
- **Rate Limiting** على كل Endpoints الـ Auth، مع Override في `appsettings.Development.json`
  (100/دقيقة بدل 10) عشان الـ E2E Suite تقدر تسجّل مستخدم لكل Test من غير ما تتقفل.

### تشغيل وجاهزية
- **Health checks**: `/health/live` و `/health/ready`.
- **API Versioning**: `VersionedRouteConvention` بتضيف `api/v1/...` جنب المسار القديم من غير ما
  تشيله، فالفرونت اند الحالي مكمّل شغال. الإصدار بيتقرا من المسار
  (`UrlSegmentApiVersionReader`).
- **`UseStatusCodePages()`** عشان أخطاء الحالة ترجع بجسم مفهوم بدل رد فاضي.

### واجهة وإتاحة
- **الـ Design System**: المنتج ده على ثيم **Modern Teal** من `MeCodex/design-system`، بنفس
  أسماء الـ tokens المستخدمة في باقي المنتجات.
- **فحص إتاحة تلقائي** (`accessibility.spec.ts`, 4 Tests) بـ axe على `/login` و `/register`
  والداشبورد في الوضعين. أول تشغيل ليه لقى مخالفة **critical**: قوائم الترتيب ودورة الدفع في
  الداشبورد من غير اسم مقروء — اتصلحت في اللغتين.
- **الـ dialogs بقت dialogs حقيقية** (`dialog-a11y.spec.ts`, 4 Tests): الستة modals كانوا
  `<div>` من غير `role` ولا حبس تركيز ولا Escape. القياس قبل الإصلاح: التركيز بيفضل على الزرار
  اللي فتح الـ modal، وبعد 15 ضغطة Tab بيهرب لعناصر ورا الـ overlay، وEscape مبيعملش حاجة.
  اتحلّت بـ `@angular/cdk` (الـ a11y primitives بس — من غير مكتبة المكوّنات ومن غير أي تغيير بصري).

### CI
- `ci.yml`: build + unit tests للطرفين.
- `e2e.yml`: Playwright كامل بـ SQL Server حقيقي كـ service container، شامل فحص الإتاحة.
  منفصل عن `ci.yml` لأن اتنين من اختبارات الإتاحة محتاجين داشبورد بمستخدم مسجّل دخول.

### تنظيف 2026-08-29
- اتشال **worktree قديم** (`.claude/worktrees/`, ‎579 MB) — كان نضيف والكوميت بتاعه موجود في
  `main` أصلًا، يعني مفيهوش شغل مش متدمج.
- اتشال **`setup-solution.sh`**: الـ `.slnx` بقى متسجّل في الريبو، فالسكريبت كان هيولّد ملف
  Solution تاني جنبه. وده كان **أول خطوة في الـ README**، يعني اتباع التوثيق حرفيًا كان بيكسر
  الإعداد.
- اتشال **`src/SubscriptionTracker.Api/SubscriptionTracker.Api.slnx`** — ملف Solution تايه جوه
  مجلد مشروع الـ API، مش مرجّع من أي حتة.
- اتقفل تحذير **AV0015** بضبط `ApiVersionReader` صراحةً (`dotnet build` رجع **0 Warnings**).

---

## 2. القرارات المعتمدة

| القرار | التفاصيل |
|---|---|
| **Azure** هو هدف النشر الأساسي | لسه متوصّلش (شوف "المفتوح") |
| **Azure Key Vault** لأسرار الإنتاج | لسه متوصّلش |
| **App Insights + Sentry** للمراقبة | لسه متوصّلش |
| **مفيش Redis هنا** | Redis متفق عليه في PosFlow و Gym Manager و RealEstateCRM بس. المنتج ده مفيهوش الحِمل اللي يبرّر التعقيد |
| **ثيم Modern Teal** | هوية بصرية خاصة بالمنتج، فوق أرضية Design System مشتركة |
| **`@angular/cdk` أيوة، `@angular/material` لأ** | الـ CDK اتضاف عشان الـ a11y primitives اللي بتصلّح عيب متقاس. مكتبة المكوّنات نفسها **مترفضت** — هتستبدل واجهة شغالة ومتربطة بالـ tokens ومغطّاة باختبارات، من غير مكسب واضح |

---

## 3. اللي لسه مفتوح

- **ربط Azure فعليًا** — `cd.yml` مكتوب لكن **متجربش على Azure حقيقي** ولا مرة.
- **Azure Key Vault** — الأسرار دلوقتي بتيجي من متغيرات البيئة، و`SecretsValidator` بيرفض
  الـ Placeholders، بس مفيش Key Vault متوصّل.
- **Application Insights (باك اند) + Sentry (فرونت اند)** — مفيش أي منهم متركّب.
- **`environment.prod.ts`** لسه فيه دومين Placeholder (`https://your-production-api.com/api`).
  نفس الدومين لازم يتحط في `Cors:AllowedOrigins` في `appsettings.Production.json` قبل أي نشر.
- **مفيش Provisioning تلقائي** لموارد Azure (App Services / SQL Database) ولا تشغيل Migrations
  تلقائي في الـ CD.

---

## 4. Known issues / Technical debt

- **7 ثغرات في أدوات الـ Build** (3 عالية، 4 متوسطة): `less`, `webpack-dev-server`,
  `image-size`, `uuid`, `sockjs` — كلها Transitive عن طريق `@angular-devkit/build-angular`.
  مش بتتشحن في bundle الإنتاج، بس بتشتغل وقت `ng serve`/`ng build`.
  **`npm audit fix --force` مش حل**: بيحاول ينزّل `@angular-devkit/build-angular` لإصدار
  `0.1002.1` (من عصر ما قبل Angular 11)، يعني بيكسر toolchain v22 بالكامل. اتجرّب بـ `--dry-run`
  واتأكد إنه مش قابل للتطبيق.
- **الـ Builders لسه القديمة**: المشروع على `@angular-devkit/build-angular:*` (webpack)، وAngular
  بيقول عنها deprecated وبيرشّح `@angular/build:*` بدالها. الترحيل ده **هو على الأرجح اللي هيقفل
  الـ 7 ثغرات** لأنها كلها جاية من شجرة webpack. مش اتعمل هنا لأنه ترحيل نظام بناء، مش تنظيف.
- **`cd.yml` متجربش** — مكتوب حسب أفضل الممارسات المعروفة لـ Azure Web Apps for Containers،
  لكن محتاج Azure Subscription حقيقي عشان يتأكد.
- **الـ E2E Suite محتاجة جهاز نضيف**. عمليات Chrome اللي بتفضل شغالة بعد تشغيل فشل بتخلي نفس
  الـ Suite تاخد 13 دقيقة بدل 45 ثانية وتبان "flaky" وهي مش كده. لو الـ Suite بقت بطيئة فجأة،
  اقفل عمليات Chrome/node المعلّقة الأول قبل ما تدوّر على عيب في الاختبارات.

---

## 5. حاجات اتأجّلت عن قصد

| الحاجة | ليه |
|---|---|
| **مكتبة `@angular/material`** | هتستبدل مكوّنات مكتوبة بالإيد، شغالة، متربطة بالـ tokens، ومغطّاة باختبارات. ده refactor كبير لواجهة شغالة، والمكسب الحقيقي (primitives الإتاحة) اتاخد من الـ CDK من غير أي تغيير بصري |
| **`angular-material-theme.scss`** | اتكتب في مرحلة الـ Design System وهو **مش مستخدم في أي حتة**. متساب في `MeCodex/design-system` لحد ما يتقرر هيتستخدم ولا يتشال — مش مترّكب هنا |
| **Rate Limiting مش متغطي بـ E2E** | مغطى بالكامل بـ `RateLimitingTests.cs` على الباك اند (فاكتوري معزولة بسقف صغير). تكراره في E2E هيستهلك سقف الـ Auth لباقي الـ Suite (نفس الـ IP) ويخلي اختبارات تانية تفشل بالغلط |
| **مفيش `appsettings.Staging.json`** | التفريع بالبيئة بيغطي الحالة بالفعل، وإضافته بتخلق مكان جديد للأسرار من غير مكسب |
| **مفيش نبش لتاريخ Git** | مفيش حاجة اتنشرت، والعملية دي مدمّرة |

---

## تحديث 2026-08-30 — Key Vault و App Insights و Sentry

التلاتة متوصّلين و**خاملين لحد ما يتظبطوا** — كل واحد بيتسجّل بس لما القيمة بتاعته تبقى موجودة،
فمفيش أي تغيير في السلوك من غيرهم.

| البند | بيتفعّل بـ |
|---|---|
| Azure Key Vault | `KeyVault__Uri` (فوق `SecretsValidator` عشان قيم الـ vault تتحسب متظبطة) |
| Application Insights | `APPLICATIONINSIGHTS_CONNECTION_STRING` |
| Sentry | `environment.sentryDsn` |

**Sentry بيتحمّل ديناميك عن قصد.** الـ import العادي كان بيزوّد الـ initial bundle **52 كيلوبايت**
ويخرق ميزانية الـ 550kb اللي المشروع تعب عشان يوصلها (من 966kb لـ 298kb بالـ lazy routes) —
اترصد فعليًا في مخرجات الـ build، مش تخمين. بالـ dynamic import الـ bundle بقى **512kb** من غير أي
تحذير، وSentry بقى chunk لوحده مش بيتحمّل غير في النشرات اللي مستخدماه فعلًا.

**اللي باقي**: `environment.prod.ts` لسه دومين placeholder، والـ `cd.yml` لسه متجربش على Azure
حقيقي. وbranch protection **مش متاح** على الريبو ده: private، وGitHub بيطلب Pro للحماية على
الريبوهات الخاصة.
