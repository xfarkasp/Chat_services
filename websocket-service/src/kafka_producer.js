const kafka = require("./kafka_client");

const producer = kafka.producer();
let isProducerConnected = false;

async function connectProducer() {
  if (!isProducerConnected) {
    try {
      await producer.connect();
      isProducerConnected = true;
      console.log("Kafka producer connected (WebSocket)");
    } catch (err) {
      console.error("Kafka producer connection failed:", err);
    }
  }
}

async function publishUndeliveredNotification(receiver_id, messagePayload) {
  try {
    if (!isProducerConnected) {
      await connectProducer();
    }
    else{
       console.log("Kafka producer connected (WebSocket)");
    }

    const result = await producer.send({
      topic: "undelivered-notifications",
      messages: [
        {
          key: receiver_id,
          value: JSON.stringify(messagePayload),
        },
      ],
    });

    console.log("Published undelivered notification result:", JSON.stringify(result, null, 2));
    console.log(`Published undelivered notification result: ${result}`);
  } catch (error) {
    console.error("Failed to publish undelivered notification:", error);
    isProducerConnected = false;
  }
}

module.exports = {
  publishUndeliveredNotification,
};
