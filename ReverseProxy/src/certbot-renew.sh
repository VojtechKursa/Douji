#!/bin/sh

while :
do
	sleep 24h
	certbot renew >> /dev/stdout
done