#!/bin/bash
# سكريبت تجميع الـ Solution - شغّله مرة واحدة بس أول ما تفك الضغط
# لازم يكون عندك .NET 10 SDK مثبت وتشغّله من داخل مجلد CleanArch نفسه

set -e

echo "==> إنشاء ملف الـ Solution..."
dotnet new sln -n SubscriptionTracker

echo "==> إضافة المشاريع للـ Solution..."
dotnet sln add src/SubscriptionTracker.Domain/SubscriptionTracker.Domain.csproj
dotnet sln add src/SubscriptionTracker.Application/SubscriptionTracker.Application.csproj
dotnet sln add src/SubscriptionTracker.Infrastructure/SubscriptionTracker.Infrastructure.csproj
dotnet sln add src/SubscriptionTracker.Api/SubscriptionTracker.Api.csproj
dotnet sln add src/SubscriptionTracker.Tests/SubscriptionTracker.Tests.csproj

echo "==> استرجاع كل الـ Packages..."
dotnet restore

echo ""
echo "✅ الـ Solution جاهز. الخطوة الجاية: اعمل Migration جديدة (الأسماء/الأماكن اتغيّرت بالكامل)."
echo "شوف قسم 'Migrations' في الـ README.md عشان الأوامر بالظبط."
