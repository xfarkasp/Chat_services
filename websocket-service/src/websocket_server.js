require("dotenv").config();
const WebSocket = require("ws");
const { redisClient } = require("./redis_client");

let wss;
const localConnections = new Map();
const HEARTBEAT_INTERVAL = 25000;

function heartbeat() {
  this.isAlive = true;
}

const startWebSocketServer = () => {
  const port = process.env.PORT || 5003;
  console.log(`Starting WebSocket Server on port ${port}`);
  wss = new WebSocket.Server({ port });

  wss.on("connection", (ws) => {
    //console.log("New WebSocket connection established");

    ws.isAlive = true;
    ws.on("pong", heartbeat);

    const pingInterval = setInterval(() => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    }, HEARTBEAT_INTERVAL);

    ws.on("message", async (message) => {
      const data = JSON.parse(message);

      if (data.type === "register" && data.user_id) {
        ws.user_id = String(data.user_id);
        localConnections.set(ws.user_id, ws);
        //console.log(`User ${ws.user_id} registered`);
        ws.send(JSON.stringify({ message: `User ${ws.user_id} registered.` }));

        const undeliveredKey = `undelivered:${ws.user_id}`;
        const pending = await redisClient.lRange(undeliveredKey, 0, -1);

        if (pending.length > 0) {
          //console.log(`Found ${pending.length} undelivered messages for user ${ws.user_id}. Sending now...`);
          for (const raw of pending) {
            const msg = JSON.parse(raw);
            ws.send(JSON.stringify(msg));
          }
          await redisClient.del(undeliveredKey);
        }
      }
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      if (ws.user_id) {
        localConnections.delete(ws.user_id);
        //console.log(`User ${ws.user_id} disconnected`);
      }
    });
  });

  console.log(`WebSocket Server running.`);
};

module.exports = {
  startWebSocketServer,
  localConnections,
};
