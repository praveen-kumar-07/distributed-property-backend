#!/bin/bash

echo "Starting services..."
docker compose up -d
sleep 30

echo "Checking US health (should succeed)..."
curl http://localhost:8081/us/health

echo ""
echo "Stopping backend-us..."
docker stop backend-us
sleep 5

echo "Checking US health again (should failover to EU)..."
curl http://localhost:8081/us/health

echo ""
echo "Restarting backend-us..."
docker start backend-us

echo "Failover demonstration complete."