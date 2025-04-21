const cors = require("cors");
const express = require("express");
const { setupRoutes } = require("./chat_routes");
const { startKafkaConsumer } = require("./kafka_consumer");
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
    // Kafka Consumer
    await startKafkaConsumer();
    console.log("Connected to Kafka - Chat Service");

    // Start Kafka Producer
    await producer.connect();
    console.log("Kafka Producer Connected - Chat Service");

    // Start Express Server
    const PORT = process.env.PORT || 5004;
    app.listen(PORT, () => console.log(`Chat Service running on port ${PORT}`));

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      process.exit(0);
    });

  } catch (error){
    console.error("Error starting Chat Service: ", error);
  }
  
})();

//-------------------------------------------------------------------------------------------------------------
