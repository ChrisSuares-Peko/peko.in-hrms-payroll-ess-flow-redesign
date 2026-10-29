const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const sequelize = require('../../configs/database/index')
const { customLog } = require('../../utils/loggerHelper')
const { GENERIC_ERROR, SELF_ADMIN_DENIED } = require('../../constants/messages')
const { KYC_STATUS } = require('../../constants/kyc')
const { CARD_STATUS, CARD_STATE, FREEZE_REASON, FREEZE_REASON_LABELS, FREEZE_ACTOR } = require('../../constants/card')
const {
    CARD_REQUEST_TYPE,
    CARD_REQUEST_STATUS,
    CARD_TYPE,
    CARD_TYPE_OPTIONS,
    NAME_ON_CARD_REGEX,
    ADDRESS_LINE_REGEX,
} = require('../../constants/cardRequest')
const { AUDIT_ACTION, AUDIT_CATEGORY } = require('../../constants/cardLimits')
// F-CC-12: reject approved limits above the platform cap (mirrors MAX_LIMIT in cardLimits.js).
const MAX_LIMIT = 9999999999.99
const { resolvePinelabsCredsForRequest } = require('../../utils/pinelabsGateway')
const { resolveCardBaseLimit, resolveCardUnitPrice, assertPhysicalCardAllowed } = require('../../utils/cardQuota')
const { findByMobile } = require('../../models/use-cases/cardholderKyc')
const { issueCardCore } = require('./pinelabsCardIssuance')
const { sendCorporateSupportEmail } = require('../../services/supportEmails')
const { cardTerminationRequestedTemplate } = require('../../utils/supportEmailTemplates')
const { SUPPORT_EMAIL } = require('../../constants/supportEmails')
const { applyCardStateChange } = require('./cardState')
const { serializeCard } = require('../../utils/serializeCard')
const emailer = require('../../utils/emailer')
const {
    parsePaging, toNum, round2, fmt, last4, cardholderActor, safeAudit, MOBILE_REGEX,
    isSubAdminSelfTarget, isProtectedOwnerTarget, actorCredentialId, actorUsername, actorDisplay,
    attachCardholders, escapeHtml, parseVendorEmail,
    cardholderColumnsOf, cardholderColumnsForSession, cardholderIdentity, rowBelongsToCardholder, rowCardholderIdentity,
} = require('../../utils/cardHelpers')
const { searchCardUserIds, getSelfCorporate, grantCardMembership } = require('../../utils/sharedDirectory')
const { findCardUserScoped } = require('../../models/use-cases/cardUser')
const { createNotification } = require('../../models/use-cases/notification')
const { UNFREEZE_NOTIFICATION, NOTE_MAX } = require('../../constants/cardNotifications')
const { MEMBERSHIP_NOTIFICATION } = require('../../constants/membershipNotifications')
const {
    findByIdScoped: findCardScoped,
    findByIdForUpdate,
    applyLimit,
    updateCardStateById,
} = require('../../models/use-cases/cardIssuance')
const { findByCorporate: findCorporateApplication } = require('../../models/use-cases/corporateCardAdminApplication')
const {
    createRequest,
    findActiveByTarget,
    findByIdScoped: findRequestScoped,
    findAndCountForQueue,
    findByRequester,
    decideFromPendingCAS,
    updateById,
    finalizeFromProcessingCAS,
    hasBlockingTermination,
    resolveActiveByCards,
} = require('../../models/use-cases/cardRequest')

class HttpError extends Error {
    constructor(statusCode, message) {
        super(message)
        this.statusCode = statusCode
    }
}

const serializeRequestRow = (r) => ({
    id: r.id,
    date: r.createdAt,
    requestType: r.requestType,
    status: r.status,
    reason: r.reason,
    decisionNote: r.decisionNote,
    decidedAt: r.decidedAt,
    cardIssuanceId: r.cardIssuanceId,
    cardLast4: last4(r.card?.maskedCardNumber),
    payload: r.payload || {},
    result: r.result || {},
})

const buildShipping = (body) => {
    const trim = (v) => (v === undefined || v === null ? '' : String(v).trim())
    const nameOnCard = trim(body.nameOnCard)
    const addressLine1 = trim(body.addressLine1)
    const addressLine2 = trim(body.addressLine2)
    if (!NAME_ON_CARD_REGEX.test(nameOnCard)) return { error: 'Enter a valid name on card.' }
    if (!ADDRESS_LINE_REGEX.test(addressLine1)) return { error: 'Enter a valid address line 1.' }
    if (addressLine2 && !ADDRESS_LINE_REGEX.test(addressLine2)) return { error: 'Enter a valid address line 2.' }
    return {
        shipping: {
            nameOnCard,
            addressLine1,
            addressLine2: addressLine2 || null,
            fullName: trim(body.fullName) || null,
            city: trim(body.city) || null,
            state: trim(body.state) || null,
            pinCode: trim(body.pinCode) || null,
            mobileNumber: trim(body.mobileNumber) || null,
        },
    }
}
exports.buildShipping = buildShipping

