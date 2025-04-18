const express = require("express");
const { registerUser, loginUser } = require("./user_controller");

//-------------------------------------------------------------------------------------------------------------

function setupRoutes(app) {
    // Health route for the kluster
    app.get("/health", (req, res) => {
        res.status(200).send("OK");
      });

    const router = express.Router();

    // Log in user
    router.post("/api/users/register", registerUser);

    // Get message history of a specific user
    router.get("/api/users/login", loginUser);

    // Attach router to the main app
    app.use("/api", router);
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { setupRoutes };