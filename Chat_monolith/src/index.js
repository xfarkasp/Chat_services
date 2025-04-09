require("dotenv").config();
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const express = require("express");
const path = require("path");
const { connectRedis, disconnectRedis } = require("./config/redis_client");
const { startWebSocketServer, localConnections } = require("./web_socket/websocket");

const userRoutes = require("./routes/user_routes");
const chatRoutes = require("./routes/chat_routes");
const healthRoutes = require("./routes/health_route");

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:8000",
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, "../frontend")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

(async () => {
    try {
        // Connect Redis
        await connectRedis();

        // Use routes
        app.use("/api", userRoutes);
        app.use("/api", chatRoutes); 
        app.use("/", healthRoutes);        
    
        // Start WebSocket Server
        startWebSocketServer();

        // Start Express Server
        const PORT = process.env.PORT || 5005;
        app.listen(PORT, () => console.log(`Group Chat Service running on port ${PORT}`));
    
        // Graceful shutdown
        process.on("SIGINT", async () => {
            await disconnectRedis(localConnections);
        });
  
    } catch (error) {
      console.error("Error starting services:", error);
    }
  })();