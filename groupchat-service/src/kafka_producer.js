const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: "group-chat-service",
  brokers: ["localhost:29092"],
});

const producer = kafka.producer();

module.exports = { producer };
