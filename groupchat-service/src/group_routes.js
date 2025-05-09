const express = require("express");
const multer = require("multer");
const authenticateToken = require("./auth_token");
const {
  createGroup,
  addMember,
  sendMessage,
  getMessages,
  getGroups,
  findGroup,
} = require("./group_controller");

const storage = multer.memoryStorage();
const upload = multer({ storage });

//-------------------------------------------------------------------------------------------------------------

function setupRoutes(app) {
  // Health route for the kluster
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  const router = express.Router();

  // Create a new group
  router.post("/groups/create_group", createGroup);

  // Add a user to a group
  router.post("/groups/add_member", addMember);

  // Send a message in a group
  router.post("/groups/:group_id/messages", upload.single("file"), sendMessage);

  // Retrieve messages for a group
  router.get("/groups/:group_id/messages", authenticateToken, getMessages);

  // Get associated groups specific user
  router.get("/groups/members", authenticateToken, getGroups);

  // Find a user
  router.get("/groups/group/:identifier", findGroup);

  // Attach router to the main app
  app.use("/api", router);
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { setupRoutes };
