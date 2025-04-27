const pool = require("./db");
const { Kafka } = require('kafkajs');
const { sendMessage } = require('./chat_controller')

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"], // Kubernetes DNS name
});

const consumer = kafka.consumer({ groupId: 'chat-service-group' });
const groupConsumer = kafka.consumer({ groupId: `groupchat-service-group` });

//-------------------------------------------------------------------------------------------------------------

async function startKafkaUserConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-created', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const user = JSON.parse(message.value.toString());
      //console.log('New user registered:', user);
      
      await pool.query(
        "INSERT INTO users (id, email, username) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
        [user.id, user.email, user.username]
      );      
    },
  });
}

//-------------------------------------------------------------------------------------------------------------

async function startGroupMessageConsumer() {
  await groupConsumer.connect();
  console.log("Kafka Group Consumer connected");
  await groupConsumer.subscribe({ topic: "group-messages", fromBeginning: true });

  await groupConsumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        console.log("new kafka group message");
        const data = JSON.parse(message.value.toString());
        console.log(data);
        for (const receiver_user of data.group_members) {
          console.log(data.sender_id, receiver_user, data.content);
          sendMessage({
            sender_id: data.sender_id,
            receiver_id: receiver_user,
            content: data.content
          });
        }
      } catch (error) {
        console.error("[GroupMessageConsumer] Error processing group message:", error);
      }
    },
  });
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { startKafkaUserConsumer, startGroupMessageConsumer };

//-------------------------------------------------------------------------------------------------------------
