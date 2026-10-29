const crypto = require('crypto')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { loadOwnedTransaction } = require('./cardTransactions')
const { resolveActingIdentity } = require('../../utils/cardHelpers')
const { appendComment, listComments } = require('../../models/use-cases/cardComment')

const MAX_MESSAGE_LENGTH = 2000
const MAX_COMMENTS_PER_TRANSACTION = 200

exports.addComment = asyncHandler(async (req, res, next) => {
    const { transaction, error, statusCode } = await loadOwnedTransaction(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const identity = await resolveActingIdentity(req, transaction, req.body?.role)
    if (identity.error) return next(new ErrorResponse(identity.error, identity.statusCode))

    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : ''
    if (!message) return next(new ErrorResponse('A comment message is required.', 400))
    if (message.length > MAX_MESSAGE_LENGTH) {
        return next(new ErrorResponse(`Comment message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`, 400))
    }

    const entry = {
        id: `c_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        authorRole: identity.role,
        authorUserId: String(identity.userId),
        authorName: identity.name,
        authorEmail: identity.email,
        message,
        createdAt: new Date().toISOString(),
    }

    const comments = await appendComment(transaction.id, entry, { maxComments: MAX_COMMENTS_PER_TRANSACTION })
    if (comments === null) {
        return next(new ErrorResponse(`This transaction has reached the ${MAX_COMMENTS_PER_TRANSACTION}-comment limit.`, 400))
    }

    return res.status(200).json({ status: true, message: 'Comment added.', data: { comment: entry }, responseCode: '000' })
})

exports.listComments = asyncHandler(async (req, res, next) => {
    const { transaction, error, statusCode } = await loadOwnedTransaction(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const comments = await listComments(transaction.id)
    return res.status(200).json({ status: true, message: 'Comments fetched.', data: { comments }, responseCode: '000' })
})
