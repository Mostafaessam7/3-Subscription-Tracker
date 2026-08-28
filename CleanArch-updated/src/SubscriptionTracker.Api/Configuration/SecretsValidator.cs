namespace SubscriptionTracker.Api.Configuration;

/// <summary>
/// بيمنع التطبيق من الإقلاع خارج Development لو لسه شغال بأسرار الـ Placeholder المكتوبة في
/// <c>appsettings.json</c>.
///
/// القيم دي متسجّلة في الريبو عن قصد عشان أي حد يكلون المشروع يشغّله فورًا — والمشكلة إنها كمان
/// **صالحة**: مفتاح الـ JWT الافتراضي طوله أكتر من 32 حرف، فالفحص الموجود على الطول بيقبله والـ API
/// بيشتغل عادي وهو بيوقّع توكنات حقيقية بمفتاح منشور في الريبو. أي نشر بينسى متغير بيئة واحد بيدّي
/// تخطي كامل للمصادقة من غير أي خطأ ولا سطر في اللوج.
///
/// أخطر من ده هنا: <c>Admin:BootstrapKey</c> هو اللي بيتحكم في إنشاء أول حساب أدمن، فلو فضل على قيمته
/// الافتراضية يبقى أي حد يقدر يعمل لنفسه حساب أدمن.
///
/// المطابقة بتتم على **أنماط** الـ Placeholder مش على قايمة قيم معروفة: القايمة الثابتة بتمسك بس
/// اللي حد فكّر يكتبه فيها، وبتبطل تحمي أول ما حد يكتب Placeholder جديد.
/// </summary>
public static class SecretsValidator
{
    private static readonly string[] PlaceholderMarkers =
    [
        "change_this", "change-this", "changethis",
        "change_me", "change-me", "changeme",
        "replace_me", "replace-me", "replaceme",
        "your-", "your_", "your-email", "yourpassword",
        "placeholder", "example.com", "sample", "dummy", "todo",
        "development-key", "development_key", "dev-key", "dev_key",
        "test-key", "test_key", "secret123", "password123",
        "xxxx", "insert_", "insert-",
    ];

    private const int MinimumSigningKeyLength = 32;

    /// <summary>مؤشر تقريبي للعشوائية — مفتاح طويل بس مكرر ("aaaa…") مالوش قيمة.</summary>
    private const int MinimumDistinctCharacters = 12;

    public static void EnsureProductionSecretsAreConfigured(IConfiguration configuration, IHostEnvironment environment)
    {
        // Development بيفضل شغال بالقيم الافتراضية — دي وظيفتها أصلاً. أي بيئة تانية (Staging،
        // Production، أو أي اسم مخصص) بتتعامل على إنها حقيقية.
        if (environment.IsDevelopment())
        {
            return;
        }

        var problems = new List<string>();

        var jwtKey = configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            problems.Add("Jwt:Key مش متظبط. حطّه في متغير البيئة Jwt__Key أو في secrets manager.");
        }
        else
        {
            if (jwtKey.Length < MinimumSigningKeyLength)
            {
                problems.Add($"Jwt:Key أقصر من {MinimumSigningKeyLength} حرف.");
            }

            if (jwtKey.Distinct().Count() < MinimumDistinctCharacters)
            {
                problems.Add("Jwt:Key تنوّع حروفه قليل جدًا بحيث مايكونش مفتاح توقيع حقيقي.");
            }

            if (LooksLikePlaceholder(jwtKey))
            {
                problems.Add(
                    "Jwt:Key لسه القيمة الافتراضية المكتوبة في الريبو. القيمة دي منشورة، يعني أي حد "
                    + "يقدر يزوّر توكن لأي مستخدم. حطّ مفتاح حقيقي في متغير البيئة Jwt__Key.");
            }
        }

        // ده مفتاح إنشاء أول أدمن — لو فضل على قيمته الافتراضية أي حد يقدر يعمل لنفسه حساب أدمن.
        var bootstrapKey = configuration["Admin:BootstrapKey"];
        if (string.IsNullOrWhiteSpace(bootstrapKey))
        {
            problems.Add("Admin:BootstrapKey مش متظبط، وده المفتاح اللي بيسمح بإنشاء أول حساب أدمن. حطّه في متغير البيئة Admin__BootstrapKey.");
        }
        else if (LooksLikePlaceholder(bootstrapKey))
        {
            problems.Add(
                "Admin:BootstrapKey لسه القيمة الافتراضية المكتوبة في الريبو — أي حد يقرأ الريبو يقدر "
                + "يعمل لنفسه حساب أدمن. حطّ قيمة عشوائية في متغير البيئة Admin__BootstrapKey.");
        }

        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            problems.Add("ConnectionStrings:DefaultConnection مش متظبط. حطّه في متغير البيئة ConnectionStrings__DefaultConnection.");
        }
        else if (LooksLikePlaceholder(connectionString))
        {
            problems.Add("ConnectionStrings:DefaultConnection لسه فيه قيمة Placeholder.");
        }

        // تكاملات اختيارية: بتتفحص بس لو متظبطة أصلاً، لأن التشغيل من غير إيميل حالة مدعومة.
        RequireRealIfPresent(configuration, "Email:Password", "Email__Password", problems);
        RequireRealIfPresent(configuration, "Email:Username", "Email__Username", problems);
        RequireRealIfPresent(configuration, "Frontend:BaseUrl", "Frontend__BaseUrl", problems);

        if (problems.Count > 0)
        {
            throw new InvalidOperationException(
                $"رفض الإقلاع في بيئة '{environment.EnvironmentName}' لأن أسرار الـ Placeholder لسه شغالة:"
                + Environment.NewLine
                + string.Join(Environment.NewLine, problems.Select(p => "  - " + p))
                + Environment.NewLine
                + "راجع appsettings.example.json لكل قيمة المفروض تتحط إزاي.");
        }
    }

    private static void RequireRealIfPresent(IConfiguration configuration, string key, string envVar, List<string> problems)
    {
        var value = configuration[key];
        if (!string.IsNullOrWhiteSpace(value) && LooksLikePlaceholder(value))
        {
            problems.Add($"{key} لسه قيمة Placeholder. حطّه في متغير البيئة {envVar}، أو شيل القسم بالكامل لو التكامل ده مش مستخدم.");
        }
    }

    private static bool LooksLikePlaceholder(string value) =>
        PlaceholderMarkers.Any(marker => value.Contains(marker, StringComparison.OrdinalIgnoreCase));
}
