const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
});

redisClient.connect();

redisClient.on("error", err => console.error("Redis error:", err));

module.exports = { redisClient };
