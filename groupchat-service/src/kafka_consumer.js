const { insertNewUser } = require("./db");

const { Kafka } = require("kafkajs");
const kafka = new Kafka({
  clientId: "group-chat-service",
  brokers: ["localhost:29092"], // Ensure this matches your Kafka setup
});

const consumer = kafka.consumer({ groupId: "group-chat-service-group" });

async function startKafkaGroupConsumer() {
    await consumer.connect();
    await consumer.subscribe({ topic: 'user-created', fromBeginning: true });
  
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const user = JSON.parse(message.value.toString());
        console.log('New user registered:', user);
        await insertNewUser(user.id, user.email, user.username);      
      },
    });
  }

module.exports = { startKafkaGroupConsumer };
