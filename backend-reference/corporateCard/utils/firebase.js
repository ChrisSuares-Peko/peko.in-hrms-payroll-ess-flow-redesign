const { v4: uuidv4 } = require('uuid')
const fs = require('fs')
const serviceAccount = require('../configs/firebase-private.json')
const { initializeApp, cert } = require('firebase-admin/app')
const { getStorage } = require('firebase-admin/storage')

const admin = initializeApp({ credential: cert(serviceAccount) })
const bucketName = 'gs://peko-storage.appspot.com'
const storageRef = getStorage(admin).bucket(bucketName)
const { NODE_ENV } = process.env

async function uploadFile(base64Data, filePath, fileFormat) {
    const uniqueId = uuidv4()
    const dir = './public/images'
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    const localFilePath = `${dir}/${uniqueId}.${fileFormat}`
    await fs.promises.writeFile(localFilePath, base64Data, { encoding: 'base64' })

    const destination = `${NODE_ENV}/${filePath}/${uniqueId}.${fileFormat}`
    await storageRef.upload(localFilePath, {
        predefinedAcl: 'publicRead',
        destination,
        metadata: { metadata: { firebaseStorageDownloadTokens: uniqueId } },
    })
    fs.unlinkSync(localFilePath)

    return `https://firebasestorage.googleapis.com/v0/b/${bucketName.split('//')[1]}/o/${encodeURIComponent(destination)}?alt=media&token=${uniqueId}`
}

function extractStoragePathFromUrl(url) {
    const match = decodeURIComponent(url).match(/\/o\/(.+?)\?alt=media/)
    return match ? match[1] : null
}

async function deleteFile(fileUrl) {
    const storagePath = extractStoragePathFromUrl(fileUrl)
    const file = storageRef.file(storagePath)
    try {
        await file.delete()
        return { success: true, message: `File ${storagePath} deleted successfully.` }
    } catch (error) {
        return { success: false, message: `Failed to delete file: ${error.message}` }
    }
}

module.exports = { uploadFile, deleteFile }
