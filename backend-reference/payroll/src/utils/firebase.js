const { v4: uuidv4 } = require("uuid");
const serviceAccount = require('../configs/firebase-private.json');
const firebaseAdmin = require('firebase-admin');
const admin = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccount),
});
const bucketName = 'gs://peko-storage.appspot.com'
const storageRef = admin.storage().bucket(bucketName);
const fs = require('fs')

async function firebaseFileUpload(base64Data, type, fileFormat, folderName = 'CommonDocs') {
    try {
        const buffer = Buffer.from(base64Data);
        let fileSize = buffer.length / (1024 * 1024);
        if (fileSize > 2) {
            throw new Error('File size exceeds, maximum size is 2 MB');
        }
        let base64String = base64Data;
        let base64Image = base64String;

        const dir = `./public/docs`;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {
                recursive: true,
            });
        }

        let filePath = `${dir}/${type}.${fileFormat}`;

        let fsPromise = fs.promises;
        await fsPromise.writeFile(filePath, base64Image, {
            encoding: 'base64',
        });

        let uniqueId = uuidv4();
        const destination = `Payroll/${folderName}/${new Date().valueOf()}.${fileFormat}`;

        await storageRef.upload(filePath, {
            predefinedAcl: 'publicRead',
            destination: destination,
            metadata: {
                metadata: {
                    firebaseStorageDownloadTokens: uniqueId,
                },
            },
        });

        fs.unlinkSync(filePath);

        let fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName.split('//')[1]}/o/${encodeURIComponent(destination)}?alt=media&token=${uniqueId}`;

        console.log(fileUrl);
        return fileUrl;
    } catch (error) {
        console.log('ERROR IN FILE UPLOAD', error)
        return ''
    }
}

module.exports = {
    firebaseFileUpload
}
