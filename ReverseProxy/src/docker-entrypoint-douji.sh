#!/bin/sh

# Generate site config

cd /app/sites
python make_conf.py
cp douji.conf /etc/nginx/conf.d/douji.conf

cd /



# Request certificates if necessary
if [ -n "${DOUJI_HTTPS_PORTS}" -a "${DOUJI_DEV}" -eq 0 ]; then
	echo "Requesting certificate"

	if [ ! -e /etc/ssl/douji/douji.crt ]; then
		email=''
		if [ -n $DOUJI_CERTBOT_EMAIL ]; then
			email="-m $DOUJI_CERTBOT_EMAIL"
		fi

		domains=echo "$DOUJI_URL" | sed -r 's/\s+/,/g'

		certbot certonly -v --standalone --cert-name douji -d "$domains" $email --force-renewal --agree-tos --non-interactive

		ln -s /etc/letsencrypt/live/douji /etc/ssl/douji

		/certbot-renew.sh &
	fi
else
	echo "Skipping certificate request"
fi

nginx -t

/docker-entrypoint.sh "$@"
