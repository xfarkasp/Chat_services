const { Kafka } = require("kafkajs");

// Initialize Kafka
const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"], // Kubernetes DNS name
});

const producer = kafka.producer();
let isProducerConnected = false;

//-------------------------------------------------------------------------------------------------------------

// Function to connect Kafka producer
async function connectKafkaProducer() {
  if (!isProducerConnected) {
    await producer.connect();
    isProducerConnected = true;
    console.log("Connected to Kafka - User Service");
  }
}

//-------------------------------------------------------------------------------------------------------------

// Function to publish an event
async function publishUserCreatedEvent(user) {
  try {
    if (!isProducerConnected) {
      await connectKafka(); // Ensure producer is connected before sending
    }

    await producer.send({
      topic: "user-created",
      messages: [
        {
          key: user.id.toString(),
          value: JSON.stringify(user),
        },
      ],
    });

    console.log("User created event published.");
  } catch (error) {
    console.error("Error publishing user-created event:", error);
  }
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { connectKafkaProducer, publishUserCreatedEvent };
