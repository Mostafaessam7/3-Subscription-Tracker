# Backend (ASP.NET Core Web API) - Multi-stage build
# شغّله من جذر الريبو: docker build -f Dockerfile -t subscription-tracker-api .

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# بننسخ ملفات الـ csproj الأول بس عشان Docker Layer Caching (لو الكود اتغيّر بس الـ Packages لأ،
# مش هيعيد تحميل NuGet تاني)
COPY CleanArch-updated/src/SubscriptionTracker.Domain/*.csproj SubscriptionTracker.Domain/
COPY CleanArch-updated/src/SubscriptionTracker.Application/*.csproj SubscriptionTracker.Application/
COPY CleanArch-updated/src/SubscriptionTracker.Infrastructure/*.csproj SubscriptionTracker.Infrastructure/
COPY CleanArch-updated/src/SubscriptionTracker.Api/*.csproj SubscriptionTracker.Api/
RUN dotnet restore SubscriptionTracker.Api/SubscriptionTracker.Api.csproj

# دلوقتي باقي الكود
COPY CleanArch-updated/src/SubscriptionTracker.Domain/ SubscriptionTracker.Domain/
COPY CleanArch-updated/src/SubscriptionTracker.Application/ SubscriptionTracker.Application/
COPY CleanArch-updated/src/SubscriptionTracker.Infrastructure/ SubscriptionTracker.Infrastructure/
COPY CleanArch-updated/src/SubscriptionTracker.Api/ SubscriptionTracker.Api/

RUN dotnet publish SubscriptionTracker.Api/SubscriptionTracker.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "SubscriptionTracker.Api.dll"]