const createIssuanceRequest = async (req, res, next, { corporateId, userId, cardIssuanceId, requestReason }) => {
    const body = req.body || {}
    const type = body.cardType ? String(body.cardType).trim() : CARD_TYPE.VIRTUAL
    if (!CARD_TYPE_OPTIONS.includes(type)) return next(new ErrorResponse('Invalid card type.', 400))
    const isPhysical = type === CARD_TYPE.PHYSICAL

    let sourceCardId = null
    let requestedLimit
    let perTxnLimit = null
    let shipping

    if (isPhysical) {
        if (!cardIssuanceId) return next(new ErrorResponse('A source card is required for a physical card request.', 400))
        const source = await findCardScoped(cardIssuanceId, corporateId)
        if (!source || !rowBelongsToCardholder(source, { userId: userId ?? null })) {
            return next(new ErrorResponse('Card not found.', 404))
        }
        if (source.status !== CARD_STATUS.ISSUED) {
            return next(new ErrorResponse('You can only request a physical card for an active card.', 400))
        }
        if (source.cardState !== CARD_STATE.ACTIVE) {
            return next(new ErrorResponse('You cannot request a physical card for a frozen card.', 400))
        }
        if (source.cardType === CARD_TYPE.PHYSICAL) {
            return next(new ErrorResponse('This card is already a physical card.', 400))
        }
        sourceCardId = cardIssuanceId
        requestedLimit = round2(toNum(source.cardLimit) ?? 0)

        const built = buildShipping(body)
        if (built.error) return next(new ErrorResponse(built.error, 400))
        shipping = built.shipping
    } else {
        const limitNum = Number(body.cardLimit)
        if (!Number.isFinite(limitNum) || limitNum <= 0) {
            return next(new ErrorResponse('A valid card limit is required.', 400))
        }
        requestedLimit = round2(limitNum)

        const { perTxnLimit: perTxnRaw } = body
        if (perTxnRaw !== undefined && perTxnRaw !== null && perTxnRaw !== '') {
            const perTxnNum = Number(perTxnRaw)
            if (!Number.isFinite(perTxnNum) || perTxnNum <= 0) {
                return next(new ErrorResponse('A valid per-transaction limit is required.', 400))
            }
            if (perTxnNum > limitNum) {
                return next(new ErrorResponse('Per-transaction limit cannot exceed the card limit.', 400))
            }
            perTxnLimit = round2(perTxnNum)
        }
    }

    const dupMessage = isPhysical
        ? 'A physical card request is already pending for this card.'
        : 'You already have a pending card request.'
    const active = isPhysical
        ? await findActiveByTarget({ requestType: CARD_REQUEST_TYPE.CARD_ISSUANCE, cardIssuanceId: sourceCardId })
        : await findActiveByTarget({ requestType: CARD_REQUEST_TYPE.CARD_ISSUANCE, cardholder: { userId: userId ?? null } })
    if (active) return next(new ErrorResponse(dupMessage, 409))

    let created
    try {
        created = await createRequest({
            corporateId,
            userId: userId ?? null,
            cardIssuanceId: sourceCardId,
            requestType: CARD_REQUEST_TYPE.CARD_ISSUANCE,
            cardType: type,
            status: CARD_REQUEST_STATUS.PENDING,
            reason: requestReason,
            requestedByCredentialId: actorCredentialId(req),
            payload: {
                cardType: type,
                requestedLimit,
                ...(perTxnLimit !== null ? { perTxnLimit } : {}),
                ...(shipping ? { shipping } : {}),
            },
        })
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') return next(new ErrorResponse(dupMessage, 409))
        throw err
    }

    await safeAudit(req?.LogTraceId, {
        corporateId,
        userId,
        cardIssuanceId: sourceCardId,
        action: AUDIT_ACTION.CARD_ISSUANCE_REQUESTED,
        category: AUDIT_CATEGORY.LIFECYCLE,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: cardholderActor(req),
        title: isPhysical ? 'Physical card requested' : 'New card requested',
        description: isPhysical
            ? `Requested a physical card (limit ₹${fmt(requestedLimit)})`
            : `Requested a ${type} card (limit ₹${fmt(requestedLimit)})`,
        metadata: { requestId: created.id, cardType: type, requestedLimit, perTxnLimit, reason: requestReason, shipped: !!shipping },
    })

    return res.status(200).json({
        status: true,
        message: isPhysical ? 'Physical card request submitted for approval.' : 'Card request submitted for approval.',
        data: {},
        responseCode: '000',
    })
}

const createLimitRequest = async (req, res, next, { corporateId, userId, cardIssuanceId, requestReason }) => {
    if (!cardIssuanceId) return next(new ErrorResponse('A card is required for a limit request.', 400))
    const amt = Number(req.body?.amount)
    if (!Number.isFinite(amt) || amt <= 0) return next(new ErrorResponse('A valid additional amount is required.', 400))

    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card || !rowBelongsToCardholder(card, { userId: userId ?? null })) {
        return next(new ErrorResponse('Card not found.', 404))
    }
    if (card.status !== CARD_STATUS.ISSUED) {
        return next(new ErrorResponse('You can only request a limit increase on an active card.', 400))
    }
    if (card.cardState !== CARD_STATE.ACTIVE) {
        return next(new ErrorResponse('You cannot request a limit increase on a frozen card.', 400))
    }

    const active = await findActiveByTarget({ requestType: CARD_REQUEST_TYPE.LIMIT_INCREASE, cardIssuanceId })
    if (active) return next(new ErrorResponse('You already have a pending limit request for this card.', 409))

    const currentLimit = toNum(card.cardLimit) ?? 0
    const requestedAmount = round2(amt)
    let created
    try {
        created = await createRequest({
            corporateId,
            userId: userId ?? null,
            cardIssuanceId,
            requestType: CARD_REQUEST_TYPE.LIMIT_INCREASE,
            status: CARD_REQUEST_STATUS.PENDING,
            reason: requestReason,
            requestedByCredentialId: actorCredentialId(req),
            payload: { requestedAmount, currentLimit, requestedLimit: round2(currentLimit + requestedAmount) },
        })
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') return next(new ErrorResponse('You already have a pending limit request for this card.', 409))
        throw err
    }

    await safeAudit(req?.LogTraceId, {
        corporateId,
        userId,
        cardIssuanceId,
        action: AUDIT_ACTION.LIMIT_INCREASE_REQUESTED,
        category: AUDIT_CATEGORY.LIMITS,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: cardholderActor(req),
        title: 'Limit increase requested',
        description: `Requested an additional ₹${fmt(requestedAmount)} (from ₹${fmt(currentLimit)} to ₹${fmt(round2(currentLimit + requestedAmount))})`,
        metadata: { requestId: created.id, requestedAmount, reason: requestReason },
    })

    return res.status(200).json({ status: true, message: 'Limit increase request submitted for review.', data: {}, responseCode: '000' })
}

