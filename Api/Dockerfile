FROM mcr.microsoft.com/dotnet/aspnet:6.0-bullseye-slim AS base

WORKDIR /app
EXPOSE 80
FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim AS build
WORKDIR /src
COPY ["Api.csproj", "./" ]
RUN dotnet restore "./Api.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "Api.csproj" -c Release -o /app/build
FROM build AS publish
RUN dotnet publish "Api.csproj" -c Release -o /app/publish 

FROM base AS final
WORKDIR /app
COPY  --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]