const { Pool } = require("pg");
const pool = require("./db");

const { Kafka } = require('kafkajs');
const kafka = new Kafka({
  clientId: 'chat-service',
  brokers: ['localhost:29092'],
});

const consumer = kafka.consumer({ groupId: 'chat-service-group' });

async function startKafkaConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: 'user-created', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const user = JSON.parse(message.value.toString());
      console.log('New user registered:', user);
      
      await pool.query(
        "INSERT INTO users (id, email, username) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
        [user.id, user.email, user.username]
      );      
    },
  });
}
module.exports = { startKafkaConsumer };
