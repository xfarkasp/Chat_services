require("dotenv").config();
const { Kafka } = require("kafkajs");
const { redisClient } = require("./redis_client");

const kafkaBroker = process.env.KAFKA_BROKER;
if (!kafkaBroker) {
  throw new Error("KAFKA_BROKER environment variable is missing!");
}

console.log("Kafka Broker being used:", kafkaBroker);

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"], // Kubernetes DNS name
});

const consumer = kafka.consumer({ groupId: "chat-users" });
const groupConsumer = kafka.consumer({ groupId: "group-message-consumer" });

const startKafkaDirectMessageConsumer = async (localConnections) => {
  await consumer.connect();
  console.log("Kafka Direct Consumer connected - WebSocket Service");
  await consumer.subscribe({ topic: "chat-messages", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { sender_id, receiver_id, content, media_url } = JSON.parse(message.value);
      console.log(`Received message from ${sender_id} for ${receiver_id}: ${content}, Media URL: ${media_url}`);

      const receiverInstance = await redisClient.get(`user:${receiver_id}`);

      if (receiverInstance === process.env.INSTANCE_ID || receiverInstance === "default-instance") {
        const client = localConnections.get(receiver_id);

        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ sender_id, content, media_url }));
          console.log(`Message delivered to user ${receiver_id}`);
        } else {
          console.log(`User ${receiver_id} is offline on this instance.`);
        }
      } else if (receiverInstance) {
        console.log(`User ${receiver_id} connected to instance ${receiverInstance}`);
      } else {
        console.log(`User ${receiver_id} is offline`);
      }
    },
  });
};

async function startGroupMessageConsumer(clients) {
  await groupConsumer.connect();
  console.log("Kafka Group Consumer connected - WebSocket Service");
  await groupConsumer.subscribe({ topic: "group-messages", fromBeginning: false });

  await groupConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const { sender_id, content } = JSON.parse(message.value);
      try {
        const data = JSON.parse(message.value.toString());
        console.log("[GroupMessageConsumer] Received:", data);

        if (Array.isArray(data.group_members)) {
          console.log("Connected users in localConnections:", [...clients.keys()]); // Debug
          console.log("Group Members:", data.group_members);

          data.group_members.forEach((user_id) => {
            const ws = clients.get(String(user_id));

            if (ws) {
              console.log(`Sending message to User ${user_id}`);
              console.log(data);
              ws.send(JSON.stringify({ sender_id, content }));
            } else {
              console.warn(`User ${user_id} is not connected.`);
            }
          });
        } else {
          console.warn("[GroupMessageConsumer] No group_members array in message");
        }
      } catch (error) {
        console.error("[GroupMessageConsumer] Error processing message:", error);
      }
    },
  });
}

module.exports = { startKafkaDirectMessageConsumer,  startGroupMessageConsumer };
