Distributed Property Listing Backend (Multi-Region)


📌 Overview

This project implements a distributed, multi-region backend system for property listings, simulating US and EU geographic regions.
It demonstrates how modern globally distributed systems achieve:

High availability

Fault tolerance

Eventual consistency

Safe concurrent updates

The system uses NGINX for global routing and failover, Apache Kafka for asynchronous cross-region replication, and PostgreSQL databases per region with optimistic locking and idempotency guarantees.

🏗️ Architecture Overview
Client
  |
  v
NGINX (Reverse Proxy & Failover)
  |                |
  v                v
Backend-US      Backend-EU
  |                |
  v                v
Postgres-US     Postgres-EU
   \              /
    \            /
     ---> Kafka <---
          (Async Replication)
Key Design Decisions

Multi-region deployment to reduce latency and increase availability

Asynchronous replication to avoid cross-region write latency

Optimistic locking to prevent race conditions

Idempotent APIs to handle retries safely

Failover routing to maintain service availability during outages

🧰 Tech Stack
Component	Technology
Reverse Proxy	NGINX
Backend	Node.js (Express)
Messaging	Apache Kafka
Databases	PostgreSQL
Orchestration	Docker Compose
Testing	Node.js + Axios
📂 Project Structure
distributed-property-backend/
├── docker-compose.yml
├── .env.example
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── src/
│   └── Dockerfile
├── seeds/
│   └── init.sql
├── tests/
│   ├── optimistic-lock.test.js
│   └── demonstrate_failover.sh
└── README.md
⚙️ Setup Instructions
1️⃣ Prerequisites

Docker & Docker Compose

Node.js (v18+)

Windows PowerShell / Linux shell

2️⃣ Environment Variables

Create a .env file (reference .env.example):

POSTGRES_PASSWORD=postgres
3️⃣ Start the System
docker compose up -d --build

All services will become healthy within 2–3 minutes.

Verify:

docker ps
🔀 NGINX Routing & Failover
Routing Rules
Path	Routed To
/us/*	backend-us
/eu/*	backend-eu
Failover Behavior

If backend-us is down → /us/* routes to backend-eu

If backend-eu is down → /eu/* routes to backend-us

Test
curl http://localhost:8081/us/health
curl http://localhost:8081/eu/health
🗄️ Database Schema

Each region has its own PostgreSQL database.

properties Table
Column	Type	Description
id	BIGINT (PK)	Property ID
price	DECIMAL	Property price
bedrooms	INTEGER	Bedrooms
bathrooms	INTEGER	Bathrooms
region_origin	VARCHAR(2)	us / eu
version	INTEGER	Optimistic lock version
updated_at	TIMESTAMP	Last update time

Each DB is seeded with 1000+ records on startup.

✏️ Property Update API
Endpoint
PUT /:region/properties/:id

Example:

PUT /us/properties/123
Request Body
{
  "price": 500000,
  "version": 1
}
Response (200 OK)
{
  "id": 123,
  "price": 500000,
  "version": 2,
  "updated_at": "2026-02-24T08:05:11.988Z"
}
🔐 Optimistic Locking (Concurrency Safety)

Each record has a version field.

Behavior

Update succeeds only if request version == DB version

Otherwise → 409 Conflict

Why?

Prevents lost updates when concurrent writes occur.

♻️ Idempotency

All PUT requests require:

X-Request-ID: <UUID>
Behavior

First request → processed

Duplicate request ID → 422 Unprocessable Entity

This prevents duplicate writes during retries or network issues.

🔄 Kafka Asynchronous Replication
Topic
property-updates
Published Message Schema
{
  "id": 123,
  "price": 500000,
  "bedrooms": 3,
  "bathrooms": 2,
  "region_origin": "us",
  "version": 2,
  "updated_at": "2026-02-24T08:05:11.988Z"
}
Replication Rules

backend-us consumes updates from eu

backend-eu consumes updates from us

A backend never consumes its own region’s events

This ensures eventual consistency across regions.

⏱️ Replication Lag Monitoring
Endpoint
GET /:region/replication-lag

Example:

GET /eu/replication-lag
Response
{
  "lag_seconds": 2.3
}

This shows how far behind the replica is from the latest update.

🧪 Testing
1️⃣ Optimistic Locking Test
node tests/optimistic-lock.test.js

Expected result:

One request → 200

One request → 409

2️⃣ Failover Demonstration
bash tests/demonstrate_failover.sh

Steps performed:

Start services

Call /us/health

Stop backend-us

Call /us/health again

Request is served by backend-eu

📜 NGINX Logging

NGINX access logs include upstream timing:

upstream_response_time=0.005

This helps observe backend latency and failover behavior.

🔐 Security Notes

Credentials are passed via environment variables

No secrets are hardcoded

.env.example documents required variables