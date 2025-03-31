const { Kafka } = require("kafkajs");

// Kafka Producer
const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"],
});

const producer = kafka.producer();

module.exports = { producer };
