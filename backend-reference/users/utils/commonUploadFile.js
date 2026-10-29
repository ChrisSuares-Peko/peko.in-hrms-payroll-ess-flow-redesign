const { v4: uuidv4 } = require("uuid");
const serviceAccount = require("../configs/firebase-private.json");
const firebaseAdmin = require("firebase-admin");
const admin = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
}, "storage");
const bucketName = "gs://peko-storage.appspot.com";
const storageRef = admin.storage().bucket(bucketName);
const fs = require("fs");
const os = require("os");
const path = require("path");
const { NODE_ENV } = process.env;

async function uploadFile(base64Data, filePath, fileFormat, maxSize) { 
  const buffer = Buffer.from(base64Data);
  const fileSize = buffer.length / (1024 * 1024);

  if (fileSize > maxSize) {
    throw new Error(`Image size exceeds, maximum size is ${maxSize}MB`);
  }
  
  let uniqueId = uuidv4();
  let base64String = base64Data;
  let base64Image = base64String;
  // Staged outside public/ — express.static serves that folder, so a temp file there was briefly downloadable.
  const dir = path.join(os.tmpdir(), "peko-uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, {
      recursive: true,
    });
  }
  let localFilePath = path.join(dir, `${uniqueId}.${fileFormat}`);
  let fsPromise = fs.promises;
  await fsPromise.writeFile(localFilePath, base64Image, {
    encoding: "base64",
  });
  const destination = `${NODE_ENV}/${filePath}/${uniqueId}.${fileFormat}`;
  await storageRef.upload(localFilePath, {
    predefinedAcl: "publicRead",
    destination: destination,
    metadata: {
      metadata: {
        firebaseStorageDownloadTokens: uniqueId,
      },
    },
  });
  fs.unlinkSync(localFilePath);
  let fileUrl =
    "https://firebasestorage.googleapis.com/v0/b/" +
    bucketName.split("//")[1] +
    "/o/" +
    encodeURIComponent(destination) +
    "?alt=media&token=" +
    uniqueId;
  return fileUrl;
}

async function deleteFile(fileUrl) {
  const storagePath = extractStoragePathFromUrl(fileUrl)
  const file = storageRef.file(storagePath);
  try {
    await file.delete();
    return { success: true, message: `File ${storagePath} deleted successfully.` };
  } catch (error) {
    return { success: false, message: `Failed to delete file: ${error.message}` };
  }
}

function extractStoragePathFromUrl(url) {
  const regex = /\/o\/(.+?)\?alt=media/;
  const match = decodeURIComponent(url).match(regex);
  return match ? match[1] : null;
}

module.exports = {
  uploadFile,
  deleteFile,
  admin
}
