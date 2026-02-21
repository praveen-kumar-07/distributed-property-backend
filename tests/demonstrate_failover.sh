#!/bin/bash

docker compose up -d
sleep 15

echo "Testing US health..."
curl http://localhost:8081/us/health

echo "Stopping backend-us..."
docker stop backend-us
sleep 5

echo "Testing failover..."
curl http://localhost:8081/us/health

echo "Done."