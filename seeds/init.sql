-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id BIGINT PRIMARY KEY,
    price DECIMAL NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    region_origin VARCHAR(2) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create idempotency table
CREATE TABLE idempotency_keys (
    request_id VARCHAR PRIMARY KEY,
    response JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert 1000+ rows
INSERT INTO properties (id, price, bedrooms, bathrooms, region_origin)
SELECT
    generate_series(1, 1500),
    (random()*500000 + 50000)::decimal,
    (random()*5)::int,
    (random()*3)::int,
    'us';
