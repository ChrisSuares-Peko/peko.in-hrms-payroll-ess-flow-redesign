const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { sendCorporateSupportEmail } = require('../../services/supportEmails')
const { accountClosureRequestedTemplate } = require('../../utils/supportEmailTemplates')
const { SUPPORT_EMAIL } = require('../../constants/supportEmails')
const {
    CLOSURE_REASON_LABELS,
    CLOSURE_REASON_VALUES,
    CLOSURE_STATUS,
    DETAILS_MIN,
    DETAILS_MAX,
} = require('../../constants/accountClosure')
const {
    createRequest,
    findLatestByCorporate,
    findOpenByCorporate,
} = require('../../models/use-cases/accountClosureRequest')
const { actorCredentialId, adminActor } = require('../../utils/cardHelpers')

const serialize = (row) => {
    if (!row) return null
    return {
        id: String(row.id),
        status: row.status,
        reason: row.reason,
        reasonLabel: CLOSURE_REASON_LABELS[row.reason] || row.reason,
        details: row.details || null,
        requestedByName: row.requestedByName || null,
        requestedAt: row.createdAt || null,
        decidedAt: row.decidedAt || null,
        decisionNote: row.decisionNote || null,
    }
}

const reasonOptions = () =>
    CLOSURE_REASON_VALUES.map((value) => ({ value, label: CLOSURE_REASON_LABELS[value] }))

exports.getAccountClosureRequest = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const latest = await findLatestByCorporate(corporateId)

    return res.status(200).json({
        status: true,
        message: 'Account closure request fetched.',
        data: {
            request: serialize(latest),
            reasons: reasonOptions(),
            detailsMin: DETAILS_MIN,
            detailsMax: DETAILS_MAX,
        },
        responseCode: '000',
    })
})

exports.requestAccountClosure = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const reason = String(req.body?.reason || '').trim().toUpperCase()
    const details = typeof req.body?.details === 'string' ? req.body.details.trim() : ''

    if (await findOpenByCorporate(corporateId)) {
        return next(new ErrorResponse('An account closure request is already awaiting review.', 409))
    }

    const saved = await createRequest({
        corporateId,
        status: CLOSURE_STATUS.PENDING,
        reason,
        details: details || null,
        requestedByCredentialId: actorCredentialId(req),
        requestedByName: adminActor(req),
    })

    customLog(req?.LogTraceId, 'info', {
        message: '[AccountClosure] Closure request submitted',
        corporateId,
        requestId: String(saved.id),
        reason,
    }, 'CONSOLE')

    await sendCorporateSupportEmail({
        corporateId,
        template: accountClosureRequestedTemplate,
        templateKey: SUPPORT_EMAIL.ACCOUNT_CLOSURE_REQUESTED,
        req,
    })

    return res.status(200).json({
        status: true,
        message: 'Your account closure request has been submitted. Our support team will be in touch.',
        data: { request: serialize(saved) },
        responseCode: '000',
    })
})

exports.serializeClosureRequest = serialize
