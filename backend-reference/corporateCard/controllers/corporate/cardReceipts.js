const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { uploadFile } = require('../../utils/firebase')
const {
    createReceipt,
    listActiveReceiptsByTransaction,
    findActiveReceiptById,
    softDeleteReceipt,
} = require('../../models/use-cases/cardReceipt')
const { loadOwnedTransaction } = require('./cardTransactions')
const { PERMISSION_DENIED } = require('../../constants/messages')
const { isAdmin, resolveActingIdentity, cardholderColumnsOf, cardholderProfile } = require('../../utils/cardHelpers')

const MIME_TO_FORMAT = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/jpg': 'jpg', 'application/pdf': 'pdf' }

const actorUserId = (req) => cardholderProfile(req).id ?? req.user?.corporateId

const serializeReceipt = (row) => ({
    id: row.id,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    mimeType: row.mimeType,
    uploadedByRole: row.uploadedByRole,
    createdAt: row.createdAt,
})

exports.uploadReceipt = asyncHandler(async (req, res, next) => {
    const { transaction, error, statusCode } = await loadOwnedTransaction(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const identity = await resolveActingIdentity(req, transaction, req.body?.role)
    if (identity.error) return next(new ErrorResponse(identity.error, identity.statusCode))

    const { base64, fileName, mimeType } = req.body || {}
    if (!base64 || typeof base64 !== 'string') {
        return next(new ErrorResponse('A base64-encoded file is required.', 400))
    }
    const format = MIME_TO_FORMAT[mimeType]
    if (!format) return next(new ErrorResponse('Unsupported file type. Allowed: PNG, JPEG, PDF.', 400))

    const base64Clean = base64.replace(/^data:[^;]+;base64,/, '')
    const filePath = `corporate-cards/${transaction.corporateId}/${transaction.id}/receipts`
    const fileUrl = await uploadFile(base64Clean, filePath, format)

    const receipt = await createReceipt({
        cardTransactionId: transaction.id,
        corporateId: transaction.corporateId,
        ...cardholderColumnsOf(transaction),
        uploadedByRole: identity.role,
        uploadedByUserId: identity.userId,
        fileUrl,
        fileName: fileName ? String(fileName).slice(0, 255) : null,
        mimeType,
    })

    return res.status(200).json({
        status: true,
        message: 'Receipt uploaded.',
        data: { receipt: serializeReceipt(receipt) },
        responseCode: '000',
    })
})

exports.listReceipts = asyncHandler(async (req, res, next) => {
    const { transaction, error, statusCode } = await loadOwnedTransaction(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const receipts = await listActiveReceiptsByTransaction(transaction.id)
    return res.status(200).json({
        status: true,
        message: 'Receipts fetched.',
        data: { receipts: receipts.map(serializeReceipt) },
        responseCode: '000',
    })
})

exports.deleteReceipt = asyncHandler(async (req, res, next) => {
    const { transaction, error, statusCode } = await loadOwnedTransaction(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const receipt = await findActiveReceiptById(req.params.receiptId, transaction.id)
    if (!receipt) return next(new ErrorResponse('Receipt not found.', 404))

    const isOwnUpload = receipt.uploadedByRole === (isAdmin(req) ? 'ADMIN' : 'CARDHOLDER')
        && String(receipt.uploadedByUserId) === String(actorUserId(req))
    if (!isAdmin(req) && !isOwnUpload) return next(new ErrorResponse(PERMISSION_DENIED, 403))

    await softDeleteReceipt(receipt)
    return res.status(200).json({ status: true, message: 'Receipt deleted.', data: {}, responseCode: '000' })
})
