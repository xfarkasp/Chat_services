require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const { Kafka } = require("kafkajs");
const { createClient } = require("redis");
const cors = require("cors");
const { startKafkaConsumer } = require("./kafka_consumer");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");

// Set up multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

const app = express();
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:8000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

const pool = require("./db");
const redisClient = createClient();

// Kafka Producer
const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"],
});

const producer = kafka.producer();
const MULTIMEDIA_SERVICE_URL = "http://multimedia-service:3001";

(async () => {
  await producer.connect();
  // Kafka Consumer
  await startKafkaConsumer();
  console.log("Connected to Kafka - Message Service");
})();

const FormData = require("form-data");
const stream = require("stream");

app.post("/api/chat/send-message", upload.single("file"), async (req, res) => {
  const { sender_id, receiver_id, content } = req.body;

  console.log("Received body:", req.body);
  console.log("Received file:", req.file);

  if (!sender_id || !receiver_id || (!content && !req.file)) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  let mediaUrl = null;

  try {
    if (req.file) {
      const formData = new FormData();
      const bufferStream = new stream.PassThrough();
      bufferStream.end(req.file.buffer);

      formData.append("file", bufferStream, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      const uploadResponse = await axios.post(`${MULTIMEDIA_SERVICE_URL}/api/media/upload`, formData, {
        headers: formData.getHeaders(),
      });

      const fileName = uploadResponse.data.fileName;
      console.log("Uploaded file:", fileName);

      const urlResponse = await axios.get(`${MULTIMEDIA_SERVICE_URL}/api/media/generate-url/${fileName}`);
      mediaUrl = urlResponse.data.fileUrl;
      console.log("Generated media URL:", mediaUrl);
    }

    await pool.query(
      "INSERT INTO messages (sender_id, receiver_id, content, media_url) VALUES ($1, $2, $3, $4)",
      [sender_id, receiver_id, content, mediaUrl]
    );

    await producer.send({
      topic: "chat-messages",
      messages: [
        {
          key: receiver_id,
          value: JSON.stringify({ sender_id, receiver_id, content, media_url: mediaUrl }),
        },
      ],
    });

    res.status(200).json({ message: "Message sent successfully", media_url: mediaUrl });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const authenticateToken = require("./authenticateToken");
app.get("/api/chat/messages/:user_id", authenticateToken, async (req, res) => {
  const user_id = parseInt(req.params.user_id, 10);

  if (isNaN(user_id)) {
    return res.status(400).json({ error: "Invalid user ID format." });
  }

  if (user_id !== req.user.id) {
    return res.status(403).json({ error: "Access denied. This is not your data." });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE sender_id = $1 OR receiver_id = $1 ORDER BY timestamp ASC",
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No messages found for this user." });
    }

    for (let msg of result.rows) {
      if (msg.media_file) {
        try {
          const response = await axios.get(`${MULTIMEDIA_SERVICE_URL}/api/media/download/${msg.media_file}`);
          msg.media_url = response.data.url;
        } catch (error) {
          console.error("Error fetching media URL:", error);
        }
      }
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.listen(5004, () => {
  console.log("Message Service running on port 5004");
});
