# Base stage
FROM nginx:alpine AS base

# Define environment variables for the Douji project
ENV DOUJI_HTTP_PORTS=80 \
	DOUJI_HTTPS_PORTS=443 \
	DOUJI_HTTPS_REDIRECT=0 \
	DOUJI_URL=localhost \
	DOUJI_DEV=1 \
	DOUJI_CERTBOT_EMAIL=

# Expose HTTP and HTTPS server ports
EXPOSE 80 443

# Add volume for storing SSL certificates
VOLUME [ "/etc/ssl/douji" ]

# Set working directory
WORKDIR /

# Install Python for template generation (it's required by certbot in production anyway)
RUN apk add python3

# Link Nginx config file to data folder
RUN ln -sf /app/data/nginx/nginx.conf /etc/nginx/nginx.conf

# Define entrypoint
CMD [ "nginx", "-g", "daemon off;" ]
ENTRYPOINT [ "/app/scripts/docker-entrypoint.sh" ]



# Stage with project files so they can be added after i.e. package installation
#	so changing project files doesn't unnecessarily invalidate caches
FROM base AS files

# Add project files
ADD [ "app", "/app" ]

# Make scripts executable
RUN chmod +x /app/scripts/*.sh



# Stage for building development image
FROM files AS dev



# Stage for building production image
FROM base AS prod

# Make Nginx save logs into a volume instead of redirecting them to stdout and stderr
RUN rm -r "/var/log/nginx"
VOLUME [ "/var/log/nginx" ]

# Install certbot
RUN apk add certbot certbot-nginx

# Add volume for persisting Let's encrypt configuration
VOLUME [ "/etc/letsencrypt" ]

# Prepare directories and links for SSL certificates
RUN mkdir -p "/var/www/certbot" "/etc/letsencrypt/live" && \
	ln -s "/etc/ssl/douji" "/etc/letsencrypt/live/douji"

# Copy project files here so their change doesn't invalidate steps above
COPY --from=files [ "/app", "/app" ]

# Add health check
HEALTHCHECK \
	--start-period=4s \
	--start-interval=2s \
	--interval=30s \
	--timeout=30s \
	--retries=3 \
	CMD curl --fail --silent -o /dev/null --resolve douji.internal:80:127.0.0.1 http://douji.internal/health/proxy
