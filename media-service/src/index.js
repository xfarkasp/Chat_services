require("dotenv").config();
const express = require('express');
const { createBucket } = require("./minio_client");
const { setupRoutes } = require("./media_routes");

const app = express();
const port = process.env.PORT || 3001;


// Start Server
app.listen(port, () => {
    console.log(`Multimedia Service running on port ${port}`);
});

// Setup API routes
setupRoutes(app);

//-------------------------------------------------------------------------------------------------------------

(async () => {
  try {

    // Creates a minIO bucket, if one does not exist.
    await createBucket();

    // Start Express Server
    const port = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`Multi Media Service running on port ${PORT}`));

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down...");
      process.exit(0);
    });

  } catch (error) {
    console.error("Error starting Group Chat Service:", error);
  }
})();

//-------------------------------------------------------------------------------------------------------------
