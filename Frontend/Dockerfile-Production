FROM alpine:latest

# Environment variables
ENV DOUJI_FRONTEND_PORT=3000
ENV DOUJI_FRONTEND_BACKEND_URL=
ENV NEXT_PUBLIC_DEV_BUILD=0

# Set ports
EXPOSE 3000



# Install NodeJS runtime and NPM package manager
RUN apk add nodejs npm

# Setup user
# User has to be added manually because the USER directive doesn't correctly create user on alpine
RUN adduser -S -D -s /bin/sh next
USER next

# Install dependencies
WORKDIR /app
ADD --chown=next "package.json" "package-lock.json" .
RUN npm install --omit dev --omit optional --include prod --no-fund

# Copy built application
ADD --chown=next .next .next

# Define entrypoint
ENTRYPOINT [ "npm", "run", "start_docker" ]
