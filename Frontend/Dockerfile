# Base stage
FROM alpine:latest AS base

# Environment variables
ENV DOUJI_FRONTEND_PORT=3000 \
	DOUJI_FRONTEND_BACKEND_URL= \
	NEXT_PUBLIC_DEV_BUILD=1

# Set ports
EXPOSE 3000

# Install NodeJS runtime and NPM package manager
RUN apk add nodejs npm curl

# Setup user
# User has to be added manually because the USER directive doesn't correctly create user on alpine
RUN adduser -S -D -s /bin/sh next
USER next

# Create app directory
WORKDIR /app



# Stage with minimal npm packages
FROM base AS packages
WORKDIR /app

# Install minimal dependencies
ADD --chown=next [ "package.json", "package-lock.json", "." ]
RUN npm install --omit dev --omit optional --include prod --no-fund



# Development image
FROM base AS dev
WORKDIR /app

# Define mountpoints
VOLUME [ "/app" ]
VOLUME [ "/app/.next" ]

# Set user to root for development purposes
USER root

# Define entrypoint
ENTRYPOINT [ "/bin/sh", "./docker-entrypoint-dev.sh" ]



# Stage for building the application
FROM packages AS build
WORKDIR /app

# Install all dependencies
RUN npm install

# Copy project files
ADD . .

# Build
RUN npm run build



# Production image
FROM packages AS prod
WORKDIR /app

# Copy built application
COPY --from=build --chown=next [ "/app/.next", "./.next" ]

HEALTHCHECK \
	--start-period=2s \
	--start-interval=2s \
	--interval=30s \
	--timeout=30s \
	--retries=3 \
	CMD curl --fail --silent -o /dev/null 127.0.0.1:$DOUJI_FRONTEND_PORT

# Define entrypoint
ENTRYPOINT [ "npm", "run", "start_docker" ]