const UNFREEZE_DUPLICATE_MESSAGE = 'You already have a pending unfreeze request for this card.'

const createUnfreezeRequest = async (req, res, next, { corporateId, userId, cardIssuanceId, requestReason }) => {
    if (!cardIssuanceId) return next(new ErrorResponse('A card is required for an unfreeze request.', 400))

    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card || !rowBelongsToCardholder(card, { userId: userId ?? null })) {
        return next(new ErrorResponse('Card not found.', 404))
    }
    if (card.status !== CARD_STATUS.ISSUED) {
        return next(new ErrorResponse('You can only request an unfreeze on an active card.', 400))
    }
    if (card.cardState !== CARD_STATE.FROZEN) {
        return next(new ErrorResponse('This card is not frozen.', 400))
    }
    if (await hasBlockingTermination(card.id)) {
        return next(new ErrorResponse('This card has a termination request in progress or completed and cannot be unfrozen.', 409))
    }

    const active = await findActiveByTarget({ requestType: CARD_REQUEST_TYPE.UNFREEZE, cardIssuanceId })
    if (active) return next(new ErrorResponse(UNFREEZE_DUPLICATE_MESSAGE, 409))

    let created
    try {
        created = await createRequest({
            corporateId,
            userId: userId ?? null,
            cardIssuanceId,
            requestType: CARD_REQUEST_TYPE.UNFREEZE,
            cardType: card.cardType || null,
            status: CARD_REQUEST_STATUS.PENDING,
            reason: requestReason,
            requestedByCredentialId: actorCredentialId(req),
            payload: {
                freezeReason: card.freezeReason ?? null,
                freezeReasonLabel: FREEZE_REASON_LABELS[card.freezeReason] || null,
                freezeReasonNote: card.freezeReasonNote ?? null,
                frozenByRole: card.frozenByRole ?? null,
                frozenAt: card.stateUpdatedAt ?? null,
                cardholderUsername: actorUsername(req),
            },
        })
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') return next(new ErrorResponse(UNFREEZE_DUPLICATE_MESSAGE, 409))
        throw err
    }

    await safeAudit(req?.LogTraceId, {
        corporateId,
        userId,
        cardIssuanceId,
        action: AUDIT_ACTION.CARD_UNFREEZE_REQUESTED,
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: cardholderActor(req),
        title: 'Unfreeze requested',
        description: `Requested an unfreeze for the card ending ${last4(card.maskedCardNumber)}`,
        metadata: { requestId: created.id, reason: requestReason },
    })

    const corporate = await getSelfCorporate(req)
    const adminUsername = corporate?.credential?.username
    if (adminUsername) {
        await createNotification({
            notificationTitle: UNFREEZE_NOTIFICATION.REQUESTED.title,
            notificationBrief: UNFREEZE_NOTIFICATION.REQUESTED.brief({
                cardLast4: last4(card.maskedCardNumber),
                requestedBy: cardholderActor(req),
            }),
            notificationCategory: UNFREEZE_NOTIFICATION.REQUESTED.category,
            notificationTo: adminUsername,
            notificationBy: 'CARDHOLDER',
        }, req)
    } else {
        customLog(req?.LogTraceId, 'error', {
            message: '[CardRequests] Could not resolve the corporate admin to notify for a new unfreeze request',
            corporateId,
            requestId: created.id,
        }, 'CONSOLE')
    }

    return res.status(200).json({ status: true, message: 'Unfreeze request submitted for approval.', data: {}, responseCode: '000' })
}

exports.createCardRequest = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const { userId } = cardholderColumnsForSession(req)
    // requireCardholder already refuses a session with no identity. Repeated here because this is the value
    // six tables key on and every writer below defaults it to null: one middleware is a single point of
    // failure for a fact that cannot be recovered once the row is written.
    if (!userId) return next(new ErrorResponse('This action is available to cardholders only.', 403))

    const { requestType, cardIssuanceId, reason } = req.body || {}
    const requestReason = reason ? String(reason).trim().slice(0, 500) : null

    if (requestType === CARD_REQUEST_TYPE.CARD_ISSUANCE) {
        return createIssuanceRequest(req, res, next, { corporateId, userId, cardIssuanceId, requestReason })
    }
    if (requestType === CARD_REQUEST_TYPE.LIMIT_INCREASE) {
        return createLimitRequest(req, res, next, { corporateId, userId, cardIssuanceId, requestReason })
    }
    if (requestType === CARD_REQUEST_TYPE.UNFREEZE) {
        return createUnfreezeRequest(req, res, next, { corporateId, userId, cardIssuanceId, requestReason })
    }
    return next(new ErrorResponse('Unsupported request type.', 400))
})

exports.listMyRequests = asyncHandler(async (req, res) => {
    const requestType = typeof req.query.requestType === 'string' ? req.query.requestType : undefined
    const cardType = typeof req.query.cardType === 'string' ? req.query.cardType : undefined
    const { limit, offset } = parsePaging(req)

    const { count, rows } = await findByRequester({ cardholder: cardholderIdentity(req), requestType, cardType, limit, offset })
    return res.status(200).json({ status: true, message: 'Card requests fetched.', data: { count, rows: rows.map(serializeRequestRow) }, responseCode: '000' })
})

