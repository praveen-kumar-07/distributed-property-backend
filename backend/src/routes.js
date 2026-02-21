const express = require("express");
const db = require("./db");
const { checkAndStoreRequest } = require("./idempotency");
const { publishUpdate } = require("./kafka");
const { getReplicationLag } = require("./consumer");

const router = express.Router();

// Health endpoint
router.get("/:region/health", (req, res) => {
  res.status(200).send("OK");
});

router.get("/:region/replication-lag", (req, res) => {
  const lag = getReplicationLag();
  res.status(200).json({ lag_seconds: lag });
});

// PUT update endpoint
router.put("/:region/properties/:id", async (req, res) => {
  try {
    const { region, id } = req.params;
    const { price, version } = req.body;
    const requestId = req.header("X-Request-ID");

    if (!price || version === undefined) {
      return res.status(400).json({ error: "Missing price or version" });
    }

    // Idempotency check
    const isNew = await checkAndStoreRequest(requestId);
    if (!isNew) {
      return res.status(422).json({ error: "Duplicate request" });
    }

    // Optimistic locking update
    const result = await db.query(
      `UPDATE properties
       SET price = $1,
           version = version + 1,
           updated_at = NOW(),
           region_origin = $2
       WHERE id = $3 AND version = $4
       RETURNING *`,
      [price, region, id, version]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: "Version conflict" });
    }

    const updatedProperty = result.rows[0];

    // Publish Kafka event
    await publishUpdate(updatedProperty);

    return res.status(200).json(updatedProperty);


  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
