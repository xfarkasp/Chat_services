const express = require("express");
const {
  createGroup,
  addMember,
  sendMessage,
  getMessages,
} = require("./group_controller");

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
  router.post("/groups/:group_id/members", addMember);

  // Send a message in a group
  router.post("/groups/:group_id/messages", sendMessage);

  // Retrieve messages for a group
  router.get("/groups/:group_id/messages", getMessages);

  // Attach router to the main app
  app.use("/api", router);
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { setupRoutes };
