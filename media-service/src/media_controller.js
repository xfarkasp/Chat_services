const { minioClient, bucketName } = require("./minio_client");

//-------------------------------------------------------------------------------------------------------------

async function uploadMediaFile(req, res) {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const fileName = `${Date.now()}_${req.file.originalname}`;
    
        await minioClient.putObject(bucketName, fileName, req.file.buffer, req.file.size, {
            'Content-Type': req.file.mimetype
        });

        res.json({ message: 'File uploaded successfully', fileName });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'File upload failed' });
    }
}

//-------------------------------------------------------------------------------------------------------------

function getMediaFiles(req, res) {
    try {
        const files = [];
        const stream = minioClient.listObjects(bucketName, '', true);
        stream.on('data', obj => files.push(obj.name));
        stream.on('end', () => res.json({ files }));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not list files' });
    }
}

//-------------------------------------------------------------------------------------------------------------

async function generateMediaFileUrl(req, res) {
    try {
        const { fileName } = req.params;
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
}

//-------------------------------------------------------------------------------------------------------------

async function deleteMediaFile(req, res) {
    try {
        const { filename } = req.params;
        await minioClient.removeObject(bucketName, filename);
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not delete file' });
    }
}


//-------------------------------------------------------------------------------------------------------------

module.exports = { 
    uploadMediaFile,
    getMediaFiles,
    generateMediaFileUrl,
    deleteMediaFile
};