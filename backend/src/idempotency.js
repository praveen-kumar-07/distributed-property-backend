const db = require("./db");

async function checkAndStoreRequest(requestId) {
  if (!requestId) {
    throw new Error("Missing X-Request-ID header");
  }

  const existing = await db.query(
    "SELECT * FROM idempotency_keys WHERE request_id = $1",
    [requestId]
  );

  if (existing.rows.length > 0) {
    return false; // duplicate
  }

  await db.query(
    "INSERT INTO idempotency_keys (request_id) VALUES ($1)",
    [requestId]
  );

  return true;
}

module.exports = { checkAndStoreRequest };
