require("dotenv").config();
const { connectRedis, disconnectRedis } = require("./redis_client");
const { startKafkaDirectMessageConsumer, startGroupMessageConsumer } = require("./kafka_consumer");
const { startWebSocketServer, localConnections } = require("./websocket_server");

(async () => {
  try {
    // Connect Redis
    await connectRedis();

    // Start WebSocket Server
    startWebSocketServer();

    // Start Kafka Consumers
    await startKafkaDirectMessageConsumer(localConnections);
    await startGroupMessageConsumer(localConnections);

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      console.log("SIGTERM: shutting down gracefully...");
    
      await kafkaConsumer.disconnect();
      process.exit(0);
    });

  } catch (error) {
    console.error("Error starting services:", error);
  }
})();