exports.listRequests = asyncHandler(async (req, res) => {
    const corporateId = req.user?.corporateId
    const requestType = typeof req.query.requestType === 'string' ? req.query.requestType : undefined
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const cardType = typeof req.query.cardType === 'string' ? req.query.cardType : undefined
    const searchText = typeof req.query.searchText === 'string' ? req.query.searchText : undefined
    // A non-numeric filter matches no row rather than being dropped, so a malformed value returns an empty
    // list instead of the unfiltered one.
    const cardholderRaw = typeof req.query.cardholder === 'string' ? req.query.cardholder.trim() : ''
    const cardholderId = cardholderRaw ? (/^\d+$/.test(cardholderRaw) ? cardholderRaw : '0') : undefined
    const cardholderFilter = cardholderId ? { userId: cardholderId } : undefined
    // The client has always sent this; it used to be read by nobody, so the card filter narrowed
    // nothing. Same treatment as cardholder: a non-numeric value matches no row rather than being
    // dropped, so a malformed filter returns an empty list instead of the unfiltered one.
    const cardRaw = typeof req.query.cardIssuanceId === 'string' ? req.query.cardIssuanceId.trim() : ''
    const cardIssuanceId = cardRaw ? (/^\d+$/.test(cardRaw) ? cardRaw : '0') : undefined
    const dateFrom = typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined
    const dateTo = typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined
    const { limit, offset } = parsePaging(req)

    let searchMatchIds
    let searchMatchUserIds
    if (searchText && searchText.trim()) {
        ({ ids: searchMatchIds, userIds: searchMatchUserIds } = await searchCardUserIds({
            searchText: searchText.trim(),
            fields: ['name', 'email'],
            req,
        }))
    }

    const { count, rows } = await findAndCountForQueue({ corporateId, requestType, status, cardType, cardholder: cardholderFilter, cardIssuanceId, searchText, searchMatchIds, searchMatchUserIds, dateFrom, dateTo, limit, offset })
    await attachCardholders(rows, req)
    // attachCardholders fails to a null cardholder — a directory hiccup is not an error here, it just costs
    // the name. A membership request captured the requester's own name and username when it was raised, so
    // for that one type the queue has a second source and must not render "-" on a transient miss.
    const data = rows.map((r) => ({
        ...serializeRequestRow(r),
        member: r.cardholder?.name || r.payload?.cardholderName || null,
        memberEmail: r.cardholder?.email || r.payload?.cardholderUsername || null,
        holderId: r.userId,
    }))
    return res.status(200).json({ status: true, message: 'Card requests fetched.', data: { count, rows: data }, responseCode: '000' })
})

const approveIssuance = async (req, res, next, request) => {
    const corporateId = req.user?.corporateId
    const { id } = req.params
    const { approvedLimit: overrideRaw, note } = req.body || {}
    const isPhysical = request.payload?.cardType === CARD_TYPE.PHYSICAL

    let approvedLimit = toNum(request.payload?.requestedLimit)
    if (!isPhysical && overrideRaw !== undefined && overrideRaw !== null && overrideRaw !== '') {
        const o = Number(overrideRaw)
        if (!Number.isFinite(o) || o <= 0) return next(new ErrorResponse('A valid approved limit is required.', 400))
        approvedLimit = round2(o)
    }
    if (approvedLimit === null || approvedLimit <= 0) return next(new ErrorResponse('A valid approved limit is required.', 400))
    if (approvedLimit > MAX_LIMIT) return next(new ErrorResponse('Approved limit is too large.', 400))

    const requestedPerTxnLimit = toNum(request.payload?.perTxnLimit)
    let perTxnLimit = requestedPerTxnLimit
    if (perTxnLimit !== null && perTxnLimit > approvedLimit) {
        perTxnLimit = approvedLimit
        customLog(req?.LogTraceId, 'info', {
            message: '[Card] Per-transaction limit clamped to the approved card limit',
            requestId: Number(id),
            requestedPerTxnLimit,
            approvedLimit,
        }, 'CONSOLE')
    }

    const holder = await findCardUserScoped({ cardholder: rowCardholderIdentity(request), req })
    if (!holder) {
        return next(new ErrorResponse('Cardholder not found — the member may have been removed or no longer has Corporate Cards access.', 404))
    }
    const customerName = (holder?.name || '').trim()
    const mobile = String(holder?.mobileNo || '')
    const email = holder?.email || null
    if (!customerName || customerName.length > 50) return next(new ErrorResponse("The cardholder's profile is missing a valid name.", 400))
    if (!MOBILE_REGEX.test(mobile)) return next(new ErrorResponse("The cardholder's profile is missing a valid 10-digit mobile number.", 400))

    const kyc = await findByMobile(mobile)
    if (kyc?.kycStatus !== KYC_STATUS.COMPLETED) return next(new ErrorResponse('The cardholder has not completed KYC yet.', 400))

    const { error, statusCode, creds, serviceDetails } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))
    const application = await findCorporateApplication(corporateId)
    const cardSchemeId = application?.cardSchemeId
    if (!cardSchemeId) {
        customLog(req?.LogTraceId, 'error', { message: '[Card] Card scheme id not configured (per-corporate or vendor.optional3)' }, 'VENDOR')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    let sourceReferenceNumber = null
    let sourceCardIssuanceId = null
    const baseLimit = isPhysical ? resolveCardBaseLimit(serviceDetails) : undefined
    const unitPrice = isPhysical ? resolveCardUnitPrice(serviceDetails) : undefined
    if (isPhysical) {
        const source = await findCardScoped(request.cardIssuanceId, corporateId)
        if (!source || !source.referenceNumber) {
            return next(new ErrorResponse('The source card is missing a vendor reference; a physical card cannot be issued.', 400))
        }
        sourceReferenceNumber = source.referenceNumber
        sourceCardIssuanceId = source.id

        // Ahead of the CAS claim on purpose: a payment-required refusal after the claim would strand the
        // request in PROCESSING while the admin is away paying.
        const allowance = await assertPhysicalCardAllowed({ corporateId, baseLimit, unitPrice })
        if (!allowance.ok) {
            return next(new ErrorResponse(allowance.message, allowance.requiresPayment ? 402 : 400))
        }
    }

    const claimed = await decideFromPendingCAS(id, {
        status: CARD_REQUEST_STATUS.PROCESSING,
        decidedByCredentialId: actorCredentialId(req),
        decidedAt: new Date(),
        decisionNote: note ? String(note).slice(0, 500) : null,
    })
    if (!claimed) return next(new ErrorResponse('This request has already been decided.', 409))

    let result
    try {
        result = await issueCardCore({
            cardholder: {
                customerName,
                mobile,
                email,
                ...cardholderColumnsOf(request),
                corporateId,
                credentialId: request.requestedByCredentialId,
            },
            params: {
                requestedLimit: toNum(request.payload?.requestedLimit),
                requestReason: request.reason,
                enforcedLimit: approvedLimit,
                ...(perTxnLimit !== null ? { perTxnLimit } : {}),
                cardType: request.payload?.cardType,
                shipping: request.payload?.shipping,
                sourceReferenceNumber,
                sourceCardIssuanceId,
                cardRequestId: Number(id),
            },
            creds,
            cardSchemeId,
            baseLimit,
            unitPrice,
            actor: { credentialId: actorCredentialId(req), display: actorDisplay(req) },
            logTraceId: req?.LogTraceId,
            req,
        })
    } catch (err) {
        await updateById(id, {
            status: CARD_REQUEST_STATUS.PENDING,
            decidedByCredentialId: null,
            decidedAt: null,
            decisionNote: null,
        })
        throw err
    }

    if (result.ok && result.confirmed === false) {
        await updateById(id, {
            status: CARD_REQUEST_STATUS.PROCESSING,
            result: { issuedCardIssuanceId: result.card.id, approvedLimit, ...(perTxnLimit !== null ? { perTxnLimit } : {}) },
        })
        await safeAudit(req?.LogTraceId, {
            corporateId,
            ...cardholderColumnsOf(request),
            cardIssuanceId: result.card.id,
            action: AUDIT_ACTION.CARD_ISSUANCE_APPROVED,
            category: AUDIT_CATEGORY.LIFECYCLE,
            actorCredentialId: actorCredentialId(req),
            actorDisplay: actorDisplay(req),
            title: 'Card request approved — issuance in progress',
            description: `Approved the card request (limit ₹${fmt(approvedLimit)}); awaiting confirmation from the issuer.`,
            newValue: { status: CARD_REQUEST_STATUS.PROCESSING, approvedLimit, perTxnLimit },
            metadata: { requestId: Number(id), cardIssuanceId: result.card.id, decisionNote: note || null, requestedPerTxnLimit },
        })
        return res.status(200).json({
            status: true,
            message: 'Card request approved — the card is being issued and will appear once the issuer confirms it.',
            data: {
                requestId: Number(id),
                status: CARD_REQUEST_STATUS.PROCESSING,
                confirmed: false,
                card: serializeCard(result.card),
            },
            responseCode: '000',
        })
    }

    if (result.ok) {
        await updateById(id, { status: CARD_REQUEST_STATUS.APPROVED, result: { issuedCardIssuanceId: result.card.id, approvedLimit, ...(perTxnLimit !== null ? { perTxnLimit } : {}) } })
        await safeAudit(req?.LogTraceId, {
            corporateId,
            ...cardholderColumnsOf(request),
            cardIssuanceId: result.card.id,
            action: AUDIT_ACTION.CARD_ISSUANCE_APPROVED,
            category: AUDIT_CATEGORY.LIFECYCLE,
            actorCredentialId: actorCredentialId(req),
            actorDisplay: actorDisplay(req),
            title: 'Card request approved',
            description: `Approved the card request and issued the card (limit ₹${fmt(approvedLimit)}).`,
            newValue: { status: CARD_REQUEST_STATUS.APPROVED, approvedLimit, perTxnLimit },
            metadata: { requestId: Number(id), cardIssuanceId: result.card.id, decisionNote: note || null, requestedPerTxnLimit },
        })
        return res.status(200).json({
            status: true,
            message: 'Card request approved and issued.',
            data: { requestId: Number(id), status: CARD_REQUEST_STATUS.APPROVED, confirmed: true, card: serializeCard(result.card) },
            responseCode: '000',
        })
    }

    await updateById(id, {
        status: CARD_REQUEST_STATUS.PENDING,
        decidedByCredentialId: null,
        decidedAt: null,
        decisionNote: null,
    })
    return next(new ErrorResponse(result.message || GENERIC_ERROR, result.statusCode || 502))
}

