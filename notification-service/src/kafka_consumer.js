const { Kafka } = require("kafkajs");
const { redisClient } = require("./redis_client");

const kafka = new Kafka({
  clientId: "notification-service",
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"]
});

const consumer = kafka.consumer({ groupId: "notification-service-group" });

//-------------------------------------------------------------------------------------------------------------

async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: "undelivered-notifications", fromBeginning: false });
  console.log("Subscribed to topic: undelivered-notifications");
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const parsed = JSON.parse(message.value.toString());
        console.log(parsed);
        const recipientId = parsed.receiver_id || parsed.user_id;
        if (!recipientId) return;

        await redisClient.rPush(`undelivered:${recipientId}`, JSON.stringify(parsed));
        console.log(`[Kafka][${topic}] Stored undelivered notification for ${recipientId}`);
      } catch (err) {
        console.error("Error processing message:", err);
      }
    },
  });
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { startKafkaConsumer };
