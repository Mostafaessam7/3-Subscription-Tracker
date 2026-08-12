# Subscription Tracker — Angular App

واجهة Angular (Standalone Components) لمشروع متابعة الاشتراكات، بتكلم الـ Backend (C# Web API) عن طريق HTTP.

## الهيكل

> الشجرة دي ملخّص — المشروع كبر مع الوقت (P2/P3/Admin UI)، فراجع الجداول تحت كل قسم لتفاصيل كل Component/Service على حدة.

```
src/
├── app/
│   ├── components/          ← 17 Component (Standalone): dashboard, admin, reports, profile,
│   │                            calendar-view, subscription-list/form/detail, login/register,
│   │                            category-manager, tag-manager, payment-method-manager,
│   │                            category-spending-chart, toast, confirm-dialog,
│   │                            theme-switch, language-switch
│   ├── models/               ← subscription.model.ts, auth.model.ts, admin.model.ts
│   ├── services/             ← 16 Service: subscription, auth, admin, budget, category, tag,
│   │                            payment-method, profile, analytics, export, toast,
│   │                            confirm-dialog, celebration, theme, language
│   ├── guards/                ← auth.guard.ts (تسجيل دخول)، admin.guard.ts (دور Admin)
│   ├── directives/            ← count-up.directive.ts، vanta-background.directive.ts
│   ├── interceptors/
│   │   └── auth.interceptor.ts   ← بيضيف الـ Token تلقائيًا لكل طلب HTTP
│   ├── utils/                 ← billing-cycle.util.ts، logo.util.ts، categories.const.ts
│   ├── app.component.ts/html/css   ← الكومبوننت الجذر
│   ├── app.routes.ts               ← تعريف كل الصفحات والـ Guards بتاعتها
│   └── app.config.ts               ← تسجيل الـ Router والـ HttpClient والـ Interceptor
├── assets/i18n/               ← ar.json، en.json (راجع قسم دعم اللغتين)
├── environments/
│   ├── environment.ts              ← رابط الـ API في وضع التطوير (localhost:5000)
│   └── environment.prod.ts         ← رابط الـ API في وضع الإنتاج
├── index.html
├── main.ts
└── styles.css
```

## المتطلبات (Prerequisites)

| الأداة | الإصدار |
|---|---|
| [Node.js](https://nodejs.org/) | `18.x` أو أحدث (متوافق مع Angular 18) |
| npm | بييجي مع Node تلقائيًا |
| Angular CLI | `^18.2.0` — بيتثبت أوتوماتيك مع `npm install` (مش لازم تثبيته Global) |

## خطوات التشغيل

1. **ثبّت الـ Node packages**:
   ```bash
   npm install
   ```

2. **تأكد إن الـ Backend شغال** على `http://localhost:5000` (أو غيّر الرابط في `src/environments/environment.ts` لو مختلف).

3. **شغّل المشروع**:
   ```bash
   npm start
   ```
   هيفتح على `http://localhost:4200` تلقائيًا.

## إزاي البيانات بتتحرك؟

1. `DashboardComponent` بيستدعي `SubscriptionService` في `ngOnInit`
2. `SubscriptionService` بيبعت HTTP Request للـ API (`GET /api/subscriptions/user/1`)
3. النتيجة بترجع كـ `Subscription[]` وتتحط في خاصية `subscriptions`
4. الداتا بتتمرر لـ `SubscriptionListComponent` عن طريق `@Input()`
5. أي إضافة/تعديل/حذف بيحصل من `SubscriptionFormComponent` أو `SubscriptionListComponent` وبيرجع لـ `DashboardComponent` عن طريق `@Output()` (Event Emitters)

## الميزانية الشهرية (Budget Limit)

فيتشر جديد يسمح للمستخدم يحدد سقف أقصى لمصروفه الشهري:
- زرار "+ حدد ميزانية شهرية" فوق الداشبورد لو لسه محددش حاجة
- بعد التحديد، بيظهر **Progress Bar** بيوضح نسبة الاستخدام من الميزانية
- الشريط بيتلوّن **سيان** عادي، وبيتحول **أحمر** لو المستخدم تجاوز الحد
- **Toast تحذيري تلقائي** أول ما المصروف الشهري يعدّي الميزانية المحددة (بيظهر مرة واحدة بس لحد ما يرجع تحت الحد تاني)
- الكود في: `services/budget.service.ts` + منطق الحساب في `dashboard.component.ts`

## دعم اللغتين (عربي / إنجليزي)

المشروع بيستخدم **ngx-translate** — أشهر مكتبة لتبديل اللغة أثناء التشغيل (Runtime) في Angular، بعكس نظام الـ i18n المدمج في Angular اللي بيحتاج بناء نسخة منفصلة لكل لغة.

### إزاي شغالة؟
- ملفات الترجمة: `src/assets/i18n/ar.json` و `en.json`
- زرار تبديل اللغة (`EN` / `ع`) موجود فوق يمين كل شاشة (الداشبورد، الدخول، التسجيل)
- الاختيار بيتحفظ في `localStorage`، فلو قفلت المتصفح وفتحته تاني هيفتحلك بنفس اللغة
- لما تبدّل اللغة، اتجاه الصفحة كله (`dir`) بيتغيّر تلقائيًا بين RTL (عربي) و LTR (إنجليزي)

### إزاي تضيف نص جديد؟
1. ضيف المفتاح في **الملفين** `ar.json` و `en.json` بنفس الاسم
2. استخدمه في الـ HTML بـ: `{{ 'section.key' | translate }}`
3. للنصوص اللي فيها متغير: `{{ 'section.key' | translate:{ name: someValue } }}` مع `{{name}}` جوه الملف

### ملحوظة عن التصنيفات
قيم التصنيفات (`Category`) متخزنة في قاعدة البيانات **بالعربي دايمًا** (زي ما هي في الباك اند)، وفيه دالة `categoryTranslationKey()` في `models/categories.const.ts` بتحوّل القيمة المخزنة لمفتاح ترجمة يتغيّر شكله حسب اللغة، من غير ما تتغيّر البيانات المخزنة فعليًا.

## P2 — دورات دفع إضافية، تحليلات، بروفايل، تقارير

### 🐛 إصلاح مهم اكتشفته أثناء P2
كان الفرونت اند لسه بيعرّف `BillingCycle` بقيمتين بس (`Monthly`, `Yearly`) رغم إن الباك اند أصلاً بيدعم 4 (`Weekly`, `Quarterly` كمان). النتيجة: أي اشتراك أسبوعي أو ربع سنوي كانت كل الحسابات (المصروف الشهري/السنوي) بتحسبله غلط في كذا مكان مختلف. اتصلح بعمل ملف واحد مشترك (`utils/billing-cycle.util.ts`) بنفس منطق `BillingCycleHelper.cs` بالظبط، واستُخدم في كل مكان بدل الحسابات المتفرقة القديمة.

### صفحات جديدة
| الصفحة | الرابط | المحتوى |
|---|---|---|
| **التقارير** | `/reports` | ملخص Insights (متوسط المصروف، الأغلى/الأرخص، التوفير المحتمل)، فلاتر جاهزة (الكل/نشط/هيتجدد قريب/منتهي)، مدى تاريخ مخصص، جدول كامل، وتصدير |
| **البروفايل** | `/profile` | عرض الاسم والإيميل، تعديل الاسم، تغيير كلمة السر |

### التصدير (Export)
- **CSV** (`services/export.service.ts`): بيتفتح مباشرة في Excel، بيدعم العربي صح (بإضافة BOM في أول الملف)
- **PDF** (مكتبة `jspdf` + `jspdf-autotable`): تصدير حقيقي من غير أي Backend
- **طباعة**: `window.print()` مع CSS مخصص (`@media print`) بيخفي كل عناصر التحكم ويسيب بس الجدول

> **⚠️ ملحوظة صادقة عن الـ PDF بالعربي**: مكتبة `jsPDF` مبنية أساسًا لدعم اللاتيني، ومفيهاش دعم كامل لتشكيل الحروف العربية (Arabic Text Shaping) من غير خط مخصص متضمّن في الملف نفسه. يعني لو صدّرت PDF والتطبيق شغال بالعربي، ممكن الحروف تظهر منفصلة أو بشكل مش مثالي. **الحل الأضمن دلوقتي**: استخدم تصدير **CSV** لو محتاج البيانات بالعربي (بيشتغل تمام في Excel)، أو بدّل اللغة للإنجليزي قبل ما تصدّر PDF. لو حبيت PDF عربي كامل ومظبوط بعدين، الحل الصحيح هو تضمين خط عربي (زي Amiri) داخل ملف الـ PDF نفسه — تحسين مستقبلي.

## لوحة تحكم الأدمن (`/admin`)

### 🐛 فجوة حقيقية اتلقت وصلّحتها
الباك اند كان فيه نظام Admin كامل (`AdminController`: bootstrap, users, stats, role management — راجع [README الباك اند](../CleanArch-updated/README.md#roles--permissions-admin)) من غير أي واجهة تستخدمه خالص في الفرونت اند — ولا حتى `role` كان موجود في الـ Models (`AuthResponse`, `Profile`)، يعني مستحيل تعرف من الواجهة نفسها إن المستخدم الحالي Admin أصلًا.

### إيه اللي اتضاف؟
- **`role`** في `auth.model.ts` و `Profile` (`subscription.model.ts`) + `UserRole` enum يطابق الباك اند
- **`AdminService`** (`services/admin.service.ts`) — بيكلم `GET /api/admin/users`, `GET /api/admin/stats`, `PUT /api/admin/users/{id}/role`
- **`adminGuard`** (`guards/admin.guard.ts`) — بيمنع فتح `/admin` لغير الـ Admin (بيرجّع لـ `/login` لو مش مسجّل دخول، أو لـ `/` لو مسجّل بس مش Admin)
- **صفحة `/admin`** (`components/admin/`): إحصائيات عامة (عدد المستخدمين، الاشتراكات النشطة، المصروف الشهري الكلي، مستخدمين جدد آخر 30 يوم) + جدول كل المستخدمين مع زرار ترقية/تخفيض دور لكل واحد (بتأكيد قبل التنفيذ، ومحدّش يقدر يغيّر دور نفسه)
- لينك **🛠 لوحة الأدمن** بيظهر في الداشبورد بس للمستخدمين اللي دورهم Admin

## P3 — Favorites, Tags, Duplicate, Calendar, Logo تلقائي, Dark/Light Toggle

### 🐛 Bugs حقيقية اكتشفتها وصلّحتها في مراجعة P3
كان جزء كبير من الباك اند والفرونت اند لـ P3 (Tags, Favorites, Duplicate, Calendar) **متبني بالفعل من شغل سابق**، لكن مكنش كله متوصّل صح:
1. **Route صفحة الكالندر كان ناقص بالكامل** من `app.routes.ts` — كان فيه لينك في الداشبورد يودّي لـ `/calendar` بس مفيش Route حقيقي، يعني الضغط عليه كان هيرجّعك للداشبورد تاني بصمت
2. **زرار فتح "إدارة الوسوم" مكنش موجود في HTML الداشبورد خالص** — الكومبوننت كان متسجل ومستورد بس مفيش طريقة تفتحه فعليًا
3. **قسم `tags` بالكامل كان ناقص من ملفات الترجمة** (ar.json/en.json)، وكذلك `nav.calendar`, `list.duplicate`, `list.favorite`, `form.tags`, `form.favorite`, `form.noTagsYet`
4. **صفحة تفاصيل الاشتراك** كانت بتستخدم الحرف الأول من الاسم بس كـ Fallback للأيقونة، من غير ما تدّي أولوية للأيقونة المخصصة (`subscription.icon`) زي ما بتعمل القائمة بالظبط

كل ده اتصلح دلوقتي وبقى متسق 100%.

### الميزات المكتملة
| الميزة | التفاصيل |
|---|---|
| **Favorites** | نجمة (★/☆) في القائمة وصفحة التفاصيل، بتتبدّل بضغطة واحدة |
| **Tags** | جدول حقيقي بعلاقة Many-to-Many مع الاشتراكات، إدارة كاملة (إضافة/تعديل/حذف) من زرار "🏷 إدارة الوسوم" |
| **Duplicate** | زرار نسخ (⧉) بجانب كل اشتراك في القائمة |
| **Calendar View** | صفحة `/calendar` — شهر كامل، كل يوم فيه تجديدات بيتلوّن، دوس على اليوم تشوف التفاصيل |
| **Logo تلقائي** | لو حطيت رابط موقع للاشتراك، بيجيب الأيقونة (Favicon) تلقائيًا من خدمة Google العامة — من غير أي رفع ملفات أو تخزين إضافي (`utils/logo.util.ts`) |
| **Dark/Light Toggle** | زرار ☀️/🌙 بجانب زرار اللغة في كل الشاشات — ثيم فاتح كامل بألوان معدّلة للتباين الصحيح (`services/theme.service.ts`) |

### ملحوظة عن الـ Dark/Light Toggle
الألوان المميزة (كهرماني/سيان/أحمر) بقت **أغمق شوية في الثيم الفاتح** عن نسخة الداكن، لأنها بتتعرض كنص فوق خلفية بيضا، فمحتاجة تباين أعلى يفضل مقروء وواضح — ده قرار تصميم متعمّد مش خطأ، ومعمول بيه في منتجات زي Stripe وLinear.

### ⚠️ خلفيات Vanta.js (NET/FOG) ثابتة اللون بغض النظر عن الثيم
خلفيات الشبكة المتحركة في صفحات الدخول والداشبورد بألوان ثابتة (كحلي/كهرماني/سيان) مبنية وقت التحميل، ومش بتتغيّر تلقائيًا لو بدّلت لـ Light Mode. ده قرار متعمّد للحفاظ على الهوية البصرية المميزة، وفيه أوفرلاي شفاف فوقها بيخلي النص يفضل واضح في الحالتين.

### حاجات P3 اللي **متعملتش عمدًا**
- **Subscription History/Audit Log**: يحتاج جدول تاريخي وBackend logic لتسجيل كل تعديل — مجهود مشروع منفصل
- **Backup & Restore**: يحتاج تصميم صيغة تصدير/استيراد شاملة مع validation قوي — ممكن نعمله لو احتجناه فعلاً بعدين

## تصليحات التصميم + مكتبات بصرية إضافية

### 🐛 Bugs تصميمية اكتشفتها وصلّحتها
1. **الـ Vanta كان بألوان ثابتة (كحلي دايمًا) بغض النظر عن Dark/Light Toggle** — دلوقتي الـ Directive بيراقب الثيم الحالي (`effect()` على `ThemeService.currentTheme`) وبيعيد بناء التأثير بألوان مناسبة لكل ثيم تلقائيًا
2. **التوب بار في 4 شاشات** (Calendar, Reports, Subscription Detail, Profile) كان فيه 3 عناصر متفرقة (`justify-content: space-between` مع رابط الرجوع + زرار الثيم + زرار اللغة) فكانوا بيتوزعوا على عرض الشاشة كله بدل ما يتجمعوا — اتلفوا في `.topbar-actions` واحدة

### توسيع استخدام Vanta.js لشاشات تانية
كان Vanta مقتصر على 3 شاشات بس (دخول/تسجيل/داشبورد). دلوقتي مضاف كمان في:
- **البروفايل**: تأثير FOG محتوى في كارت البروفايل بس (مش الصفحة كلها، عشان الفورمات تحت تفضل واضحة)
- **تفاصيل الاشتراك**: تأثير FOG محتوى في هيدر الاسم/الأيقونة بس

### ليه Calendar وReports **من غير** Vanta عمدًا؟
زي ما موضح في قسم "P2" فوق، Vanta بيستخدم WebGL (رسوميات مستمرة)، وده مش مناسب لصفحات فيها جداول بيانات كتير بتتغيّر (Reports) أو Grid تفاعلي كبير (Calendar) — التركيز هناك المفروض يكون على القراءة والوضوح مش الحركة.

### مكتبة جديدة: `canvas-confetti`
لمسة احتفالية بسيطة (مش مبالغ فيها) بتظهر لما تضيف اشتراك جديد بنجاح — `services/celebration.service.ts`. اتعمّدت إني منستخدمهاش مع كل عملية (تعديل/حذف) عشان تفضل حاجة مميزة مش مزعجة.

## هوية التصميم — "Financial Terminal"

المشروع بقى بهوية مستوحاة من شاشات التداول المالي (زي Bloomberg Terminal):

- **الخلفية**: كحلي غامق (`#0B1120`) مش أسود بحت
- **لونين أساسيين** بدل لون واحد: كهرماني `#F5B841` (للـ CTA والأرقام المهمة) وسيان `#35D0C6` (للروابط والحالة العادية)، وأحمر `#FF5D5D` للتنبيهات العاجلة
- **الخطوط**: `Sora` للعناوين، **`JetBrains Mono`** لكل الأرقام والأسعار (حس الشاشة المالية)، `Inter` للنص العادي
- **العنصر المميز**: شريط **Ticker متحرك** فوق الداشبورد (زي شاشات البورصة) بيعرض الاشتراكات اللي هتتجدد خلال أسبوع، مع نقطة حمراء نابضة (Pulse Animation) للمستعجل منها

كل الألوان معرّفة في `:root` جوه `src/styles.css` — تغيير قيمة واحدة بيتغيّر في كل الشاشات.

## خلفية متحركة (Vanta.js)

صفحتي الدخول والتسجيل فيهم خلفية شبكة نقط متصلة متحركة (تأثير **NET**) باستخدام [Vanta.js](https://www.vantajs.com/) (مبني على Three.js).

### إزاي متحمّلة؟
عن طريق CDN مباشرة في `index.html` (مش npm package):
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.net.min.js"></script>
```

### إزاي بتشتغل في الكود؟
`directives/vanta-background.directive.ts` — Directive بسيطة، حطها على أي `<div>` (`vantaBackground`) وهي بتفعّل التأثير عليه، وبتعمل `destroy()` تلقائي لما تسيب الصفحة (مهم جدًا، لأن Vanta بيشغّل WebGL loop مستمر ولو ماتعملش destroy هتفضل شغالة في الخلفية وتستهلك أداء).

### تأثيرين مختلفين حسب الصفحة
- **صفحة الدخول/التسجيل**: `vantaBackground="net"` — شبكة نقط متحركة، مناسبة لصفحة فاضية غير مشغولة بمحتوى
- **الداشبورد**: `vantaBackground="fog"` — سحب لونية ناعمة، **بس على منطقة الهيدر فوق بس** (مش الصفحة كلها)، عشان قائمة الاشتراكات تحتها تفضل واضحة ومريحة للعين. فيه طبقة تعتيم شفافة (`.hero-zone::after`) فوق الـ Vanta مباشرة عشان النص يفضل مقروء بوضوح.

### لو حابب تضيف تأثير على صفحة تانية
استخدم نفس الـ Directive بس غيّر القيمة:
```html
<div vantaBackground="net">...</div>
<div vantaBackground="fog">...</div>
```

### لو حابب تأثير جديد كليًا (زي WAVES أو HALO)
1. ضيف سكريبته في `index.html` (مثلاً `vanta.waves.min.js`)
2. ضيف حالة جديدة في `vanta-background.directive.ts` (`else if (this.effectType === 'waves')`)
3. استخدمه: `<div vantaBackground="waves">`

## الحركة والأنيميشن (Motion)

- **View Transitions** بين الصفحات (`withViewTransitions()` في `app.config.ts`) — كروس فيد ناعم بدل القفزة المفاجئة
- **Count-up Animation**: كل الأرقام في الداشبورد (الإجمالي الشهري، عدد الاشتراكات...) بتعدّ لفوق بدل ما تظهر فجأة — الكود في `directives/count-up.directive.ts`
- **Staggered entrance**: صفوف الاشتراكات بتدخل واحد ورا التاني بتأخير بسيط (`animation-delay`)
- **Toast Notifications**: فيدباك بصري فوري عند الحفظ/التعديل/الحذف (`services/toast.service.ts` + `components/toast/`)
- **Ticker بيقف عند الـ hover** عشان تقدر تقرا لو عايز

## Testing

فيه دلوقتي إعداد **Karma + Jasmine** كامل (ماكانش موجود قبل كده — `npm test` كانت هتفشل لعدم وجود Test Runner متسجل). بيشتغل بـ Chrome Headless.

```bash
npm test
```

| الملف | بيغطي إيه |
|---|---|
| `utils/billing-cycle.util.spec.ts` | تحويل دورة الدفع لمكافئ شهري/سنوي — نفس منطق الـ Bug اللي اتصلح في P2 |
| `services/subscription.service.spec.ts` | كل استدعاءات HTTP (`getAllForUser`, `create`, `delete`, `duplicate`, `toggleFavorite`...) عن طريق `HttpClientTestingModule` — بيتأكد من الـ Method والـ URL والـ Body المتبعتين من غير ما يكلم API حقيقي |
| `services/auth.service.spec.ts` | تسجيل الدخول/الخروج، تخزين الـ Token في `localStorage`، وانتهاء صلاحية الـ Token (`isLoggedIn`) |
| `services/toast.service.spec.ts` | إضافة/إزالة Toast، والإزالة التلقائية بعد 3 ثواني (`jasmine.clock()`) |
| `components/toast/toast.component.spec.ts` | العرض الفعلي للـ Toasts في الـ DOM حسب حالة الـ Service |
| `services/admin.service.spec.ts` | استدعاءات `/api/admin/*` (users, stats, role update) |
| `guards/admin.guard.spec.ts` | الحماية الثلاثية: مش مسجّل دخول → `/login`، مسجّل بس مش Admin → `/`، Admin فعلًا → مسموح |
| `components/dashboard/dashboard.component.spec.ts` | منطق الداشبورد: حساب `activeCount`/`expiredCount`/`renewingSoonCount`، Budget Warning (بيتبعت مرة واحدة بس)، الفلاتر، `onLogout` — من غير Render كامل للـ Template (تجنّب الاعتماد على الـ Child Components المتداخلة) |

**لسه ناقص عمدًا**: E2E Tests حقيقية (Cypress/Playwright)، وTests لباقي الـ Components المتوسطة (`subscription-form`, `subscription-list`...).

## النشر (Deployment)

### Build للإنتاج
```bash
npm run build
```
الناتج بيتحط في `dist/subscription-tracker-app/browser` — مجلد Static Files جاهز لأي Static Host (Nginx, Netlify, Vercel, Azure Static Web Apps...).

### قبل النشر لازم تتأكد من:
1. **`src/environments/environment.prod.ts`**: رابط الـ API لازم يشاور على دومين الباك اند الحقيقي (مش `localhost:5000`).
2. **CORS في الباك اند**: الدومين اللي هيتنشر عليه الفرونت اند لازم يتضاف لـ Policy الـ CORS في `Program.cs` بتاع الـ API (راجع قسم CORS في [README الباك اند](../CleanArch-updated/README.md#cors)).
3. **الـ Bundle Size**: `angular.json` مظبوط بحد أقصى `500kb` تحذير / `1mb` خطأ للـ Initial Bundle — لو تعديت الحد وقت الـ Build هتاخد Warning أو Error.

### Nginx / Docker
راجع [Dockerfile](../Dockerfile.frontend) و [docker-compose.yml](../docker-compose.yml) في جذر الريبو لتشغيل نسخة Production كاملة (Frontend + Backend + SQL Server) بأمر واحد.

## ملاحظات مهمة

- **تسجيل الدخول إجباري**: أي حد يفتح الرابط الرئيسي (`/`) من غير ما يكون مسجل دخول هيتحول تلقائيًا لصفحة `/login` (بفضل `auth.guard.ts`).
- **الـ Token** بيتخزن في `localStorage` وبيتضاف تلقائيًا لكل طلب HTTP عن طريق `auth.interceptor.ts` — مش محتاج تضيفه يدوي في أي Service.
- **صفحة التفاصيل**: دوس على اسم أي اشتراك في القائمة عشان تفتح `/subscriptions/{id}` وتشوف كل التفاصيل، وتقدر تعدّل أو تحذف من هناك مباشرة.
- **التصنيفات**: قائمة ثابتة في `models/categories.const.ts` — لازم تفضل **مطابقة تمامًا** لقائمة `SubscriptionCategories.All` في الباك اند، وإلا الفلتر مش هيلاقي نتائج صح.
- **CORS**: تأكد إن الـ Backend مسموحله بمكالمات من `http://localhost:4200` (متظبط بالفعل في `Program.cs` بتاع الـ API).
- الخطوة الجاية المنطقية: النشر (Deployment) عشان المشروع يبقى شغال أونلاين.
