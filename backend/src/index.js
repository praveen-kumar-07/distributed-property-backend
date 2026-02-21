require("dotenv").config();
const express = require("express");
const routes = require("./routes");
const { connectProducer } = require("./kafka");
const { startConsumer } = require("./consumer");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use("/", routes);

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startServer() {
  console.log("Starting backend...");

  // Retry Kafka connection
  let connected = false;
  while (!connected) {
    try {
      await connectProducer();
      await startConsumer();
      connected = true;
      console.log("Kafka connected successfully");
    } catch (err) {
      console.log("Kafka not ready, retrying in 5 seconds...");
      await wait(5000);
    }
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();