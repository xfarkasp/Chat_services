const express = require("express");
const multer = require("multer");
const authenticateToken = require("./auth_token");
const { sendMessage, getMessageHistory } = require("./chat_controller");

const storage = multer.memoryStorage();
const upload = multer({ storage });

//-------------------------------------------------------------------------------------------------------------

function setupRoutes(app) {
    
    // Health route for the kluster
    app.get("/health", (req, res) => {
        res.status(200).send("OK");
    });

    const router = express.Router();

    // Send and store a new message
    router.post("/chat/send-message", upload.single("file"), sendMessage);

    // Get message history of a specific user
    router.get("/chat/messages/:user_id", authenticateToken, getMessageHistory);

    // Attach router to the main app
    app.use("/api", router);
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { setupRoutes };
