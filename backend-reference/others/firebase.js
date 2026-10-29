// /* eslint-disable no-undef */
// const {
//     v4: uuidv4
// } = require("uuid");
// const serviceAccount = require('./configs/firebase-private.json');
// const firebaseAdmin = require('firebase-admin');
// const admin = firebaseAdmin.initializeApp({
//     credential: firebaseAdmin.credential.cert(serviceAccount),
// });
// const bucketName = 'gs://peko-storage.appspot.com'
// const storageRef = admin.storage().bucket(bucketName);
// const fs = require('fs')

// async function uploadFile(base64Data, type, fileFormat = 'jpg') {
//     const buffer = Buffer.from(base64Data);
//      let logoSize = buffer.length / (1024 * 1024);
//     const maxSizeMB = 5;
//     if (logoSize > maxSizeMB) {
//         throw new Error(`Image size exceeds, maximum size is ${maxSizeMB}MB`);
//     }
//     let base64String = base64Data;
//     let base64Image = base64String
//     const dir = `./public/images`;
//     if (!fs.existsSync(dir)) {
//         fs.mkdirSync(dir, {
//             recursive: true,
//         });
//     }
//     //let fileFormat = base64Data.split(';')[0].split('/')[1]
//     let filePath = `${dir}/${type}.${fileFormat}`;
//     //console.log(fileFormat)
//     let fsPromise = fs.promises;
//     await fsPromise.writeFile(filePath, base64Image, {
//         encoding: 'base64'
//     });
//     let uniqueId = uuidv4()
//     const destination = `profile/images/${new Date().valueOf()}.${fileFormat}`
//     await storageRef.upload(filePath, {
//         predefinedAcl: 'publicRead',
//         destination: destination,
//         metadata: {
//             metadata: {
//                 firebaseStorageDownloadTokens: uniqueId
//             }
//         }
//     })
//     fs.unlinkSync(filePath);
//     let fileUrl = "https://firebasestorage.googleapis.com/v0/b/" + bucketName.split('//')[1] + "/o/" + encodeURIComponent(destination) + "?alt=media&token=" + uniqueId;
//     console.log(fileUrl)
//     return fileUrl;
// }

// module.exports = {
//     uploadFile,
// }
