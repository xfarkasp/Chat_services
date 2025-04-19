require("dotenv").config();
const { Kafka } = require("kafkajs");
const { publishUndeliveredNotification } = require("./kafka_producer");
const WebSocket = require("ws");
const { redisClient } = require("./redis_client");

const instanceId = process.env.INSTANCE_ID || Math.random().toString(36).slice(2);

const kafkaBroker = process.env.KAFKA_BROKER;
if (!kafkaBroker) {
  throw new Error("KAFKA_BROKER environment variable is missing!");
}

console.log("Kafka Broker being used:", kafkaBroker);

const kafka = new Kafka({
  clientId: `websocket-${instanceId}`,
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"],
});

const consumer = kafka.consumer({ groupId: `ws-group-${instanceId}` });
const groupConsumer = kafka.consumer({ groupId: `ws-group-group-${instanceId}` });

//-------------------------------------------------------------------------------------------------------------

const startKafkaDirectMessageConsumer = async (localConnections) => {
  await consumer.connect();
  console.log("Kafka Direct Consumer connected - WebSocket Service");
  await consumer.subscribe({ topic: "chat-messages", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const { receiver_id, sender_id, content, media_url } = JSON.parse(message.value);
  
      const client = localConnections.get(receiver_id);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ sender_id, content, media_url }));
        console.log(`Delivered message from ${sender_id} to ${receiver_id}`);
      } else {
        console.log(`User ${receiver_id} not connected on this instance — skipping.`);
      }
    }
  });
  
};

//-------------------------------------------------------------------------------------------------------------

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

//-------------------------------------------------------------------------------------------------------------

module.exports = { startKafkaDirectMessageConsumer,  startGroupMessageConsumer };
