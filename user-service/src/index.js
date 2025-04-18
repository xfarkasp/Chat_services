require("dotenv").config();
const cors = require("cors");
const express = require("express");
const { connectKafkaProducer} = require("./kafka_publisher");
const { connectRedis } = require("./redis_client");
const {setupRoutes} = require("./user_routes");

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:8000",
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

// Setup API routes
setupRoutes(app);

//-------------------------------------------------------------------------------------------------------------

(async () => {
  try {
    // Connect kafka producer
    connectKafkaProducer();
    // Connect to Redis
    connectRedis();

    // Start Express Server
    const PORT = process.env.PORT || 5002;
    app.listen(PORT, () => {
      console.log(`User Service running on port ${PORT}`);
    });

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
