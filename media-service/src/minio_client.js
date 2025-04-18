require("dotenv").config();
const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: process.env.MINIO_ENDPOINT || 'minio',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY,
    secretKey: process.env.MINIO_SECRET_KEY,
});

const bucketName = process.env.MINIO_BUCKET;

//-------------------------------------------------------------------------------------------------------------

const createBucket = async () => {
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
};

//-------------------------------------------------------------------------------------------------------------


module.exports = { minioClient, bucketName, createBucket }