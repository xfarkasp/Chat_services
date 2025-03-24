require("dotenv").config({ path: "../.env" });
const express = require('express');
const multer = require('multer');
const Minio = require('minio');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3001;

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT,
    port: parseInt(process.env.MINIO_PORT),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY
});

const bucketName = process.env.MINIO_BUCKET;
minioClient.bucketExists(bucketName, (err, exists) => {
    if (err) {
        console.error('Error checking bucket:', err);
    } else if (!exists) {
        minioClient.makeBucket(bucketName, (err) => {
            if (err) console.error('Error creating bucket:', err);
            else console.log(`Bucket ${bucketName} created successfully`);
        });
    }
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

app.post('/upload', upload.single('file'), async (req, res) => {
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

app.get('/files', async (req, res) => {
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

app.get("/generate-url/:fileName", async (req, res) => {
    const { fileName } = req.params;

    try {
        const presignedUrl = await minioClient.presignedUrl('GET', bucketName, fileName, 24 * 60 * 60); // 24-hour expiry
        console.log("Generated MinIO URL:", presignedUrl);
        res.status(200).json({ fileUrl: presignedUrl });
    } catch (err) {
        console.error("Error generating file URL:", err);
        res.status(500).json({ error: "Could not generate file URL" });
    }
});

app.delete('/delete/:filename', async (req, res) => {
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
    console.log(`Multimedia Service running on http://localhost:${port}`);
});