const approveLimit = async (req, res, next, request) => {
    const corporateId = req.user?.corporateId
    const { id } = req.params
    const { appliedLimit: overrideRaw, note } = req.body || {}

    let override = null
    if (overrideRaw !== undefined && overrideRaw !== null && overrideRaw !== '') {
        override = Number(overrideRaw)
        if (!Number.isFinite(override) || override <= 0) return next(new ErrorResponse('A valid applied limit is required.', 400))
    }

    let audit
    try {
        audit = await sequelize.transaction(async (t) => {
            const card = await findByIdForUpdate(request.cardIssuanceId, t)
            if (!card || String(card.corporateId) !== String(corporateId)) throw new HttpError(404, 'Card not found.')
            if (card.status !== CARD_STATUS.ISSUED) throw new HttpError(400, 'Card is not active.')
            if (card.cardState !== CARD_STATE.ACTIVE) throw new HttpError(400, 'Card is frozen.')

            const liveLimit = toNum(card.cardLimit) ?? 0
            const appliedLimit = round2(override !== null ? override : liveLimit + (toNum(request.payload?.requestedAmount) ?? 0))
            if (appliedLimit > MAX_LIMIT) throw new HttpError(400, 'Approved limit is too large.')
            const baseChanged = toNum(request.payload?.currentLimit) !== liveLimit

            const count = await decideFromPendingCAS(id, {
                status: CARD_REQUEST_STATUS.APPROVED,
                decidedByCredentialId: actorCredentialId(req),
                decidedAt: new Date(),
                decisionNote: note ? String(note).slice(0, 500) : null,
                result: { appliedLimit },
            }, t)
            if (count === 0) throw new HttpError(409, 'This request has already been decided.')

            await applyLimit(request.cardIssuanceId, { cardLimit: appliedLimit }, actorCredentialId(req), t)
            return { liveLimit, appliedLimit, baseChanged }
        })
    } catch (err) {
        if (err instanceof HttpError) return next(new ErrorResponse(err.message, err.statusCode))
        throw err
    }

    await safeAudit(req?.LogTraceId, {
        corporateId,
        ...cardholderColumnsOf(request),
        cardIssuanceId: request.cardIssuanceId,
        action: AUDIT_ACTION.LIMIT_INCREASE_APPROVED,
        category: AUDIT_CATEGORY.LIMITS,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Limit increase approved',
        description: `Card limit changed from ₹${fmt(audit.liveLimit)} to ₹${fmt(audit.appliedLimit)}`,
        oldValue: { cardLimit: audit.liveLimit },
        newValue: { cardLimit: audit.appliedLimit },
        metadata: { requestId: Number(id), requestedAmount: toNum(request.payload?.requestedAmount), baseChanged: audit.baseChanged, decisionNote: note || null },
    })

    return res.status(200).json({
        status: true,
        message: 'Limit increase approved.',
        data: { requestId: Number(id), status: CARD_REQUEST_STATUS.APPROVED, appliedLimit: audit.appliedLimit },
        responseCode: '000',
    })
}

