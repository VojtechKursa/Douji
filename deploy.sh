#!/bin/sh

docker compose --env-file=.env.local -f ./docker-compose.prod.yaml up
