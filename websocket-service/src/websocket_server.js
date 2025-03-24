require("dotenv").config();
const WebSocket = require("ws");
const { redisClient } = require("./redis_client");

let wss;

const localConnections = new Map();

const HEARTBEAT_INTERVAL = 25000;

function heartbeat() {
  this.isAlive = true;

  // Refresh TTL in Redis every time the client responds with a pong
  if (this.user_id) {
    console.log("refreshed TTL");
    redisClient.expire(`user:${this.user_id}`, 60); // Reset TTL
  }
}

const startWebSocketServer = () => {
  const port = process.env.PORT || 5003;
  console.log(`Starting WebSocket Server on port ${port}`);
  wss = new WebSocket.Server({ port });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection established");

    ws.isAlive = true;
    ws.on("pong", heartbeat);
    const pingInterval = setInterval(() => {
      if (ws.isAlive === false) {
        console.log(`Terminating inactive connection for user ${this.user_id}`);
        return ws.terminate();
      }
  
      ws.isAlive = false;
      ws.ping(); // Send a ping to the client
    }, HEARTBEAT_INTERVAL);

    ws.on("message", async (message) => {
      const data = JSON.parse(message);

      if (data.type === "register") {
        const user_id = String(data.user_id);

        // Store connection locally
        localConnections.set(user_id, ws);

        await redisClient.set(
          `user:${data.user_id}`,
          process.env.INSTANCE_ID || "default-instance",
          { EX: 60 }
        );

        ws.user_id = data.user_id;
        console.log(`User ${data.user_id} registered`);

        ws.send(JSON.stringify({ message: `User ${data.user_id} registered.` }));
      }
    });

    ws.on("close", async () => {
      if (ws.user_id) {
        await redisClient.del(`user:${ws.user_id}`);
        localConnections.delete(ws.user_id);
        console.log(`User ${ws.user_id} disconnected and removed from Redis.`);
      }
    });
  });

  console.log(`WebSocket Server running.`);
};

module.exports = {
  startWebSocketServer,
  localConnections,
};
