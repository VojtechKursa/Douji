FROM alpine:latest

# Environment variables
ENV DOUJI_FRONTEND_PORT="3000"
ENV DOUJI_FRONTEND_DOCKER_EXPOSE="3000"
ENV DOUJI_FRONTEND_BACKEND_URL=""
ENV NEXT_PUBLIC_DEV_BUILD="0"



# Setup user
RUN adduser -S -D -s /bin/bash next

# Install NodeJS runtime and NPM package manager
RUN apk add nodejs npm

# Install dependencies
WORKDIR /app
COPY "package.json" "package-lock.json" ./
RUN npm install --omit dev --omit optional --include prod --no-fund

# Copy built application
COPY --chown=next .next .next

# Set user
USER next

# Set ports
EXPOSE ${DOUJI_FRONTEND_DOCKER_EXPOSE}

# Define entrypoint
ENTRYPOINT [ "npm", "run", "start_docker" ]
