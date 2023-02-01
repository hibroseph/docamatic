FROM mcr.microsoft.com/dotnet/aspnet:6.0-bullseye-slim AS base
WORKDIR /app
FROM mcr.microsoft.com/dotnet/sdk:6.0-bullseye-slim AS build
WORKDIR /src
COPY [".","."]

RUN dotnet restore "./Api/Api.csproj"

WORKDIR "/src/."
RUN dotnet build "Api/Api.csproj" -c Release -o /app/build
FROM build AS publish
RUN dotnet publish "Api/Api.csproj" -c Release -o /app/publish 

FROM base AS final
WORKDIR /app
COPY  --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Api.dll"]
EXPOSE 7156