const approveUnfreeze = async (req, res, next, request) => {
    const corporateId = req.user?.corporateId
    const { id } = req.params
    const { note } = req.body || {}

    if (!request.cardIssuanceId) return next(new ErrorResponse('This request is not linked to a card.', 400))

    const card = await findCardScoped(request.cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))

    const holder = await findCardUserScoped({ cardholder: rowCardholderIdentity(request), req })
    if (!holder) {
        return next(new ErrorResponse('Cardholder not found — the member may have been removed or no longer has Corporate Cards access.', 404))
    }

    if (card.status !== CARD_STATUS.ISSUED) return next(new ErrorResponse('Only an active card can be unfrozen.', 400))
    if (await hasBlockingTermination(card.id)) {
        return next(new ErrorResponse('This card has a termination request in progress or completed and cannot be unfrozen.', 409))
    }

    const alreadyActive = (card.cardState || CARD_STATE.ACTIVE) !== CARD_STATE.FROZEN

    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const claimed = await decideFromPendingCAS(id, {
        status: CARD_REQUEST_STATUS.PROCESSING,
        decidedByCredentialId: actorCredentialId(req),
        decidedAt: new Date(),
        decisionNote: note ? String(note).slice(0, 500) : null,
    })
    if (!claimed) return next(new ErrorResponse('This request has already been decided.', 409))

    const outcome = alreadyActive ? { ok: true } : await applyCardStateChange({
        card,
        freeze: false,
        isAdmin: true,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        corporateId,
        creds,
        logTraceId: req?.LogTraceId,
    })

    if (!outcome.ok) {
        if (outcome.terminationLocked) {
            await finalizeFromProcessingCAS(id, {
                status: CARD_REQUEST_STATUS.REJECTED,
                decisionNote: 'Card termination requested',
            })
            return next(new ErrorResponse(outcome.message, outcome.statusCode || 409))
        }
        await finalizeFromProcessingCAS(id, {
            status: CARD_REQUEST_STATUS.PENDING,
            decidedByCredentialId: null,
            decidedAt: null,
            decisionNote: null,
        })
        return next(new ErrorResponse(outcome.message || GENERIC_ERROR, outcome.statusCode || 502))
    }

    const finalized = await finalizeFromProcessingCAS(id, {
        status: CARD_REQUEST_STATUS.APPROVED,
        result: { unfrozen: true, alreadyActive },
    })
    if (!finalized) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CardRequests] Unfreeze applied but another actor had already decided the request',
            requestId: Number(id),
            cardIssuanceId: card.id,
        }, 'CONSOLE')
    }

    await safeAudit(req?.LogTraceId, {
        corporateId,
        ...cardholderColumnsOf(request),
        cardIssuanceId: card.id,
        action: AUDIT_ACTION.CARD_UNFREEZE_APPROVED,
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Unfreeze request approved',
        description: `Approved the unfreeze request for the card ending ${last4(card.maskedCardNumber)}`,
        newValue: { status: CARD_REQUEST_STATUS.APPROVED, cardState: CARD_STATE.ACTIVE },
        metadata: { requestId: Number(id), decisionNote: note || null, alreadyActive },
    })

    const cardholderUsername = request.payload?.cardholderUsername
    if (cardholderUsername) {
        await createNotification({
            notificationTitle: UNFREEZE_NOTIFICATION.APPROVED.title,
            notificationBrief: UNFREEZE_NOTIFICATION.APPROVED.brief({
                cardLast4: last4(card.maskedCardNumber),
                decidedBy: actorDisplay(req),
            }),
            notificationCategory: UNFREEZE_NOTIFICATION.APPROVED.category,
            notificationTo: cardholderUsername,
            notificationBy: 'ADMIN',
        }, req)
    }

    return res.status(200).json({
        status: true,
        message: 'Unfreeze request approved and the card is active.',
        data: { requestId: Number(id), status: CARD_REQUEST_STATUS.APPROVED, cardState: CARD_STATE.ACTIVE },
        responseCode: '000',
    })
}

exports.approveRequest = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { id } = req.params

    const request = await findRequestScoped(id, corporateId)
    if (!request) return next(new ErrorResponse('Request not found.', 404))
    if (request.status !== CARD_REQUEST_STATUS.PENDING) return next(new ErrorResponse('This request has already been decided.', 409))
    if (request.requestType === CARD_REQUEST_TYPE.TERMINATE) {
        return next(new ErrorResponse('Termination requests are handled by the internal team.', 409))
    }
    if (isSubAdminSelfTarget(req, rowCardholderIdentity(request))) {
        return next(new ErrorResponse('Your own requests are decided by your corporate admin.', 403))
    }
    if (await isProtectedOwnerTarget(req, request.userId)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }
    if (request.requestType === CARD_REQUEST_TYPE.CARD_ISSUANCE) return approveIssuance(req, res, next, request)
    if (request.requestType === CARD_REQUEST_TYPE.LIMIT_INCREASE) return approveLimit(req, res, next, request)
    if (request.requestType === CARD_REQUEST_TYPE.UNFREEZE) return approveUnfreeze(req, res, next, request)
    if (request.requestType === CARD_REQUEST_TYPE.MEMBERSHIP) return approveMembership(req, res, next, request)
    return next(new ErrorResponse('This request type cannot be approved here.', 400))
})

