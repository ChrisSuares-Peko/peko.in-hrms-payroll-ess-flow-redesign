const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { AUDIT_CATEGORY } = require('../../constants/cardLimits')
const {
    CLOSURE_REASON_LABELS,
    CLOSURE_STATUS,
    CLOSURE_STATUS_VALUES,
    DETAILS_MIN,
    DETAILS_MAX,
} = require('../../constants/accountClosure')
const {
    decideFromPendingCAS,
    findAndCount,
    findById,
    updateById,
} = require('../../models/use-cases/accountClosureRequest')
const { applyApprovedClosure } = require('../../services/accountClosure')
const { parsePaging, safeAudit } = require('../../utils/cardHelpers')
const { getCorporatesByIds } = require('../../utils/sharedDirectory')

const AUDIT_ACTION_APPROVED = 'ACCOUNT_CLOSURE_APPROVED'
const AUDIT_ACTION_REJECTED = 'ACCOUNT_CLOSURE_REJECTED'

const systemUserActorDisplay = (req) =>
    req.user?.name || req.user?.email || `System user #${req.user?.id}`

exports.listAccountClosureRequests = asyncHandler(async (req, res, next) => {
    const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim().toUpperCase() : ''
    if (rawStatus && !CLOSURE_STATUS_VALUES.includes(rawStatus)) {
        return next(new ErrorResponse('Invalid status filter.', 400))
    }
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findAndCount({ status: rawStatus || undefined, limit, offset })

    const corporateIds = [...new Set(rows.map((r) => r.corporateId).filter(Boolean))]
    const corporates = corporateIds.length ? await getCorporatesByIds(corporateIds, req) : new Map()

    const data = rows.map((r) => ({
        id: String(r.id),
        corporateId: r.corporateId,
        companyName: corporates.get(String(r.corporateId))?.companyName || null,
        email: corporates.get(String(r.corporateId))?.email || null,
        status: r.status,
        reason: r.reason,
        reasonLabel: CLOSURE_REASON_LABELS[r.reason] || r.reason,
        details: r.details || null,
        requestedByName: r.requestedByName || null,
        requestedAt: r.createdAt,
        decidedAt: r.decidedAt || null,
        decisionNote: r.decisionNote || null,
        appliedResult: r.appliedResult || null,
    }))

    return res.status(200).json({
        status: true,
        message: 'Account closure requests fetched.',
        data: { count, rows: data },
        responseCode: '000',
    })
})

const readDecisionNote = (req) => {
    const note = typeof req.body?.decisionNote === 'string' ? req.body.decisionNote.trim() : ''
    if (note.length > DETAILS_MAX) return { error: `The note must be ${DETAILS_MAX} characters or fewer.` }
    if (note && note.length < DETAILS_MIN) {
        return { error: `The note must be at least ${DETAILS_MIN} characters.` }
    }
    return { note: note || null }
}

const loadPending = async (id) => {
    const request = await findById(id)
    if (!request) return { error: new ErrorResponse('Account closure request not found.', 404) }
    if (request.status !== CLOSURE_STATUS.PENDING) {
        return { error: new ErrorResponse('This closure request has already been decided.', 409) }
    }
    return { request }
}

exports.approveAccountClosure = asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const { note, error: noteError } = readDecisionNote(req)
    if (noteError) return next(new ErrorResponse(noteError, 400))

    const { request, error } = await loadPending(id)
    if (error) return next(error)

    const decidedAt = new Date()
    const count = await decideFromPendingCAS(id, {
        status: CLOSURE_STATUS.APPROVED,
        decidedByCredentialId: req.user.id,
        decidedAt,
        decisionNote: note,
    })
    if (count === 0) return next(new ErrorResponse('This closure request has already been decided.', 409))

    let applied
    try {
        applied = await applyApprovedClosure({
            corporateId: request.corporateId,
            actorCredentialId: req.user.id,
            actorDisplay: systemUserActorDisplay(req),
            req,
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[AccountClosure] Approval recorded but the closure could not be applied in full',
            corporateId: request.corporateId,
            requestId: String(id),
            error: err?.message,
        }, 'CONSOLE')
        applied = { error: err?.message || 'Could not apply the closure' }
    }

    await updateById(id, { appliedAt: new Date(), appliedResult: applied })

    await safeAudit(req?.LogTraceId, {
        corporateId: request.corporateId,
        action: AUDIT_ACTION_APPROVED,
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId: req.user.id,
        actorDisplay: systemUserActorDisplay(req),
        title: 'Account closure approved',
        description: 'Account closure approved. Cards frozen and KYB reset; documents retained for a restart.',
        metadata: { requestId: String(id), applied },
    })

    return res.status(200).json({
        status: true,
        message: 'Account closure approved. The corporate has been reset to a fresh KYB.',
        data: { requestId: String(id), status: CLOSURE_STATUS.APPROVED, applied },
        responseCode: '000',
    })
})

exports.rejectAccountClosure = asyncHandler(async (req, res, next) => {
    const { id } = req.params
    const { note, error: noteError } = readDecisionNote(req)
    if (noteError) return next(new ErrorResponse(noteError, 400))

    const { request, error } = await loadPending(id)
    if (error) return next(error)

    const count = await decideFromPendingCAS(id, {
        status: CLOSURE_STATUS.REJECTED,
        decidedByCredentialId: req.user.id,
        decidedAt: new Date(),
        decisionNote: note,
    })
    if (count === 0) return next(new ErrorResponse('This closure request has already been decided.', 409))

    await safeAudit(req?.LogTraceId, {
        corporateId: request.corporateId,
        action: AUDIT_ACTION_REJECTED,
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId: req.user.id,
        actorDisplay: systemUserActorDisplay(req),
        title: 'Account closure rejected',
        description: 'Account closure request rejected. The corporate keeps full access.',
        metadata: { requestId: String(id) },
    })

    return res.status(200).json({
        status: true,
        message: 'Account closure request rejected.',
        data: { requestId: String(id), status: CLOSURE_STATUS.REJECTED },
        responseCode: '000',
    })
})
