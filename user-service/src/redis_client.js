require("dotenv").config();

const { createClient } = require("redis");

//-------------------------------------------------------------------------------------------------------------

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "redis",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  },
});

//-------------------------------------------------------------------------------------------------------------

redisClient.on("connect", () =>
  console.log("Connected to Redis - User Service")
);

//-------------------------------------------------------------------------------------------------------------

redisClient.on("error", (err) =>
  console.error("Redis error:", err)
);

//-------------------------------------------------------------------------------------------------------------

const connectRedis = async () => {
  await redisClient.connect();
};

//-------------------------------------------------------------------------------------------------------------

module.exports = { redisClient, connectRedis };
