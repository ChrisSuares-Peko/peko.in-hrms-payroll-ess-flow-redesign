const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const firebaseAdmin = require("firebase-admin");
const serviceAccount = require("../configs/firebase-private.json");

/* -------------------------------------------------------------------------- */
/*                           Firebase Initialization                           */
/* -------------------------------------------------------------------------- */

firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount),
  storageBucket: "peko-storage.appspot.com",
});

const bucket = firebaseAdmin.storage().bucket();

/* -------------------------------------------------------------------------- */
/*                                Utilities                                   */
/* -------------------------------------------------------------------------- */

function gbToBytes(gb) {
  return gb * 1073741824;
}

function generateDataKey() {
  return crypto.randomBytes(32); // AES-256
}

/* -------------------------------------------------------------------------- */
/*                             Encryption Logic                                */
/* -------------------------------------------------------------------------- */

async function encryptData(base64Data, format) {
  const dataKey = generateDataKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", dataKey, iv);
  let encryptedData = cipher.update(base64Data, "utf8", "base64");
  encryptedData += cipher.final("base64");

  return {
    encryptedData,
    encryptedKey: dataKey.toString("base64"), // Firebase replacement for KMS
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    format,
  };
}

async function decryptData(encrypted) {
  const key = Buffer.from(encrypted.encryptedKey, "base64");
  const iv = Buffer.from(encrypted.iv, "base64");
  const tag = Buffer.from(encrypted.tag, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted.encryptedData, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return { decryptedData: decrypted, format: encrypted.format };
}

/* -------------------------------------------------------------------------- */
/*                         Encrypted Upload (AWS S3)                           */
/* -------------------------------------------------------------------------- */

async function uploadFileEncryptedToS3(base64, filePath, format, maxSize) {
  try {
    const key = `${filePath}/${uuidv4()}`;
    const encrypted = await encryptData(base64, format);

    const buffer = Buffer.from(JSON.stringify(encrypted));
    const sizeInBytes = buffer.length;

    if (maxSize) {
      const currentSize = await getCurrentFolderSize(filePath);
      if (currentSize + sizeInBytes > gbToBytes(maxSize)) {
        throw new Error("Your storage limit exceeded. Please upgrade your plan");
      }
    }

    const file = bucket.file(key);
    await file.save(buffer, {
      contentType: "application/json",
    });

    return key; // SAME as AWS
  } catch (error) {
    console.error(error);
    throw new Error("Something went wrong");
  }
}

/* -------------------------------------------------------------------------- */
/*                          Normal Upload (AWS S3)                             */
/* -------------------------------------------------------------------------- */

async function uploadFileToS3(base64, filePath, format, maxSize) {
  try {
    const key = `${filePath}/${uuidv4()}.${format}`;
    const buffer = Buffer.from(base64, "base64");

    if (maxSize) {
      const currentSize = await getCurrentFolderSize(filePath);
      if (currentSize + buffer.length > gbToBytes(maxSize)) {
        throw new Error("Your storage limit exceeded. Please upgrade your plan");
      }
    }

    const file = bucket.file(key);
    await file.save(buffer, {
      contentType: `image/${format}`,
      public: true,
    });

    return `https://storage.googleapis.com/${bucket.name}/${key}`;
  } catch (error) {
    console.error(error);
    throw new Error("Something went wrong");
  }
}

/* -------------------------------------------------------------------------- */
/*                         Get & Decrypt Document                              */
/* -------------------------------------------------------------------------- */

async function getDocumentDecrypted(documentKey) {
  try {
    const file = bucket.file(documentKey);
    const [data] = await file.download();

    const encrypted = JSON.parse(data.toString());
    const { decryptedData, format } = await decryptData(encrypted);

    return {
      buffer: Buffer.from(decryptedData, "base64"),
      type: format,
    };
  } catch (error) {
    console.error(error);
    throw new Error("Something went wrong while fetching documents");
  }
}

/* -------------------------------------------------------------------------- */
/*                         Folder Size Calculation                             */
/* -------------------------------------------------------------------------- */

async function getCurrentFolderSize(folderPath) {
  let totalSize = 0;

  const [files] = await bucket.getFiles({
    prefix: folderPath,
  });

  files.forEach((file) => {
    totalSize += Number(file.metadata.size || 0);
  });

  return totalSize;
}

/* -------------------------------------------------------------------------- */
/*                              Delete Files                                  */
/* -------------------------------------------------------------------------- */

async function deleteEncryptedFromS3(key) {
  try {
    await bucket.file(key).delete();
    return true;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// owner ({ username, corporateId }) restricts deletion to objects uploaded under that
// tenant's path (<env>/<role>/<username>/... or <env>/<corporateId>/...). Objects outside
// it are left in place (logged), so a stored URL can't be used to delete other files.
async function deleteFromS3(location, owner) {
  try {
    const url = new URL(location);
    const key = decodeURIComponent(url.pathname.substring(1));
    if (owner) {
      const segments = key.split('/');
      const ownsKey = (owner.username && segments[2] === String(owner.username))
        || (owner.corporateId && segments[1] === String(owner.corporateId));
      if (!ownsKey) {
        console.warn('deleteFromS3: skipped object outside caller scope', { key });
        return false;
      }
    }
    await bucket.file(key).delete();
    return true;
  } catch (error) {
    console.error(error);
    throw new Error("Something went wrong while deleting");
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

module.exports = {
  uploadFileToS3,
  uploadFileEncryptedToS3,
  getDocumentDecrypted,
  getCurrentFolderSize,
  deleteFromS3,
  deleteEncryptedFromS3,
};
