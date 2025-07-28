FROM alpine:latest

# Environment variables
ENV DOUJI_FRONTEND_PORT=3000
ENV DOUJI_FRONTEND_BACKEND_URL=
ENV NEXT_PUBLIC_DEV_BUILD=1

# Set ports
EXPOSE 3000



# Install NodeJS runtime and NPM package manager
RUN apk add nodejs npm

# Define mountpoints
WORKDIR /app
VOLUME [ "/app" ]
VOLUME [ "/app/.next" ]

# Define entrypoint
ENTRYPOINT [ "/bin/sh", "./docker-entrypoint-dev.sh" ]
