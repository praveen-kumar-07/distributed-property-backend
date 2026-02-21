const { Kafka } = require("kafkajs");
const db = require("./db");

let lastConsumedTimestamp = null;

const kafka = new Kafka({
  clientId: "property-consumer",
  brokers: [process.env.KAFKA_BROKER],
});

const consumer = kafka.consumer({
  groupId: `property-group-${process.env.REGION}`,
});

async function startConsumer() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "property-updates",
    fromBeginning: false,
  });

  console.log(`Consumer started for region ${process.env.REGION}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      const data = JSON.parse(message.value.toString());

      // Ignore messages from same region
      if (data.region_origin === process.env.REGION) {
        return;
      }

      // Apply replication update
      await db.query(
        `UPDATE properties
         SET price = $1,
             bedrooms = $2,
             bathrooms = $3,
             region_origin = $4,
             version = $5,
             updated_at = $6
         WHERE id = $7`,
        [
          data.price,
          data.bedrooms,
          data.bathrooms,
          data.region_origin,
          data.version,
          data.updated_at,
          data.id,
        ]
      );

      lastConsumedTimestamp = new Date(data.updated_at);
      console.log(`Replicated property ${data.id} to ${process.env.REGION}`);
    },
  });
}

function getReplicationLag() {
  if (!lastConsumedTimestamp) return 0;

  const now = new Date();
  return (now - lastConsumedTimestamp) / 1000;
}

module.exports = {
  startConsumer,
  getReplicationLag,
};