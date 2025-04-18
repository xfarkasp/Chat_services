const express = require("express");
const multer = require("multer");
const {
    uploadMediaFile,
    getMediaFiles,
    generateMediaFileUrl,
    deleteMediaFile,
  } = require("./media_controller");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

//-------------------------------------------------------------------------------------------------------------

function setupRoutes(app) {

    // Health route for the kluster
    app.get("/health", (req, res) => {
        res.status(200).send("OK");
    });

    const router = express.Router();

    // Upload a new media file to the minio bucket.
    router.post('/media/upload', upload.single('file'), uploadMediaFile);

    // List all the files in the bucket. (for debug purposes)
    router.get('/media/files', getMediaFiles);

    // Generates a secure URL to the file in the bucket.
    router.get("/media/generate-url/:fileName", generateMediaFileUrl);

    // Deletes a media file from the bucket.
    router.get("/delete/:filename", deleteMediaFile);

    // Attach router to the main app
    app.use("/api", router);
}

//-------------------------------------------------------------------------------------------------------------

module.exports = { setupRoutes };
