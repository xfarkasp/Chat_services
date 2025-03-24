require("dotenv").config();
const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redisClient.on("connect", () => console.log("Connected to Redis - WebSocket Service"));
redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("end", () => {
  console.warn("Redis connection closed. Attempting to reconnect...");
  setTimeout(() => redisClient.connect(), 5000);
});

const connectRedis = async () => {
  await redisClient.connect();
  console.log("Redis client connected");
};

const disconnectRedis = async (localConnections) => {
  console.log("Shutting down gracefully...");
  for (let [userId] of localConnections) {
    await redisClient.del(`user:${userId}`);
    console.log(`User ${userId} removed from Redis.`);
  }
  process.exit();
};

module.exports = {
  redisClient,
  connectRedis,
  disconnectRedis,
};
