const PizZip = require('pizzip')
const { customLog } = require('../utils/loggerHelper')
const { getDocumentDecrypted } = require('../utils/s3')
const { findAllCorporateDocuments } = require('../models/use-cases/corporateDocuments')
const { VENDOR_PACK_DOCUMENT_NAMES, DOCUMENTS_BY_NAME } = require('../constants/kybDocuments')

const LOG_PREFIX = '[KybDocumentPack]'

const MAX_RAW_BYTES = 100 * 1024 * 1024

const ARCHIVE_NAME = 'KYB-Documents.zip'

const labelFor = (documentName) => DOCUMENTS_BY_NAME[documentName]?.label || documentName

const withExtension = (name, type) => {
    const ext = String(type || '').replace(/^\./, '').toLowerCase()
    if (!ext || /\.[a-z0-9]{2,5}$/i.test(name)) return name
    return `${name}.${ext}`
}

const extensionOf = (fileName) => {
    const match = /\.([a-z0-9]{2,5})$/i.exec(String(fileName || ''))
    return match ? match[1] : ''
}

// A label like "LLP Agreement / Deed" would become a folder inside the archive, and the rest are
// reserved on Windows, so the vendor could not extract the pack at all.
const safeFileName = (label) =>
    String(label)
        // eslint-disable-next-line no-control-regex
        .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/[. ]+$/, '')

const fetchOne = async (row, logTraceId) => {
    if (!row?.document) return null
    try {
        const decrypted = await getDocumentDecrypted(row.document)
        const content = decrypted?.buffer
        if (!Buffer.isBuffer(content) || !content.length) return null
        return {
            filename: withExtension(
                safeFileName(labelFor(row.documentName)),
                row.documentType || decrypted.type || extensionOf(row.fileName)
            ),
            content,
            documentName: row.documentName,
        }
    } catch (error) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:kybPack:documentUnreadable',
            message: `${LOG_PREFIX} could not read a KYB document`,
            documentName: row.documentName,
            error: error?.message,
        }, 'CONSOLE')
        return null
    }
}

const uniqueName = (taken, filename) => {
    if (!taken.has(filename)) {
        taken.add(filename)
        return filename
    }
    const dot = filename.lastIndexOf('.')
    const stem = dot > 0 ? filename.slice(0, dot) : filename
    const ext = dot > 0 ? filename.slice(dot) : ''
    let n = 2
    while (taken.has(`${stem} (${n})${ext}`)) n += 1
    const next = `${stem} (${n})${ext}`
    taken.add(next)
    return next
}

const buildKybDocumentPack = async ({
    corporateId,
    logTraceId,
    maxTotalBytes,
    documentNames = VENDOR_PACK_DOCUMENT_NAMES,
}) => {
    const limitBytes = Number.isFinite(maxTotalBytes) && maxTotalBytes > 0 ? maxTotalBytes : MAX_RAW_BYTES

    const rows = await findAllCorporateDocuments({
        corporateUserId: corporateId,
        documentNames,
    })

    const omitted = []
    const attached = []
    const fetched = []
    let rawBytes = 0

    const included = new Set(documentNames)

    for (const row of rows || []) {
        if (!included.has(row?.documentName)) continue
        // eslint-disable-next-line no-await-in-loop
        const doc = await fetchOne(row, logTraceId)
        if (!doc) {
            omitted.push(labelFor(row.documentName))
        } else if (rawBytes + doc.content.length > MAX_RAW_BYTES) {
            omitted.push(labelFor(row.documentName))
        } else {
            rawBytes += doc.content.length
            fetched.push(doc)
            attached.push(labelFor(row.documentName))
        }
    }

    if (omitted.length) {
        customLog(logTraceId, 'error', {
            action: 'corporateCard:kybPack:incomplete',
            message: `${LOG_PREFIX} KYB pack is incomplete`,
            corporateId,
            attachedCount: fetched.length,
            omitted,
            rawBytes,
        }, 'CONSOLE')
    }

    if (!fetched.length) {
        return { attachments: [], archive: null, attached, omitted, rawBytes: 0, totalBytes: 0, limitBytes, exceeded: false }
    }

    const zip = new PizZip()
    const taken = new Set()
    fetched.forEach((doc) => zip.file(uniqueName(taken, doc.filename), doc.content))
    const archive = zip.generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
    })

    const exceeded = archive.length > limitBytes

    customLog(logTraceId, exceeded ? 'error' : 'info', {
        action: exceeded ? 'corporateCard:kybPack:overLimit' : 'corporateCard:kybPack:compressed',
        message: `${LOG_PREFIX} KYB pack compressed`,
        corporateId,
        documentCount: fetched.length,
        rawBytes,
        archiveBytes: archive.length,
        limitBytes,
    }, 'CONSOLE')

    return {
        attachments: exceeded ? [] : [{ filename: ARCHIVE_NAME, content: archive }],
        archive,
        attached,
        omitted,
        rawBytes,
        totalBytes: archive.length,
        limitBytes,
        exceeded,
    }
}

module.exports = { buildKybDocumentPack, MAX_RAW_BYTES, ARCHIVE_NAME }
