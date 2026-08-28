using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using SubscriptionTracker.Api.Configuration;
using Xunit;

namespace SubscriptionTracker.Tests.Configuration;

/// <summary>
/// الاختبارات دي موجودة لأن الحارس اللي بتغطيه بيشتغل بس في مسار محدش بيبصله: إقلاع الإنتاج. لو بطّل
/// يشتغل من غير ما حد ياخد باله، العرض هيكون تخطي مصادقة في نشر حقيقي — مش build فاشل. فالقيم
/// الافتراضية المكتوبة في appsettings.json مثبتة هنا بقيمتها بالظبط.
/// </summary>
public class SecretsValidatorTests
{
    /// <summary>المفتاح المكتوب فعليًا في appsettings.json — أطول من 32 حرف، فبيعدّي أي فحص على الطول.</summary>
    private const string ShippedJwtPlaceholder = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARACTERS";

    /// <summary>مفتاح إنشاء أول أدمن، برضه مكتوب في الريبو.</summary>
    private const string ShippedBootstrapPlaceholder = "CHANGE_THIS_TO_A_RANDOM_SECRET_BEFORE_FIRST_RUN";

    private const string RealisticJwtKey = "b7Kq2vXm9Rt4Zp8Lw6Cy3Nd5Hf1Js0Gu7Ae4Bo2Qi9Vx6Mz";
    private const string RealisticBootstrapKey = "j4Tn8Wq2Ld6Yp0Rc5Vb9Hm3Kx7Zg1Fs";

    private static IConfiguration Config(Dictionary<string, string?> values) =>
        new ConfigurationBuilder().AddInMemoryCollection(values).Build();

    private static IHostEnvironment Env(string name) => new StubEnvironment(name);

    private static Dictionary<string, string?> ValidBaseline() => new()
    {
        ["Jwt:Key"] = RealisticJwtKey,
        ["Admin:BootstrapKey"] = RealisticBootstrapKey,
        ["ConnectionStrings:DefaultConnection"] = "Server=db;Database=SubscriptionTrackerDb;User Id=sa;Password=r3al-Pw!;TrustServerCertificate=True",
    };

    [Fact]
    public void يرفض_مفتاح_الـJWT_الافتراضي_المكتوب_في_الريبو()
    {
        var config = Config(new Dictionary<string, string?>(ValidBaseline())
        {
            ["Jwt:Key"] = ShippedJwtPlaceholder,
        });

        var ex = Assert.Throws<InvalidOperationException>(() =>
            SecretsValidator.EnsureProductionSecretsAreConfigured(config, Env("Production")));

        Assert.Contains("Jwt:Key", ex.Message);
    }

    [Fact]
    public void يرفض_مفتاح_الـBootstrap_الافتراضي_لأنه_بيسمح_بإنشاء_أدمن()
    {
        // ده أخطر من مفتاح الـ JWT: أي حد يقرأ الريبو يقدر يعمل لنفسه حساب أدمن.
        var config = Config(new Dictionary<string, string?>(ValidBaseline())
        {
            ["Admin:BootstrapKey"] = ShippedBootstrapPlaceholder,
        });

        var ex = Assert.Throws<InvalidOperationException>(() =>
            SecretsValidator.EnsureProductionSecretsAreConfigured(config, Env("Production")));

        Assert.Contains("BootstrapKey", ex.Message);
    }

    [Fact]
    public void القيم_الافتراضية_كانت_هتعدّي_فحص_الطول_لوحده()
    {
        // بتثبّت الفرضية اللي الاختبارات فوق قايمة عليها: لو حد قصّر الـ Placeholder، الاختبار ده
        // بيفشل بصوت عالي بدل ما الـ suite يفضل أخضر وهو فقد معناه.
        Assert.True(ShippedJwtPlaceholder.Length >= 32);
    }

