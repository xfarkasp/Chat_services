require("dotenv").config();
const { startKafkaConsumer } = require("./kafka_consumer");

(async () => {
  await startKafkaConsumer();
  console.log("Notification Service is running");
})();
