using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using SubscriptionTracker.Api.Auth;
using SubscriptionTracker.Api.Configuration;
using SubscriptionTracker.Api.HealthChecks;
using SubscriptionTracker.Api.Middleware;
using SubscriptionTracker.Application;
using SubscriptionTracker.Application.Settings;
using SubscriptionTracker.Infrastructure;

// ============================================================
// Serilog: بيتسجّل الأول من كل حاجة عشان لو حصل خطأ في أي مرحلة من الإعداد نفسه (زي إعدادات ناقصة)
// نقدر نمسكه ونسجّله بدل ما يضيع كـ Console Exception عادي (ده الـ "Bootstrap Logger" بتاع Serilog)
// ============================================================
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .WriteTo.Console()
    .WriteTo.File(
        "Logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14, // بيحتفظ بآخر 14 يوم بس، عشان الملفات ماتكبرش من غير حد
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
    .CreateBootstrapLogger();

try
{
    Log.Information("بدء تشغيل التطبيق...");

    var builder = WebApplication.CreateBuilder(args);

    // بيستبدل الـ Logging الافتراضي بتاع ASP.NET Core بالكامل بـ Serilog، وبيقرا إعدادات إضافية
    // من appsettings.json لو موجودة (قسم "Serilog") فوق الإعداد الأساسي اللي فوق
    builder.Host.UseSerilog((context, services, configuration) => configuration
        .ReadFrom.Configuration(context.Configuration)
        .ReadFrom.Services(services)
        .Enrich.FromLogContext()
        .Enrich.WithMachineName()
        .WriteTo.Console()
        .WriteTo.File(
            "Logs/log-.txt",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 14));

    // ============================================================
    // تسجيل الطبقات - كل طبقة بتسجّل نفسها بسطر واحد بس (Extension Methods)
    // ============================================================
    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    // FluentValidation: بيوصّل الـ Validators اللي سجّلناها في AddApplication() بمنطق الـ MVC Validation
    // العادي، يعني لو الـ DTO مش صالح، الـ Controller بيرجع 400 تلقائيًا زي ما كان بيحصل مع DataAnnotations
    builder.Services.AddFluentValidationAutoValidation();

    // ============================================================
    // الـ Controllers
    // ============================================================
    builder.Services.AddControllers(options =>
    {
        // بيضيف api/v1/... جنب api/... الموجود - راجع VersionedRouteConvention
        options.Conventions.Add(new VersionedRouteConvention());
    });

    // ============================================================
    // API Versioning - بيتضاف دلوقتي وهو مجاني، قبل ما يبقى في أي عميل خارجي. بعد ما يبقى في
    // عملاء، إضافته بتبقى تغيير كاسر محتاج فترة انتقال
    // ============================================================
    builder.Services
        .AddApiVersioning(options =>
        {
            options.DefaultApiVersion = new Asp.Versioning.ApiVersion(1, 0);

            // المسارات القديمة (api/... من غير إصدار) بتتعامل على إنها v1 - عشان الفرونت اند الحالي
            // يفضل شغال من غير أي تعديل
            options.AssumeDefaultVersionWhenUnspecified = true;

            // بيرجع api-supported-versions في الـ Response Headers، فالعميل يقدر يكتشف الإصدارات
            // المتاحة من غير توثيق خارجي
            options.ReportApiVersions = true;
        })
        .AddMvc()
        .AddApiExplorer(options =>
        {
            options.GroupNameFormat = "'v'VVV";
            options.SubstituteApiVersionInUrl = true;
        });

    // ============================================================
    // Global Exception Handling - أي خطأ مش متوقع بيتمسك مركزيًا هنا
    // ============================================================
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();

    // ============================================================
    // Swagger (مع دعم إدخال الـ JWT Token)
    // ============================================================
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "اكتب: Bearer {token} بتاعك"
        });
        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });

    // ============================================================
    // CORS عشان Angular (شغال على بورت مختلف) يقدر يكلم الـ API
    // الـ Origins بتيجي من appsettings (قسم Cors) عشان النشر لأي بيئة
    // يبقى تغيير إعداد بس، من غير ما نلمس الكود
    // ============================================================
    var corsSettings = builder.Configuration.GetSection(CorsSettings.SectionName).Get<CorsSettings>()
        ?? new CorsSettings();

    if (corsSettings.AllowedOrigins.Length == 0)
    {
        throw new InvalidOperationException(
            "Cors:AllowedOrigins مالهوش أي قيمة - لازم يتحدد على الأقل Origin واحد للفرونت اند");
    }

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            policy.WithOrigins(corsSettings.AllowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });

    // ============================================================
    // JWT Authentication
    // (تفعيل الـ Scheme نفسه لازم يفضل هنا في الـ Api Layer لأنه جزء من إعداد ASP.NET Core Middleware،
    //  لكن قيم الإعدادات (Key/Issuer/Audience) بتيجي من JwtSettings المسجّلة كـ Options في AddInfrastructure)
    // ============================================================
    // بيتنفّذ قبل ما مفتاح الـ JWT يتستخدم في أي حاجة. خارج Development بيرفض أسرار الـ Placeholder
    // المكتوبة في الريبو — الفحص اللي تحت بيتأكد إن القسم موجود بس، مش إن القيمة اتغيّرت فعلاً.
    SecretsValidator.EnsureProductionSecretsAreConfigured(builder.Configuration, builder.Environment);

    var jwtSettings = builder.Configuration.GetSection(JwtSettings.SectionName).Get<JwtSettings>()
        ?? throw new InvalidOperationException("قسم Jwt ناقص من appsettings.json");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // الـ Header بياخد الأولوية دايمًا: أي عميل مش متصفح (سكريبت، اختبار، أداة) بيفضل
                // شغال زي ما هو من غير أي تعديل. الكوكي بتتقرا بس لما مفيش Header - وده حالة
                // الفرونت اند بعد نقل التوكن من localStorage.
                if (string.IsNullOrEmpty(context.Token))
                {
                    var cookieToken = context.Request.Cookies[WebAuthCookies.AccessTokenCookieName];

                    if (!string.IsNullOrEmpty(cookieToken))
                    {
                        context.Token = cookieToken;
                    }
                }

                return Task.CompletedTask;
            }
        };
    });
    builder.Services.AddAuthorization();

    // ============================================================
    // Health Checks - أي Orchestrator (Kubernetes، App Service، Docker) محتاج نقطة يسأل
    // عليها قبل ما يوجّه Traffic للـ instance أو يعيد تشغيلها
    // ============================================================
    builder.Services.AddHealthChecks()
        .AddCheck<DatabaseHealthCheck>("database", tags: ["ready"]);

    // ============================================================
    // Rate Limiting - عشان Endpoints الـ Auth (Login/Register/Forgot-Password) متبقاش
    // مفتوحة لمحاولات Brute-force غير محدودة. كل IP ليه سقف منفصل (Partitioned)، مش سقف
    // واحد مشترك بين كل المستخدمين
    // ============================================================
    builder.Services.Configure<RateLimitSettings>(builder.Configuration.GetSection(RateLimitSettings.SectionName));

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.AddPolicy("AuthEndpoints", httpContext =>
        {
            // بنقرا الإعدادات من IOptionsMonitor وقت كل طلب (مش قيمة متسجّلة مرة واحدة وقت
            // الإقلاع) عشان بيئة الاختبار تقدر تغيّر السقف عن طريق services.Configure() العادي
            var settings = httpContext.RequestServices
                .GetRequiredService<Microsoft.Extensions.Options.IOptionsMonitor<RateLimitSettings>>().CurrentValue;

            return RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = settings.PermitLimit,
                    Window = TimeSpan.FromSeconds(settings.WindowSeconds),
                    QueueLimit = 0
                });
        });
    });

    var app = builder.Build();

    // بيسجّل كل Request بيوصل للسيرفر (المسار، الوقت اللي اتاخد، الـ Status Code) - سطر واحد بس
    // ولازم يتسجّل بدري قد الإمكان في الـ Pipeline عشان يقيس الوقت الفعلي للطلب كامل
    app.UseSerilogRequestLogging();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // الـ Exception Handler لازم يتسجّل بدري في الـ Pipeline عشان يقدر يمسك أي حاجة بعده
    app.UseExceptionHandler();

    // HSTS بيجبر المتصفح يستخدم HTTPS بس لأي طلب جاي من دلوقتي، لكنه مش لازم في الـ Development
    // (بيتعارض مع localhost اللي بيشتغل HTTP كتير وقت التطوير)
    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }

    app.UseMiddleware<SubscriptionTracker.Api.Middleware.SecurityHeadersMiddleware>();

    app.UseHttpsRedirection();
    app.UseCors("AllowAngularApp");

    app.UseRateLimiter();

    // الترتيب مهم: Authentication الأول وبعدها Authorization
    // قبل المصادقة عن قصد: طلب CSRF مزوّر المفروض يترفض من غير ما نصرف مجهود على التحقق من
    // التوكن أصلاً، والرفض بيبقى واضح إنه سببه الـ CSRF مش صلاحية منتهية.
    app.UseMiddleware<SubscriptionTracker.Api.Middleware.CsrfProtectionMiddleware>();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    // /health/live: هل العملية نفسها شغالة؟ (Predicate = false يعني مفيش أي فحص تبعيات) — لو ده
    // فشل يبقى إعادة التشغيل هي الحل الصح.
    // /health/ready: هل التطبيق جاهز يستقبل Traffic؟ بيفحص قاعدة البيانات كمان — لو ده فشل يبقى
    // الـ instance تتشال من الـ load balancer، مش تتقتل: إعادة تشغيل مش هتصلّح قاعدة بيانات واقعة.
    // كلاهما بدون مصادقة عن قصد: الـ Orchestrator اللي بيسأل معندوش توكن.
    app.MapHealthChecks("/health");
    app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
    app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains("ready") });

    app.Run();
}
catch (Exception ex) when (ex is not HostAbortedException)
{
    // HostAbortedException بتحصل بشكل طبيعي وقت `dotnet ef migrations add` (بيشغّل التطبيق شكليًا بس عشان
    // يقرا الإعدادات)، فمش لازم نسجّلها كخطأ حقيقي - أي حاجة تانية غيرها فعلاً مشكلة تستاهل نسجّلها
    Log.Fatal(ex, "التطبيق فشل يبدأ التشغيل");
}
finally
{
    Log.Information("إغلاق التطبيق...");
    Log.CloseAndFlush();
}

// بيخلي الكلاس Program (اللي بيتولد أوتوماتيك من الـ Top-Level Statements فوق) Public بدل Internal
// عشان WebApplicationFactory<Program> في مشروع الـ Tests يقدر يوصله من Assembly تاني
public partial class Program { }
