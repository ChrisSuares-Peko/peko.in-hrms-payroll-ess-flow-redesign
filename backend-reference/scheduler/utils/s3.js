const { v4: uuidv4 } = require("uuid");
const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { KMSClient, EncryptCommand, DecryptCommand } = require('@aws-sdk/client-kms');
const crypto = require("crypto");
const { customLog } = require('./loggerHelper');

const {
    BUCKET_NAME,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_REGION,
    KMS_KEY_ID,
    CLOUD_DOMAIN
} = process.env;

const getContentType = {
    png: "image/png",
    jpeg: "image/jpeg",
    jpg: "image/jpg",
    pdf: "application/pdf",
    csv: "application/csv",
};

// Configure AWS SDK clients
const s3 = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

const kms = new KMSClient({
    region: AWS_REGION,
    credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
    },
});

function gbToBytes(gb) {
    return gb * 1073741824; // 1073741824 == 1 GB
}

// Generate a random 256-bit AES key locally
async function generateDataKey() {
    return crypto.randomBytes(32); // AES-256 key
}

// Encrypt data with the generated AES key
async function encryptData(data, format) {
    const dataKey = await generateDataKey();

    // Encrypt the data key with KMS
    const params = {
        KeyId: KMS_KEY_ID,
        Plaintext: dataKey,
        EncryptionAlgorithm: "RSAES_OAEP_SHA_256",
    };
    const encryptedDataKey = await kms.send(new EncryptCommand(params));

    const iv = crypto.randomBytes(12); // AES-GCM initialization vector
    const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
    let encryptedData = cipher.update(data, "utf8", "base64");
    encryptedData += cipher.final("base64");
    const encrypted = {
        encryptedData,
        encryptedKey: Buffer.from(encryptedDataKey.CiphertextBlob).toString("base64"),
        iv: iv.toString("base64"),
        tag: cipher.getAuthTag().toString("base64"),
        format,
    };
    return encrypted;
}

// Decrypt data using the decrypted AES key
async function decryptData(encrypted) {
    const encryptedKeyBuffer = Buffer.from(encrypted.encryptedKey, "base64");
    const iv = Buffer.from(encrypted.iv, "base64");
    const tag = Buffer.from(encrypted.tag, "base64");
    const format = encrypted.format;

    // Decrypt the encrypted key using KMS with the RSA private key
    const params = {
        KeyId: KMS_KEY_ID,
        CiphertextBlob: encryptedKeyBuffer,
        EncryptionAlgorithm: "RSAES_OAEP_SHA_256",
    };
    const decryptedKey = await kms.send(new DecryptCommand(params));

    const decipher = crypto.createDecipheriv("aes-256-gcm", decryptedKey.Plaintext, iv);
    decipher.setAuthTag(tag);
    let decryptedData = decipher.update(encrypted.encryptedData, "base64", "utf8");
    decryptedData += decipher.final("utf8");
    return { decryptedData, format };
}

// Upload the encrypted file to S3
async function uploadFileEncryptedToS3(base64, filePath, format, maxSize) {
    try {
        const key = `${filePath}/${uuidv4()}`;
    
        // Encrypt the data before uploading
        const encrypted = await encryptData(base64, format);
    
        // Check file size if max size is present
        if (maxSize) {
            const buffer = Buffer.from(encrypted.encryptedData, "base64");
            const sizeInBytes = buffer.length;
            // Check current folder size before uploading
            const currentSize = await getCurrentFolderSize(filePath);
            if (currentSize + sizeInBytes > gbToBytes(maxSize)) {
                throw new Error("Your storage limit exceeded. Please upgrade your plan");
            }
        }
    
        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(encrypted),
            // ACL: 'public-read',
        };
    
        await s3.send(new PutObjectCommand(params));
        
        return key;
    } catch (error) {
        console.error(error);
        throw new Error("Something went wrong");
    }
}

// Upload the file to S3
async function uploadFileToS3(base64, filePath, format, maxSize) {
    try {
        const key = `${filePath}/${uuidv4()}.${format}`;

        const buffer = Buffer.from(base64, "base64");

        // Check file size if max size is present
        if (maxSize) {
            const sizeInBytes = buffer.length;
            // Check current folder size before uploading
            const currentSize = await getCurrentFolderSize(filePath);
            if (currentSize + sizeInBytes > gbToBytes(maxSize)) {
                throw new Error("Your storage limit exceeded. Please upgrade your plan");
            }
        }

        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Body: buffer,
            ContentEncoding: "base64",
            ContentType: getContentType[format.toLowerCase()],
            // ACL: "public-read",
        };

        await s3.send(new PutObjectCommand(params));
        
        return `${CLOUD_DOMAIN}/${key}`;
    } catch (error) {
        console.error(error);
        throw new Error("Something went wrong");
    }
}

// Get and decrypt the document from S3
async function getDocumentDecrypted(documentKey) {
    try {
        // Retrieve the encrypted object from S3
        const params = {
            Bucket: BUCKET_NAME,
            Key: documentKey,
        };
        const command = new GetObjectCommand(params);
        const data = await s3.send(command);

        // Read the stream into a buffer
        const streamToBuffer = async (stream) => {
            return new Promise((resolve, reject) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("end", () => resolve(Buffer.concat(chunks)));
                stream.on("error", reject);
            });
        };

        const bodyBuffer = await streamToBuffer(data.Body);
        const encryptedData = JSON.parse(bodyBuffer.toString());
        

        // Decrypt the data
        const { decryptedData, format } = await decryptData(encryptedData);
        const buffer = Buffer.from(decryptedData, "base64");
        return { buffer, type: format };
    } catch (error) {
        customLog(null, "error", { error, message: "Error fetching documents from S3" });
        throw new Error("Something went wrong while fetching documents");
    }
}

// Function to get current size of objects in the folder
async function getCurrentFolderSize(folderPath) {
    let totalSize = 0;

    const params = {
        Bucket: BUCKET_NAME,
        Prefix: folderPath,
    };

    try {
        const data = await s3.send(new ListObjectsV2Command(params));
        if (data.Contents) {
            for (const object of data.Contents) {
                totalSize += object.Size;
            }
        }
    } catch (err) {
        console.error("Error fetching objects from S3:", err);
        throw new Error('Something went wrong while fetching storage');
    }

    return totalSize; // in bytes
}

async function deleteEncryptedFromS3(key) {
    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
    };

    try {
        await s3.send(new DeleteObjectCommand(params));
        return true;
    } catch (err) {
        console.error(`Error deleting file ${key} from S3:`, err);
        throw err;
    }
}

async function deleteFromS3(location) {
    try {
        // Extract the key from the location URL
        const url = new URL(location);
        const key = decodeURIComponent(url.pathname.substring(1)); // Remove leading slash and decode

        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
        };

        await s3.send(new DeleteObjectCommand(params));
        return true;
    } catch (error) {
        console.error(error);
        throw new Error("Something went wrong while deleting");
    }
}

module.exports = {
    uploadFileToS3,
    uploadFileEncryptedToS3,
    getDocumentDecrypted,
    getCurrentFolderSize,
    deleteFromS3,
    deleteEncryptedFromS3,
};