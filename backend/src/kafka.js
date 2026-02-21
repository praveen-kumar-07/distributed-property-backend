const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "property-service",
  brokers: [process.env.KAFKA_BROKER],
});

const producer = kafka.producer();

async function connectProducer() {
  await producer.connect();
  console.log("Kafka Producer Connected");
}

async function publishUpdate(message) {
  await producer.send({
    topic: "property-updates",
    messages: [
      {
        value: JSON.stringify(message),
      },
    ],
  });
}

module.exports = {
  connectProducer,
  publishUpdate,
};
