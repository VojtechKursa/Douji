#!/bin/sh



# Backend
cd ./Backend

./build.sh

cd ..



# Frontend
cd ./Frontend

npm install
npm run build

cd ..



# Deploy

docker compose --env-file=.env.local -f ./docker-compose.prod.yaml up