    [Theory]
    [InlineData("PosFlow-Development-Key-Change-Me-2026-Minimum-32-Characters")]
    [InlineData("my-development-key-that-is-definitely-long-enough-to-pass")]
    [InlineData("REPLACE_ME_WITH_SOMETHING_REAL_BEFORE_DEPLOYING_TO_PROD")]
    [InlineData("your-secret-key-goes-right-here-and-is-long-enough-ok")]
    public void يرفض_مفاتيح_شكلها_Placeholder_حتى_لو_مشافهاش_قبل_كده(string key)
    {
        var config = Config(new Dictionary<string, string?>(ValidBaseline()) { ["Jwt:Key"] = key });

        Assert.Throws<InvalidOperationException>(() =>
            SecretsValidator.EnsureProductionSecretsAreConfigured(config, Env("Production")));
    }

    [Fact]
    public void يرفض_مفتاح_طويل_بس_متكرر()
    {
        var config = Config(new Dictionary<string, string?>(ValidBaseline())
        {
            ["Jwt:Key"] = new string('a', 64),
        });

        Assert.Throws<InvalidOperationException>(() =>
            SecretsValidator.EnsureProductionSecretsAreConfigured(config, Env("Production")));
    }

    [Fact]
    public void بيبلّغ_عن_كل_المشاكل_مرة_واحدة()
    {
        var config = Config(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = ShippedJwtPlaceholder,
            ["Admin:BootstrapKey"] = ShippedBootstrapPlaceholder,
            ["ConnectionStrings:DefaultConnection"] = "Server=db;Password=your-password-here;",
        });

        var ex = Assert.Throws<InvalidOperationException>(() =>
            SecretsValidator.EnsureProductionSecretsAreConfigured(config, Env("Production")));

        Assert.Contains("Jwt:Key", ex.Message);
        Assert.Contains("BootstrapKey", ex.Message);
        Assert.Contains("DefaultConnection", ex.Message);
    }

    [Fact]
    public void بيسيب_القيم_الافتراضية_تعدّي_في_Development()
    {
        var config = Config(new Dictionary<string, string?>
        {
            ["Jwt:Key"] = ShippedJwtPlaceholder,
            ["Admin:BootstrapKey"] = ShippedBootstrapPlaceholder,
            ["ConnectionStrings:DefaultConnection"] = "Server=.;Database=SubscriptionTrackerDb;Trusted_Connection=True;",
        });

        SecretsValidator.EnsureProductionSecretsAreConfigured(config, Env("Development"));
    }

    [Fact]
    public void بيتعامل_مع_أي_اسم_بيئة_غير_معروف_على_إنه_حقيقي()
    {
        var config = Config(new Dictionary<string, string?>(ValidBaseline())
        {
            ["Jwt:Key"] = ShippedJwtPlaceholder,
        });

        Assert.Throws<InvalidOperationException>(() =>
            SecretsValidator.EnsureProductionSecretsAreConfigured(config, Env("QA")));
    }

    [Fact]
    public void بيقبل_إعداد_إنتاج_كامل()
    {
        SecretsValidator.EnsureProductionSecretsAreConfigured(Config(ValidBaseline()), Env("Production"));
    }

    [Fact]
    public void بيتجاهل_التكاملات_الاختيارية_اللي_مش_متظبطة_أصلاً()
    {
        var values = ValidBaseline();
        values["Email:Password"] = "";

        SecretsValidator.EnsureProductionSecretsAreConfigured(Config(values), Env("Production"));
    }

    [Fact]
    public void يرفض_تكامل_اختياري_سايبينه_على_قيمته_الافتراضية()
    {
        var values = ValidBaseline();
        values["Email:Password"] = "CHANGE_THIS_TO_AN_APP_PASSWORD";

        Assert.Throws<InvalidOperationException>(() =>
            SecretsValidator.EnsureProductionSecretsAreConfigured(Config(values), Env("Production")));
    }

    private sealed class StubEnvironment(string environmentName) : IHostEnvironment
    {
        public string EnvironmentName { get; set; } = environmentName;
        public string ApplicationName { get; set; } = "SubscriptionTracker.Tests";
        public string ContentRootPath { get; set; } = AppContext.BaseDirectory;
        public Microsoft.Extensions.FileProviders.IFileProvider ContentRootFileProvider { get; set; } =
            new Microsoft.Extensions.FileProviders.NullFileProvider();
    }
}
