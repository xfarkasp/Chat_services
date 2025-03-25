require("dotenv").config();
const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET;
(async () => {
    try {
        const exists = await minioClient.bucketExists(bucketName);
        if (!exists) {
            await minioClient.makeBucket(bucketName);
            console.log(`Bucket '${bucketName}' created`);
        } else {
            console.log(`Bucket '${bucketName}' already exists`);
        }
    } catch (err) {
        console.error("Error verifying bucket:", err);
    }
})();

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/api/media/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = `${Date.now()}_${req.file.originalname}`;
    try {
        await minioClient.putObject(bucketName, fileName, req.file.buffer, req.file.size, {
            'Content-Type': req.file.mimetype
        });

        res.json({ message: 'File uploaded successfully', fileName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'File upload failed' });
    }
});

app.get('/api/media/files', async (req, res) => {
    try {
        const files = [];
        const stream = minioClient.listObjects(bucketName, '', true);
        stream.on('data', obj => files.push(obj.name));
        stream.on('end', () => res.json({ files }));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not list files' });
    }
});

app.get("/api/media/generate-url/:fileName", async (req, res) => {
    const { fileName } = req.params;

    try {
        const presignedUrl = await minioClient.presignedUrl('GET', bucketName, fileName, 24 * 60 * 60); // 24-hour expiry
        const publicUrl = presignedUrl.replace(
            'http://minio.default.svc.cluster.local:9000',
            'https://minio.minikube'
          );
          
          res.status(200).json({ fileUrl: publicUrl });
    } catch (err) {
        console.error("Error generating file URL:", err);
        res.status(500).json({ error: "Could not generate file URL" });
    }
});

app.delete('/api/delete/:filename', async (req, res) => {
    const { filename } = req.params;
    try {
        await minioClient.removeObject(bucketName, filename);
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not delete file' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Multimedia Service running on port ${port}`);
});
