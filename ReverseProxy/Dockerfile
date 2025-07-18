FROM nginx:alpine

RUN apk add certbot certbot-nginx

# Environment variables
ENV DOUJI_HTTP_PORTS=80
ENV DOUJI_HTTPS_PORTS=443
ENV DOUJI_HTTPS_REDIRECT=0
ENV DOUJI_URL=localhost
ENV DOUJI_DEV=1



EXPOSE 80 443



RUN mkdir -p /var/www/certbot

ADD src/nginx/nginx.conf /etc/nginx/
ADD src/docker-entrypoint-douji.sh src/certbot-renew.sh /
ADD src/nginx/sites /app/sites

CMD [ "nginx", "-g", "daemon off;" ]
ENTRYPOINT [ "/docker-entrypoint-douji.sh" ]