/**
 * Approving a membership request makes the employee a cardholder.
 *
 * The grant lands first and the row is marked second: a grant that succeeds while the mark fails leaves the
 * request PENDING for the admin to approve again, and the grant is idempotent — whereas marking first would
 * show the employee an approved screen they can do nothing with.
 */
const approveMembership = async (req, res, next, request) => {
    const corporateId = req.user?.corporateId
    const { id } = req.params
    const { note } = req.body || {}

    if (!request.userId) return next(new ErrorResponse('This request has no employee to approve.', 400))

    let granted
    try {
        granted = await grantCardMembership({ userId: request.userId, req })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Corporate card membership grant failed — request left pending',
            action: 'corporateCard:membership:grantFailed',
            corporateId,
            userId: request.userId,
            requestId: id,
            error: err?.message,
        }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 502))
    }

    const claimed = await decideFromPendingCAS(id, {
        status: CARD_REQUEST_STATUS.APPROVED,
        decidedByCredentialId: actorCredentialId(req),
        decidedAt: new Date(),
        decisionNote: note ? String(note).slice(0, 500) : null,
    })
    if (!claimed) return next(new ErrorResponse('This request has already been decided.', 409))

    await safeAudit(req?.LogTraceId, {
        corporateId,
        userId: request.userId,
        action: AUDIT_ACTION.MEMBERSHIP_APPROVED,
        category: AUDIT_CATEGORY.LIFECYCLE,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Corporate Cards access approved',
        description: 'Approved the employee\'s request for Corporate Cards access.',
        metadata: { requestId: id, alreadyHeld: granted.alreadyHeld },
    })

    const approvedUsername = request.payload?.cardholderUsername
    if (approvedUsername) {
        await createNotification({
            notificationTitle: MEMBERSHIP_NOTIFICATION.APPROVED.title,
            notificationBrief: MEMBERSHIP_NOTIFICATION.APPROVED.brief({ decidedBy: actorDisplay(req) }),
            notificationCategory: MEMBERSHIP_NOTIFICATION.APPROVED.category,
            notificationTo: approvedUsername,
            notificationBy: 'ADMIN',
        }, req)
    }

    return res.status(200).json({
        status: true,
        message: 'Access request approved.',
        data: { id: String(id), status: CARD_REQUEST_STATUS.APPROVED },
        responseCode: '000',
    })
}

const REJECTION_AUDIT = {
    [CARD_REQUEST_TYPE.CARD_ISSUANCE]: { action: AUDIT_ACTION.CARD_ISSUANCE_REJECTED, category: AUDIT_CATEGORY.LIFECYCLE },
    [CARD_REQUEST_TYPE.LIMIT_INCREASE]: { action: AUDIT_ACTION.LIMIT_INCREASE_REJECTED, category: AUDIT_CATEGORY.LIMITS },
    [CARD_REQUEST_TYPE.UNFREEZE]: { action: AUDIT_ACTION.CARD_UNFREEZE_REJECTED, category: AUDIT_CATEGORY.SECURITY },
    [CARD_REQUEST_TYPE.MEMBERSHIP]: { action: AUDIT_ACTION.MEMBERSHIP_REJECTED, category: AUDIT_CATEGORY.LIFECYCLE },
}
const REJECTION_AUDIT_FALLBACK = { action: AUDIT_ACTION.CARD_ISSUANCE_REJECTED, category: AUDIT_CATEGORY.LIFECYCLE }

exports.rejectRequest = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { id } = req.params
    const { note } = req.body || {}

    const request = await findRequestScoped(id, corporateId)
    if (!request) return next(new ErrorResponse('Request not found.', 404))
    if (request.status !== CARD_REQUEST_STATUS.PENDING) return next(new ErrorResponse('This request has already been decided.', 409))
    if (request.requestType === CARD_REQUEST_TYPE.TERMINATE) {
        return next(new ErrorResponse('Termination requests are handled by the internal team.', 409))
    }
    if (isSubAdminSelfTarget(req, rowCardholderIdentity(request))) {
        return next(new ErrorResponse('Your own requests are decided by your corporate admin.', 403))
    }
    if (await isProtectedOwnerTarget(req, request.userId)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }

    const count = await decideFromPendingCAS(id, {
        status: CARD_REQUEST_STATUS.REJECTED,
        decidedByCredentialId: actorCredentialId(req),
        decidedAt: new Date(),
        decisionNote: note ? String(note).slice(0, 500) : null,
    })
    if (count === 0) return next(new ErrorResponse('This request has already been decided.', 409))

    const { action, category } = REJECTION_AUDIT[request.requestType] || REJECTION_AUDIT_FALLBACK
    await safeAudit(req?.LogTraceId, {
        corporateId,
        ...cardholderColumnsOf(request),
        cardIssuanceId: request.cardIssuanceId,
        action,
        category,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Request rejected',
        description: note ? `Rejected: ${String(note).slice(0, 200)}` : 'Request rejected.',
        metadata: { requestId: Number(id), requestType: request.requestType, decisionNote: note || null },
    })

    if (request.requestType === CARD_REQUEST_TYPE.UNFREEZE) {
        const cardholderUsername = request.payload?.cardholderUsername
        if (cardholderUsername) {
            // The request payload carries no card number, so read it from the card. Best-effort: the copy
            // stays readable without it, and a lookup failure must not cost the cardholder their notice.
            const card = await findCardScoped(request.cardIssuanceId, corporateId)
            await createNotification({
                notificationTitle: UNFREEZE_NOTIFICATION.REJECTED.title,
                notificationBrief: UNFREEZE_NOTIFICATION.REJECTED.brief({
                    cardLast4: last4(card?.maskedCardNumber),
                    decidedBy: actorDisplay(req),
                    note: note ? String(note).slice(0, NOTE_MAX) : null,
                }),
                notificationCategory: UNFREEZE_NOTIFICATION.REJECTED.category,
                notificationTo: cardholderUsername,
                notificationBy: 'ADMIN',
            }, req)
        }
    }

    if (request.requestType === CARD_REQUEST_TYPE.MEMBERSHIP) {
        const rejectedUsername = request.payload?.cardholderUsername
        if (rejectedUsername) {
            await createNotification({
                notificationTitle: MEMBERSHIP_NOTIFICATION.REJECTED.title,
                notificationBrief: MEMBERSHIP_NOTIFICATION.REJECTED.brief({
                    decidedBy: actorDisplay(req),
                    note: note ? String(note).slice(0, NOTE_MAX) : null,
                }),
                notificationCategory: MEMBERSHIP_NOTIFICATION.REJECTED.category,
                notificationTo: rejectedUsername,
                notificationBy: 'ADMIN',
            }, req)
        }
    }

    return res.status(200).json({ status: true, message: 'Request rejected.', data: { requestId: Number(id), status: CARD_REQUEST_STATUS.REJECTED }, responseCode: '000' })
})

