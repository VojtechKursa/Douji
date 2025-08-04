FROM nginx:alpine

RUN apk add certbot certbot-nginx

# Environment variables
ENV DOUJI_HTTP_PORTS=80 \
	DOUJI_HTTPS_PORTS=443 \
	DOUJI_HTTPS_REDIRECT=0 \
	DOUJI_URL=localhost \
	DOUJI_DEV=1 \
	DOUJI_CERTBOT_EMAIL=



EXPOSE 80 443



# Prepare environment for certificates
VOLUME [ "/etc/ssl/douji" ]
VOLUME [ "/etc/letsencrypt" ]

RUN mkdir -p "/var/www/certbot" "/etc/letsencrypt/live" && \
	ln -s "/etc/ssl/douji" "/etc/letsencrypt/live/douji"



ADD --chmod=755 [ "src/docker-entrypoint-douji.sh", "src/certbot-renew.sh", "/" ]
ADD [ "src/nginx/nginx.conf", "/etc/nginx/nginx.conf" ]
ADD [ "src/nginx/sites", "/app/sites" ]

HEALTHCHECK \
	--start-period=4s \
	--start-interval=2s \
	--interval=30s \
	--timeout=30s \
	--retries=3 \
	CMD curl --fail --silent -o /dev/null --resolve douji.internal:80:127.0.0.1 http://douji.internal/health/proxy

CMD [ "nginx", "-g", "daemon off;" ]
ENTRYPOINT [ "/docker-entrypoint-douji.sh" ]
