require("dotenv").config();
const cors = require("cors");
const express = require("express");
const { setupRoutes } = require("./group_routes");
const { startKafkaGroupConsumer } = require("./kafka_consumer");
const { producer } = require("./kafka_producer");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:8000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Setup API routes
setupRoutes(app);

//-------------------------------------------------------------------------------------------------------------

(async () => {
  try {
    // Start Kafka Consumer
    await startKafkaGroupConsumer();
    console.log("Kafka Consumer Started");

    // Start Kafka Producer
    await producer.connect();
    console.log("Kafka Producer Connected - Group Chat Service");

    // Start Express Server
    const PORT = process.env.PORT || 5005;
    app.listen(PORT, () => console.log(`Group Chat Service running on port ${PORT}`));

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      process.exit(0);
    });

  } catch (error) {
    console.error("Error starting Group Chat Service:", error);
  }
})();

//-------------------------------------------------------------------------------------------------------------
