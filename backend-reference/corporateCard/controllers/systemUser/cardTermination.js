const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { CARD_REQUEST_TYPE, CARD_REQUEST_STATUS } = require('../../constants/cardRequest')
const { AUDIT_ACTION, AUDIT_CATEGORY } = require('../../constants/cardLimits')
const {
    findAndCountForQueue,
    findByIdUnscoped,
    decideFromPendingCAS,
} = require('../../models/use-cases/cardRequest')
const { parsePaging, safeAudit, last4, attachCardholders } = require('../../utils/cardHelpers')
const { getCorporatesByIds } = require('../../utils/sharedDirectory')
const emailer = require('../../utils/emailer')
const { terminationCompletedTemplate } = require('../../utils/cardTerminationEmailTemplate')
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver')
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys')

const STATUS_OPTIONS = [CARD_REQUEST_STATUS.PENDING, CARD_REQUEST_STATUS.APPROVED]

const systemUserActorDisplay = (req) => req.user?.name || req.user?.email || `System user #${req.user?.id}`

exports.listTerminationRequests = asyncHandler(async (req, res, next) => {
    const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : ''
    if (rawStatus && !STATUS_OPTIONS.includes(rawStatus)) return next(new ErrorResponse('Invalid status filter.', 400))
    const status = rawStatus || CARD_REQUEST_STATUS.PENDING
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findAndCountForQueue({ requestType: CARD_REQUEST_TYPE.TERMINATE, status, limit, offset })
    await attachCardholders(rows, req)

    const corporateIds = [...new Set(rows.map((r) => r.corporateId).filter(Boolean))]
    const corporates = corporateIds.length ? await getCorporatesByIds(corporateIds, req) : new Map()

    const data = rows.map((r) => ({
        id: r.id,
        corporateId: r.corporateId,
        companyName: corporates.get(String(r.corporateId))?.companyName || null,
        cardholder: r.cardholder?.name || null,
        holderId: r.userId,
        cardIssuanceId: r.cardIssuanceId,
        cardLast4: last4(r.card?.maskedCardNumber),
        reason: r.reason,
        requestedAt: r.createdAt,
        status: r.status,
    }))

    return res.status(200).json({
        status: true,
        message: 'Termination requests fetched.',
        data: { count, rows: data },
        responseCode: '000',
    })
})

exports.completeTermination = asyncHandler(async (req, res, next) => {
    const { id } = req.params

    const request = await findByIdUnscoped(id)
    if (!request || request.requestType !== CARD_REQUEST_TYPE.TERMINATE) {
        return next(new ErrorResponse('Termination request not found.', 404))
    }
    if (request.status !== CARD_REQUEST_STATUS.PENDING) {
        return next(new ErrorResponse('This termination request has already been completed.', 409))
    }

    const count = await decideFromPendingCAS(id, {
        status: CARD_REQUEST_STATUS.APPROVED,
        decidedByCredentialId: req.user.id,
        decidedAt: new Date(),
        result: { ...(request.result || {}), terminated: true },
    })
    if (count === 0) return next(new ErrorResponse('This termination request has already been completed.', 409))

    await safeAudit(req?.LogTraceId, {
        corporateId: request.corporateId,
        userId: request.userId,
        cardIssuanceId: request.cardIssuanceId,
        action: AUDIT_ACTION.CARD_TERMINATION_COMPLETED,
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId: req.user.id,
        actorDisplay: systemUserActorDisplay(req),
        title: 'Card termination completed',
        description: `Termination completed for card ending ${last4(request.card?.maskedCardNumber) || '****'}.`,
        metadata: { requestId: Number(id) },
    })

    try {
        const corporates = await getCorporatesByIds([request.corporateId], req)
        const corporate = corporates.get(String(request.corporateId))
        const to = corporate?.email
        if (to) {
            const name = corporate.companyName || 'there'
            const cardLast4 = last4(request.card?.maskedCardNumber)
            const resolved = await resolveEmailTemplate({
                key: EMAIL_TEMPLATE_KEYS.CARD_TERMINATION_COMPLETED,
                service: EMAIL_TEMPLATE_SERVICES.CORPORATECARD_CARD_LIFECYCLE,
                variables: {
                    name,
                    cardLast4Clause: cardLast4 ? `ending in ${cardLast4}` : 'on your account',
                },
                fallback: () => terminationCompletedTemplate(name, cardLast4),
                fallbackSubject: 'Your Peko corporate card has been closed',
                logTraceId: req?.LogTraceId,
            })
            emailer.email(req?.LogTraceId, to, resolved.subject, resolved.html)
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[CardTermination] Corporate email not found — skipping termination-completed email', requestId: Number(id) }, 'CONSOLE')
        }
    } catch (mailErr) {
        customLog(req?.LogTraceId, 'error', { message: '[CardTermination] Termination-completed email failed', requestId: Number(id), error: mailErr?.message }, 'CONSOLE')
    }

    return res.status(200).json({
        status: true,
        message: 'Termination marked as completed.',
        data: { requestId: Number(id), status: CARD_REQUEST_STATUS.APPROVED },
        responseCode: '000',
    })
})
