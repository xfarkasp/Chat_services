const {
    sendMessage,
    getMessageHistory
  } = require("../controllers/chat_controller");
const authenticateToken = require("../config/auth_token");

app.post("/chat/send-message", sendMessage);

app.get("/api/chat/messages/:user_id", authenticateToken, getMessageHistory);