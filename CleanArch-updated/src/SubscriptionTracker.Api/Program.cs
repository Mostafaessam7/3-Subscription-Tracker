using System.Text;
using System.Threading.RateLimiting;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Serilog;
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
    builder.Services.AddControllers();

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
    // ============================================================
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
    });

    // ============================================================
    // JWT Authentication
    // (تفعيل الـ Scheme نفسه لازم يفضل هنا في الـ Api Layer لأنه جزء من إعداد ASP.NET Core Middleware،
    //  لكن قيم الإعدادات (Key/Issuer/Audience) بتيجي من JwtSettings المسجّلة كـ Options في AddInfrastructure)
    // ============================================================
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
    });
    builder.Services.AddAuthorization();

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
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

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
