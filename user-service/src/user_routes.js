const express = require("express");
const { registerUser, loginUser, findUser } = require("./user_controller");

//-------------------------------------------------------------------------------------------------------------

function setupRoutes(app) {
  // Health route for the kluster
  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  const router = express.Router();

  // Register a user
  router.post("/users/register", registerUser);

  // Login a user
  router.post("/users/login", loginUser);

  // Find a user
  router.get("/users/user/:identifier", findUser);

  // Attach router to the main app
  app.use("/api", router);
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { setupRoutes };
