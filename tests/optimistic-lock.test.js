const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

async function runTest() {
  const propertyId = 60;

  // Get current version manually from DB before running test

  const body = {
    price: 888888,
    version: 1
  };

  const req1 = axios.put(
  `http://localhost:8081/us/properties/${propertyId}`,
  body,
  { headers: { "X-Request-ID": crypto.randomUUID() } }
);

const req2 = axios.put(
  `http://localhost:8081/us/properties/${propertyId}`,
  body,
  { headers: { "X-Request-ID": crypto.randomUUID() } }
);
  const results = await Promise.allSettled([req1, req2]);

  console.log("Concurrent results:");
  console.log(results);
}

runTest();