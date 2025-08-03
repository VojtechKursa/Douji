# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM vojtechkursa/dotnet:aspnet-8.0-alpine AS base

# Environment variables
ENV DOUJI_BACKEND_URLS=http://0.0.0.0:8080 \
	DOUJI_BACKEND_ALLOWED_HOSTS= \
	DOUJI_BACKEND_ALLOWED_CORS_URLS=http://localhost:3000,http://localhost,https://localhost \
	DOUJI_BACKEND_HTTPS_REDIRECT=0

EXPOSE 8080

WORKDIR "/app"



# This stage is used to build the service project
FROM vojtechkursa/dotnet:sdk-8.0-alpine AS build

ARG BUILD_CONFIGURATION=Release

WORKDIR "/src"
COPY ["Backend/Douji Backend.csproj", "Backend/"]
RUN dotnet restore "./Backend/Douji Backend.csproj"

COPY . .
WORKDIR "/src/Backend"
RUN dotnet build "./Douji Backend.csproj" -c $BUILD_CONFIGURATION -o "/app/build"



# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish

ARG BUILD_CONFIGURATION=Release

WORKDIR "/src/Backend"
RUN dotnet publish "./Douji Backend.csproj" -c $BUILD_CONFIGURATION -o "/app/publish" /p:UseAppHost=false



# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final

USER dotnet

WORKDIR "/app"
COPY --from=publish --chown=dotnet:dotnet "/app/publish" .

ENTRYPOINT ["dotnet", "Douji.Backend.dll"]
