const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { KYB_STATUS } = require('../../constants/corporateCardApplication')
const { CARD_REQUEST_TYPE, CARD_REQUEST_STATUS } = require('../../constants/cardRequest')
const { findByCorporate } = require('../../models/use-cases/corporateCardAdminApplication')
const {
    createRequest,
    findActiveByTarget,
    findByRequester,
    resolveByCardholder,
} = require('../../models/use-cases/cardRequest')
const { MEMBERSHIP_NOTIFICATION } = require('../../constants/membershipNotifications')
const { createNotification } = require('../../models/use-cases/notification')
const { holdsCardMembership } = require('../../utils/cardholderIdentity')
const { getSelfCorporate, findCardholderById } = require('../../utils/sharedDirectory')
const { customLog } = require('../../utils/loggerHelper')

const REQUEST_ID_PREFIX = 'CCA'
const REVOKED_MEMBERSHIP_STATUS = 'INACTIVE'
const REMOVED_DECISION_NOTE = 'Member removed from the corporate'

const isKybComplete = (application) => application?.kybStatus === KYB_STATUS.COMPLETED

/**
 * The identity behind a membership request.
 *
 * Deliberately not `cardholderIdentity(req)`: that resolves only for someone who already holds the service,
 * and the whole point of this route group is the person who does not. The employee row id is what the
 * approval grants against, so it is what the request is keyed on.
 */
const requesterId = (req) => req.user?.employeeProfileId ?? null

const displayId = (row) => `${REQUEST_ID_PREFIX}-${String(row.id).padStart(8, '0')}`

const serializeRequest = (row) => (row
    ? {
        id: String(row.id),
        requestId: displayId(row),
        status: row.status,
        requestedAt: row.createdAt,
        decidedAt: row.decidedAt ?? null,
        decisionNote: row.decisionNote ?? null,
    }
    : null)

/**
 * The guard for every route in this group: an authenticated employee of this corporate who is not already
 * a member. A member has no business here — they belong in the KYC flow — and letting them through would
 * let a cardholder open a request that approval would then re-grant.
 */
const resolveRequester = (req) => {
    if (req.user?.role !== 'USER') return { error: 'Only an employee can request card access.', statusCode: 403 }
    const corporateId = req.user?.corporateId
    if (!corporateId) return { error: 'Corporate context is missing.', statusCode: 400 }
    const userId = requesterId(req)
    if (!userId) return { error: 'Employee context is missing.', statusCode: 400 }
    if (holdsCardMembership(req)) return { error: 'You already have Corporate Cards access.', statusCode: 409 }
    return { corporateId, userId }
}

exports.getKybState = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const application = await findByCorporate(corporateId)
    return res.status(200).json({
        status: true,
        message: 'Corporate card availability fetched.',
        data: { kybComplete: isKybComplete(application) },
        responseCode: '000',
    })
})

const membershipRevoked = async (req, userId) => {
    try {
        const row = await findCardholderById(userId, req, { bypassCache: true })
        return row?.status === REVOKED_MEMBERSHIP_STATUS
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Could not verify whether the requester is still a card member',
            action: 'corporateCard:membership:revocationCheckFailed',
            userId,
            error: err?.message,
        }, 'CONSOLE')
        return false
    }
}

exports.getMyMembershipRequest = asyncHandler(async (req, res, next) => {
    const resolved = resolveRequester(req)
    if (resolved.error) return next(new ErrorResponse(resolved.error, resolved.statusCode))

    const { rows } = await findByRequester({
        cardholder: { userId: resolved.userId },
        requestType: CARD_REQUEST_TYPE.MEMBERSHIP,
        limit: 1,
        offset: 0,
    })

    let request = rows?.[0] || null
    if (request?.status === CARD_REQUEST_STATUS.APPROVED
        && await membershipRevoked(req, resolved.userId)) {
        const closed = await resolveByCardholder({
            corporateId: resolved.corporateId,
            cardholder: { userId: resolved.userId },
            requestType: CARD_REQUEST_TYPE.MEMBERSHIP,
            statuses: [CARD_REQUEST_STATUS.APPROVED],
            fields: {
                status: CARD_REQUEST_STATUS.CANCELLED,
                decidedAt: new Date(),
                decisionNote: REMOVED_DECISION_NOTE,
            },
        })
        customLog(req?.LogTraceId, 'info', {
            message: 'Cleared an approved membership request whose member had been removed',
            action: 'corporateCard:membership:staleApprovalCleared',
            corporateId: resolved.corporateId,
            userId: resolved.userId,
            requestId: request.id,
            closed,
        }, 'CONSOLE')
        request = null
    }

    return res.status(200).json({
        status: true,
        message: 'Membership request fetched.',
        data: { request: serializeRequest(request) },
        responseCode: '000',
    })
})

exports.createMembershipRequest = asyncHandler(async (req, res, next) => {
    const resolved = resolveRequester(req)
    if (resolved.error) return next(new ErrorResponse(resolved.error, resolved.statusCode))

    const application = await findByCorporate(resolved.corporateId)
    if (!isKybComplete(application)) {
        return next(new ErrorResponse('Corporate Cards is not available for your company yet.', 403))
    }

    const active = await findActiveByTarget({
        requestType: CARD_REQUEST_TYPE.MEMBERSHIP,
        cardholder: { userId: resolved.userId },
    })
    if (active) return next(new ErrorResponse('You already have a pending access request.', 409))

    let created
    try {
        created = await createRequest({
            corporateId: resolved.corporateId,
            userId: resolved.userId,
            requestType: CARD_REQUEST_TYPE.MEMBERSHIP,
            status: CARD_REQUEST_STATUS.PENDING,
            requestedByCredentialId: req.user?.id ?? null,
            // The decision notifies this employee, and by then the deciding session is the admin's — so
            // whom to tell is captured here, the same way the unfreeze request carries it.
            payload: {
                cardholderUsername: req.user?.username ?? null,
                cardholderName: req.user?.employeeName || null,
            },
        })
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
            return next(new ErrorResponse('You already have a pending access request.', 409))
        }
        throw err
    }

    customLog(req?.LogTraceId, 'info', {
        message: 'Corporate card membership requested',
        action: 'corporateCard:membership:requested',
        corporateId: resolved.corporateId,
        userId: resolved.userId,
        requestId: created.id,
    }, 'CONSOLE')

    const corporate = await getSelfCorporate(req)
    const adminUsername = corporate?.credential?.username
    if (adminUsername) {
        await createNotification({
            notificationTitle: MEMBERSHIP_NOTIFICATION.REQUESTED.title,
            notificationBrief: MEMBERSHIP_NOTIFICATION.REQUESTED.brief({
                requestedBy: req.user?.employeeName || 'An employee',
            }),
            notificationCategory: MEMBERSHIP_NOTIFICATION.REQUESTED.category,
            notificationTo: adminUsername,
            notificationBy: 'CARDHOLDER',
        }, req)
    } else {
        customLog(req?.LogTraceId, 'error', {
            message: 'Could not resolve the corporate admin to notify for a new card access request',
            action: 'corporateCard:membership:adminNotifyUnresolved',
            corporateId: resolved.corporateId,
            requestId: created.id,
        }, 'CONSOLE')
    }

    return res.status(200).json({
        status: true,
        message: 'Access request submitted.',
        data: { request: serializeRequest(created) },
        responseCode: '000',
    })
})
