# Base stage, used as base for all following stages and when running from Visual Studio in fast mode
FROM vojtechkursa/dotnet:aspnet-8.0-alpine AS base

# Environment variables
ENV DOUJI_BACKEND_URLS=http://0.0.0.0:8080 \
	DOUJI_BACKEND_ALLOWED_HOSTS= \
	DOUJI_BACKEND_ALLOWED_CORS_URLS=http://localhost:3000,http://localhost,https://localhost \
	DOUJI_BACKEND_HTTPS_REDIRECT=0

EXPOSE 8080

WORKDIR "/app"



# Stage with installed .NET SDK
FROM base AS sdk

RUN apk add dotnet8-sdk



# Stage used for running the backend in development mode
FROM sdk AS dev

WORKDIR "/app"

VOLUME [ "/app" ]
VOLUME [ "/app/bin" ]
VOLUME [ "/app/obj" ]

ENTRYPOINT [ "dotnet", "run" ]



# This stage is used to build the production version of the project
FROM sdk AS build

ARG BUILD_CONFIGURATION=Release

WORKDIR "/src"
ADD [ "Backend/Douji Backend.csproj", "Backend/Douji Backend.csproj" ]
RUN dotnet restore "./Backend/Douji Backend.csproj"

ADD [ "Backend/", "Backend/" ]
WORKDIR "/src/Backend"
RUN dotnet build "./Douji Backend.csproj" -c $BUILD_CONFIGURATION -o "/app/build"



# This stage is used to publish the production version of the project
FROM build AS publish

ARG BUILD_CONFIGURATION

WORKDIR "/src/Backend"
RUN dotnet publish "./Douji Backend.csproj" -c $BUILD_CONFIGURATION -o "/app/publish" /p:UseAppHost=false



# This stage is used in production:
# - To run the project or
# - When running from Visual Studio in regular mode (Default when not using the Debug configuration)
FROM base AS final

RUN apk add curl

USER dotnet

WORKDIR "/app"
COPY --from=publish --chown=dotnet:dotnet "/app/publish" .

HEALTHCHECK \
	--start-interval=3s \
	--start-period=2s \
	--interval=30s \
	--timeout=30s \
	--retries=3 \
	CMD curl --fail --silent -o /dev/null localhost:8080/api/room

ENTRYPOINT ["dotnet", "Douji.Backend.dll"]
