# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base

USER $APP_UID

# Environment variables
ENV DOUJI_BACKEND_URLS=http://0.0.0.0:8080
ENV DOUJI_BACKEND_ALLOWED_HOSTS=
ENV DOUJI_BACKEND_ALLOWED_CORS_URLS=http://localhost:3000
ENV DOUJI_BACKEND_HTTPS_REDIRECT=0



EXPOSE 8080

WORKDIR /app

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Backend/Douji Backend.csproj", "Backend/"]
RUN dotnet restore "./Backend/Douji Backend.csproj"
COPY . .
WORKDIR "/src/Backend"
RUN dotnet build "./Douji Backend.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Douji Backend.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "Douji.Backend.dll"]