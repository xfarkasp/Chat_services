require("dotenv").config();
const kafka = require("./kafka_client");
const { publishUndeliveredNotification } = require("./kafka_producer");
const WebSocket = require("ws");
const { redisClient } = require("./redis_client");

const instanceId =
  process.env.INSTANCE_ID || Math.random().toString(36).slice(2);

const consumer = kafka.consumer({ groupId: `ws-group-${instanceId}` });

//-------------------------------------------------------------------------------------------------------------

const startKafkaDirectMessageConsumer = async (localConnections) => {
  await consumer.connect();
  await consumer.subscribe({ topic: "chat-messages", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const { receiver_id, sender_id, content, media_url, group_id } =
        JSON.parse(message.value);
      console.log(typeof receiver_id);
      console.log(group_id);
      console.log(receiver_id, sender_id, content);
      const isOnline = await redisClient.exists(`user:${receiver_id}`);

      if (isOnline === 0) {
        console.log(`User ${receiver_id} is offline`);
        const sender = localConnections.get(sender_id);
        if (sender && sender.readyState === WebSocket.OPEN) {
          console.log(`Publishing undelivered notification for ${receiver_id}`);
          await publishUndeliveredNotification(receiver_id, {
            receiver_id,
            sender_id,
            group_id,
            content,
          });
        }
        return;
      }

      const client = localConnections.get(receiver_id);
      if (client && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({ sender_id, group_id, content, media_url })
        );
        console.log(`Delivered message from ${sender_id} to ${receiver_id}`);
        return;
      }
    },
  });
};

module.exports = { startKafkaDirectMessageConsumer };