exports.terminateCard = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    const { cardIssuanceId, reason } = req.body || {}
    if (!cardIssuanceId) return next(new ErrorResponse('A card is required.', 400))
    const requestReason = reason ? String(reason).trim().slice(0, 500) : null

    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))
    if (card.status !== CARD_STATUS.ISSUED) return next(new ErrorResponse('Only an active card can be terminated.', 400))

    const active = await findActiveByTarget({ requestType: CARD_REQUEST_TYPE.TERMINATE, cardIssuanceId })
    if (active) return next(new ErrorResponse('A termination request is already in progress for this card.', 409))
    
    if (await hasBlockingTermination(cardIssuanceId)) {
        return next(new ErrorResponse('This card has already been terminated.', 409))
    }

    let created
    try {
        created = await sequelize.transaction(async (t) => {
            const row = await createRequest({
                corporateId,
                ...cardholderColumnsOf(card),
                cardIssuanceId,
                requestType: CARD_REQUEST_TYPE.TERMINATE,
                status: CARD_REQUEST_STATUS.PENDING,
                reason: requestReason,
                requestedByCredentialId: actorCredentialId(req),
                result: { frozen: true },
            }, t)
            await updateCardStateById(cardIssuanceId, {
                cardState: CARD_STATE.FROZEN,
                freezeReason: FREEZE_REASON.OTHERS,
                freezeReasonNote: 'Card termination requested',
                frozenByRole: FREEZE_ACTOR.SYSTEM,
                stateUpdatedAt: new Date(),
                stateUpdatedByCredentialId: actorCredentialId(req),
            }, t)
            await resolveActiveByCards({
                corporateId,
                cardIssuanceIds: [cardIssuanceId],
                requestType: CARD_REQUEST_TYPE.UNFREEZE,
                fields: {
                    status: CARD_REQUEST_STATUS.REJECTED,
                    decidedByCredentialId: actorCredentialId(req),
                    decidedAt: new Date(),
                    decisionNote: 'Card termination requested',
                },
                statuses: [CARD_REQUEST_STATUS.PENDING],
            }, t)
            return row
        })
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
            return next(new ErrorResponse('A termination request is already in progress for this card.', 409))
        }
        throw err
    }

    await safeAudit(req?.LogTraceId, {
        corporateId,
        ...cardholderColumnsOf(card),
        cardIssuanceId,
        action: AUDIT_ACTION.CARD_TERMINATION_REQUESTED,
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: 'Card termination requested',
        description: `Termination requested for card ending ${last4(card.maskedCardNumber) || '****'}${requestReason ? ` — reason: ${requestReason}` : ''}; card frozen pending termination by the internal team.`,
        newValue: { cardState: CARD_STATE.FROZEN },
        metadata: { requestId: created.id, reason: requestReason },
    })

    try {
        const { error: credError, serviceDetails } = await resolvePinelabsCredsForRequest(req)
        const to = credError ? null : parseVendorEmail(serviceDetails?.vendor?.vendorEmail)
        const hasRecipient = Array.isArray(to) ? to.length > 0 : Boolean(to)
        if (hasRecipient) {
            const subject = 'Card termination requested'
            const body = `<p>A corporate has requested a card termination.</p>
<ul>
  <li><b>Card (last 4):</b> ${last4(card.maskedCardNumber) || 'N/A'}</li>
  <li><b>Corporate ID:</b> ${corporateId}</li>
  <li><b>Cardholder ID:</b> ${card.userId}</li>
  <li><b>Requested by (credential):</b> ${actorCredentialId(req)}</li>
  <li><b>Reason:</b> ${escapeHtml(requestReason) || 'N/A'}</li>
  <li><b>Request ID:</b> ${created.id}</li>
</ul>
<p>The card has been frozen. Please complete the termination.</p>`
            emailer.email(req?.LogTraceId, to, subject, body)
        } else {
            customLog(req?.LogTraceId, 'error', { message: '[CardRequests] Vendor email not configured — skipping termination email', requestId: created.id }, 'CONSOLE')
        }
    } catch (notifyErr) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CardRequests] Termination email skipped — vendor creds unavailable (request already recorded)',
            requestId: created.id,
            error: notifyErr?.message,
        }, 'CONSOLE')
    }

    await sendCorporateSupportEmail({
        corporateId,
        template: cardTerminationRequestedTemplate,
        templateKey: SUPPORT_EMAIL.CARD_TERMINATION_REQUESTED,
        req,
    })

    return res.status(200).json({
        status: true,
        message: 'Card termination requested. The card has been frozen and the internal team notified.',
        data: { requestId: created.id, status: CARD_REQUEST_STATUS.PENDING, cardState: CARD_STATE.FROZEN },
        responseCode: '000',
    })
})
