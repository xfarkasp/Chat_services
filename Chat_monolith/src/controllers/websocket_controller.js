require("dotenv").config();
const { redisClient } = require("../config/redis_client");

async function deliverDirectMessage(messagePayload, localConnections) {
    const { sender_id, receiver_id, content, media_url } = messagePayload;
  
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
      //await publishUndeliveredNotification(receiver_id, { receiver_id, content });
    }
  }