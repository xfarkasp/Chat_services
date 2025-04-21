const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "websocket-service",
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"],
});

module.exports = kafka;
