FROM nginx:alpine

RUN apk add certbot certbot-nginx

# Environment variables
ENV DOUJI_HTTP_PORTS=80 \
	DOUJI_HTTPS_PORTS=443 \
	DOUJI_HTTPS_REDIRECT=0 \
	DOUJI_URL=localhost \
	DOUJI_DEV=1



EXPOSE 80 443



RUN mkdir -p "/var/www/certbot"

ADD --chmod=755 [ "src/docker-entrypoint-douji.sh", "src/certbot-renew.sh", "/" ]
ADD [ "src/nginx/nginx.conf", "/etc/nginx/nginx.conf" ]
ADD [ "src/nginx/sites", "/app/sites" ]

HEALTHCHECK \
	--start-period=5s \
	--start-interval=2s \
	--interval=30s \
	--timeout=30s \
	--retries=3 \
	CMD curl --fail --silent --resolve douji.internal:80:127.0.0.1 http://douji.internal/health/proxy

CMD [ "nginx", "-g", "daemon off;" ]
ENTRYPOINT [ "/docker-entrypoint-douji.sh" ]
