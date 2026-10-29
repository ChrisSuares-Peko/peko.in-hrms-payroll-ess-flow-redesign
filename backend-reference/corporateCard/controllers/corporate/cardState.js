const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { pinelabsRequest, isPinelabsSuccess, resolvePinelabsCredsForRequest } = require('../../utils/pinelabsGateway')
const {
    PINELABS_CARD_STATE_UPDATE_PATH,
    PINELABS_ADMIN_CARD_STATE_UPDATE_PATH,
} = require('../../constants/pinelabs')
const {
    CARD_STATUS,
    CARD_STATE,
    VENDOR_CARD_STATE,
    FREEZE_REASON,
    FREEZE_REASON_LABELS,
    FREEZE_ACTOR,
} = require('../../constants/card')
const { AUDIT_ACTION, AUDIT_CATEGORY } = require('../../constants/cardLimits')
const { CARD_REQUEST_TYPE, CARD_REQUEST_STATUS } = require('../../constants/cardRequest')
const { GENERIC_ERROR, SELF_ADMIN_DENIED } = require('../../constants/messages')
const { findByIdScoped: findCardScoped, findCardsByScope, updateCardStateById } = require('../../models/use-cases/cardIssuance')
const {
    hasBlockingTermination,
    resolveActiveByCards,
    resolveByCardholder,
    MEMBERSHIP_HELD_STATUSES,
} = require('../../models/use-cases/cardRequest')
const {
    vendorResponseCode, last4, cardholderActor, safeAudit, MAX_ITEMS_PER_PAGE,
    isCorporateAdmin, isSubAdminSelfTarget, isProtectedOwnerTarget,
    actorCredentialId: resolveActorCredentialId, actorDisplay: resolveActorDisplay, cardholderColumnsOf, rowCardholderIdentity,
    cardholderIdentity, rowBelongsToCardholder} = require('../../utils/cardHelpers')

const FREEZE_REASON_VALUES = Object.values(FREEZE_REASON)

const REACTIVATION_REASON = FREEZE_REASON.OTHERS

const CARDHOLDER = { path: PINELABS_CARD_STATE_UPDATE_PATH, freezeCode: VENDOR_CARD_STATE.CARDHOLDER_BLOCKED }
const ADMIN = { path: PINELABS_ADMIN_CARD_STATE_UPDATE_PATH, freezeCode: VENDOR_CARD_STATE.ADMIN_INACTIVE }

const FREEZE_REASON_NOTE_MAX = 255

const parseFreezeReason = (raw, rawNote, { required }) => {
    if (!required) return { ok: true, reason: null, reasonNote: null }
    const reason = Number(raw)
    if (!FREEZE_REASON_VALUES.includes(reason)) {
        return { ok: false, message: 'A valid reason is required (1 Lost, 2 Stolen, 3 Physical Damage, 4 Others).' }
    }
    const reasonNote = typeof rawNote === 'string' ? rawNote.trim() : ''
    if (reason === FREEZE_REASON.OTHERS && !reasonNote) {
        return { ok: false, message: 'Please enter the reason to freeze the card.' }
    }
    if (reasonNote.length > FREEZE_REASON_NOTE_MAX) {
        return { ok: false, message: `The reason must be ${FREEZE_REASON_NOTE_MAX} characters or fewer.` }
    }
    return { ok: true, reason, reasonNote: reasonNote || null }
}

const TERMINATION_LOCK_MESSAGE = 'This card has a termination request in progress or completed and cannot be frozen or unfrozen.'

const applyCardStateChange = async ({
    card, freeze, reason, reasonNote, isAdmin, actorRole = FREEZE_ACTOR.ADMIN,
    actorCredentialId, actorDisplay, corporateId, creds, logTraceId,
}) => {
    if (card.status !== CARD_STATUS.ISSUED) {
        return { ok: false, id: card.id, statusCode: 400, message: `Only an active card can be ${freeze ? 'frozen' : 'unfrozen'}.` }
    }
    if (await hasBlockingTermination(card.id)) {
        return { ok: false, id: card.id, statusCode: 409, message: TERMINATION_LOCK_MESSAGE }
    }
    const currentState = card.cardState || CARD_STATE.ACTIVE
    if (!isAdmin && currentState === (freeze ? CARD_STATE.FROZEN : CARD_STATE.ACTIVE)) {
        return {
            ok: false,
            id: card.id,
            statusCode: 409,
            message: freeze ? 'This card is already frozen.' : 'This card is not frozen.',
        }
    }
    if (!freeze && !isAdmin) {
        return {
            ok: false,
            id: card.id,
            statusCode: 403,
            message: 'Unfreezing needs your admin\'s approval. Request an unfreeze and they will review it.',
        }
    }
    if (!card.referenceNumber) {
        customLog(logTraceId, 'error', { message: '[CardState] Card has no vendor referenceNumber', cardIssuanceId: card.id }, 'CONSOLE')
        return { ok: false, id: card.id, statusCode: 500, message: GENERIC_ERROR }
    }

    const isReclassification = freeze && isAdmin && currentState === CARD_STATE.FROZEN

    const endpoint = isAdmin ? ADMIN : CARDHOLDER
    const body = { referenceNumber: Number(card.referenceNumber), cardState: freeze ? endpoint.freezeCode : VENDOR_CARD_STATE.ACTIVE }
    if (isAdmin) body.reason = freeze ? reason : REACTIVATION_REASON

    const result = isReclassification ? null : await pinelabsRequest({
        method: 'post',
        path: endpoint.path,
        body,
        creds,
        logTraceId,
        label: freeze ? 'Freeze card' : 'Unfreeze card',
    })

    if (!isReclassification) {
        const vendorCode = vendorResponseCode(result)
        const isAlreadyActiveOnUnfreeze = !freeze && !isPinelabsSuccess(result) && vendorCode === 267

        if (!isPinelabsSuccess(result) && !isAlreadyActiveOnUnfreeze) {
            customLog(logTraceId, 'error', {
                message: `[Pinelabs] Card ${freeze ? 'freeze' : 'unfreeze'} failed`,
                cardIssuanceId: card.id,
                responseCode: vendorCode,
                responseMessage: result.data?.responseMessage,
                error: result.error,
            }, 'VENDOR')
            // Recorded so an admin can see the attempt and why the issuer refused it — the cardholder only
            // ever sees the generic error.
            await safeAudit(logTraceId, {
                corporateId,
                ...cardholderColumnsOf(card),
                cardIssuanceId: card.id,
                action: freeze ? AUDIT_ACTION.CARD_FREEZE_FAILED : AUDIT_ACTION.CARD_UNFREEZE_FAILED,
                category: AUDIT_CATEGORY.SECURITY,
                actorCredentialId,
                actorDisplay,
                title: freeze ? 'Card freeze failed' : 'Card unfreeze failed',
                description: `Card ending ${last4(card.maskedCardNumber)} could not be ${freeze ? 'frozen' : 'unfrozen'}: ${
                    result?.data?.responseMessage || result?.error || 'the card issuer did not confirm the change'
                }`,
                metadata: { responseCode: vendorCode ?? null, responseMessage: result?.data?.responseMessage ?? null },
            })
            return { ok: false, id: card.id, statusCode: 502, message: GENERIC_ERROR }
        }

        if (isAlreadyActiveOnUnfreeze) {
            customLog(logTraceId, 'error', {
                message: '[Pinelabs] Card already active on vendor side; syncing DB state to ACTIVE',
                cardIssuanceId: card.id,
                responseCode: vendorCode,
            }, 'VENDOR')
        }
    }

    if (!freeze && await hasBlockingTermination(card.id)) {
        customLog(logTraceId, 'error', {
            message: '[CardState] Termination committed during unfreeze; keeping card FROZEN (may be active at vendor)',
            cardIssuanceId: card.id,
        }, 'VENDOR')
        return { ok: false, id: card.id, statusCode: 409, terminationLocked: true, message: TERMINATION_LOCK_MESSAGE }
    }

    const newState = freeze ? CARD_STATE.FROZEN : CARD_STATE.ACTIVE
    const reasonLabel = reason ? FREEZE_REASON_LABELS[reason] : null
    const storedNote = freeze ? (reasonNote || null) : null
    try {
        await updateCardStateById(card.id, {
            cardState: newState,
            freezeReason: freeze ? reason : null,
            freezeReasonNote: storedNote,
            frozenByRole: freeze ? (isAdmin ? actorRole : FREEZE_ACTOR.CARDHOLDER) : null,
            stateUpdatedAt: new Date(),
            stateUpdatedByCredentialId: actorCredentialId ?? null,
        })
    } catch (err) {
        customLog(logTraceId, 'error', { message: `[CardState] Failed to persist ${freeze ? 'freeze' : 'unfreeze'} after vendor success`, cardIssuanceId: card.id, error: err?.message }, 'CONSOLE')
        return { ok: false, id: card.id, statusCode: 500, message: GENERIC_ERROR }
    }

    await safeAudit(logTraceId, {
        corporateId,
        ...cardholderColumnsOf(card),
        cardIssuanceId: card.id,
        action: freeze ? AUDIT_ACTION.CARD_FROZEN : AUDIT_ACTION.CARD_UNFROZEN,
        category: AUDIT_CATEGORY.SECURITY,
        actorCredentialId,
        actorDisplay,
        title: freeze ? 'Card frozen' : 'Card unfrozen',
        description: freeze
            ? `Card ending ${last4(card.maskedCardNumber)} was frozen${reasonLabel ? ` (${storedNote ? `${reasonLabel}: ${storedNote}` : reasonLabel})` : ''}`
            : `Card ending ${last4(card.maskedCardNumber)} was unfrozen`,
        oldValue: { cardState: card.cardState || CARD_STATE.ACTIVE },
        newValue: { cardState: newState },
        metadata: freeze
            ? { reason, reasonLabel, reasonNote: storedNote, ...(isReclassification ? { reclassified: true } : {}) }
            : undefined,
    })

    return { ok: true, id: card.id, cardState: newState, maskedCardNumber: card.maskedCardNumber, message: freeze ? 'Card frozen.' : 'Card unfrozen.' }
}

const closeOpenUnfreezeRequests = async ({ corporateId, cardIssuanceIds, req }) => {
    try {
        await resolveActiveByCards({
            corporateId,
            cardIssuanceIds,
            requestType: CARD_REQUEST_TYPE.UNFREEZE,
            fields: {
                status: CARD_REQUEST_STATUS.APPROVED,
                decidedByCredentialId: req.user?.id ?? null,
                decidedAt: new Date(),
                result: { unfrozen: true, viaDirectUnfreeze: true },
            },
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CardState] Could not close the open unfreeze request (card already unfrozen)',
            cardIssuanceIds,
            error: err?.message,
        }, 'CONSOLE')
    }
}

const changeCardState = async ({ req, res, next, freeze }) => {
    const corporateId = req.user?.corporateId
    const { cardIssuanceId } = req.params
    const hasAdminAuthority = isCorporateAdmin(req)

    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const card = await findCardScoped(cardIssuanceId, corporateId)
    if (!card || (!hasAdminAuthority && !rowBelongsToCardholder(card, cardholderIdentity(req)))) {
        return next(new ErrorResponse('Card not found.', 404))
    }

    if (await isProtectedOwnerTarget(req, card.userId)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }

    const isAdmin = hasAdminAuthority && !isSubAdminSelfTarget(req, rowCardholderIdentity(card))

    const parsed = parseFreezeReason(req.body?.reason, req.body?.reasonNote, { required: freeze })
    if (!parsed.ok) return next(new ErrorResponse(parsed.message, 400))

    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const outcome = await applyCardStateChange({
        card,
        freeze,
        reason: parsed.reason,
        reasonNote: parsed.reasonNote,
        isAdmin,
        actorCredentialId: resolveActorCredentialId(req),
        actorDisplay: isAdmin ? resolveActorDisplay(req) : cardholderActor(req),
        corporateId,
        creds,
        logTraceId: req?.LogTraceId,
    })
    if (!outcome.ok) return next(new ErrorResponse(outcome.message, outcome.statusCode || 500))

    if (isAdmin && !freeze) await closeOpenUnfreezeRequests({ corporateId, cardIssuanceIds: [card.id], req })

    return res.status(200).json({
        status: true,
        message: outcome.message,
        data: { id: outcome.id, cardState: outcome.cardState, maskedCardNumber: outcome.maskedCardNumber },
        responseCode: '000',
    })
}

exports.freezeCard = asyncHandler((req, res, next) => changeCardState({ req, res, next, freeze: true }))
exports.unfreezeCard = asyncHandler((req, res, next) => changeCardState({ req, res, next, freeze: false }))

exports.applyCardStateChange = applyCardStateChange

exports.bulkChangeCardState = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const { action } = req.body || {}
    if (action !== 'freeze' && action !== 'unfreeze') {
        return next(new ErrorResponse("`action` must be 'freeze' or 'unfreeze'.", 400))
    }
    const freeze = action === 'freeze'

    const rawIds = Array.isArray(req.body?.cardIds) ? req.body.cardIds : null
    if (!rawIds || rawIds.length === 0) {
        return next(new ErrorResponse('`cardIds` must be a non-empty array.', 400))
    }
    if (rawIds.length > MAX_ITEMS_PER_PAGE) {
        return next(new ErrorResponse(`A maximum of ${MAX_ITEMS_PER_PAGE} cards can be processed at once.`, 400))
    }
    const cardIds = [...new Set(rawIds.map((v) => String(v).trim()).filter(Boolean))]

    const parsed = parseFreezeReason(req.body?.reason, req.body?.reasonNote, { required: freeze })
    if (!parsed.ok) return next(new ErrorResponse(parsed.message, 400))

    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const actorCredentialId = resolveActorCredentialId(req)
    const actorDisplay = resolveActorDisplay(req)
    const expectedState = freeze ? CARD_STATE.ACTIVE : CARD_STATE.FROZEN

    const results = []
    for (const id of cardIds) {
        const card = await findCardScoped(id, corporateId)
        if (!card) {
            results.push({ id, ok: false, skipped: true, message: 'Card not found.' })
            continue
        }
        if (isSubAdminSelfTarget(req, rowCardholderIdentity(card))
            || await isProtectedOwnerTarget(req, card.userId)) {
            results.push({ id, ok: false, skipped: true, message: SELF_ADMIN_DENIED })
            continue
        }
        if (card.status !== CARD_STATUS.ISSUED) {
            results.push({ id, ok: false, skipped: true, message: 'Card is not active.' })
            continue
        }
        if ((card.cardState || CARD_STATE.ACTIVE) !== expectedState) {
            results.push({ id, ok: false, skipped: true, message: freeze ? 'Card is already frozen.' : 'Card is not frozen.' })
            continue
        }
        const outcome = await applyCardStateChange({
            card, freeze, reason: parsed.reason, reasonNote: parsed.reasonNote, isAdmin: true, actorCredentialId, actorDisplay, corporateId, creds, logTraceId: req?.LogTraceId,
        })
        results.push({ id, ok: outcome.ok, skipped: false, message: outcome.message })
    }

    const succeeded = results.filter((r) => r.ok).length
    const skipped = results.filter((r) => r.skipped).length
    const failed = results.length - succeeded - skipped

    if (!freeze && succeeded > 0) {
        await closeOpenUnfreezeRequests({
            corporateId,
            cardIssuanceIds: results.filter((r) => r.ok).map((r) => r.id),
            req,
        })
    }

    return res.status(200).json({
        status: true,
        message: `${succeeded} card${succeeded === 1 ? '' : 's'} ${freeze ? 'frozen' : 'unfrozen'}.`,
        data: { summary: { requested: cardIds.length, succeeded, failed, skipped }, results },
        responseCode: '000',
    })
})

exports.freezeCardholderCards = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const userId = String(req.params.userId || '').trim()
    if (!/^\d+$/.test(userId)) return next(new ErrorResponse('A valid member is required.', 400))

    const cards = await findCardsByScope({ corporateId, userId })

    try {
        await resolveActiveByCards({
            corporateId,
            cardIssuanceIds: cards.map((c) => c.id),
            requestType: CARD_REQUEST_TYPE.UNFREEZE,
            fields: {
                status: CARD_REQUEST_STATUS.REJECTED,
                decidedByCredentialId: resolveActorCredentialId(req),
                decidedAt: new Date(),
                decisionNote: 'Member removed from the corporate',
            },
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[CardState] Could not reject open unfreeze requests for the removed member',
            userId,
            error: err?.message,
        }, 'CONSOLE')
    }

    try {
        const closed = await resolveByCardholder({
            corporateId,
            cardholder: { userId },
            requestType: CARD_REQUEST_TYPE.MEMBERSHIP,
            statuses: MEMBERSHIP_HELD_STATUSES,
            fields: {
                status: CARD_REQUEST_STATUS.CANCELLED,
                decidedByCredentialId: resolveActorCredentialId(req),
                decidedAt: new Date(),
                decisionNote: 'Member removed from the corporate',
            },
        })
        if (closed > 0) {
            customLog(req?.LogTraceId, 'info', {
                message: 'Corporate card membership request closed for a removed member',
                action: 'corporateCard:membership:closedOnRemoval',
                corporateId,
                userId,
                closed,
            }, 'CONSOLE')
        }
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: 'Could not close the membership request for a removed member',
            action: 'corporateCard:membership:closeOnRemovalFailed',
            corporateId,
            userId,
            error: err?.message,
        }, 'CONSOLE')
    }

    const eligible = cards.filter(
        (c) => c.status === CARD_STATUS.ISSUED && (c.cardState || CARD_STATE.ACTIVE) !== CARD_STATE.FROZEN
    )
    if (eligible.length === 0) {
        return res.status(200).json({
            status: true,
            message: 'No active cards to freeze.',
            data: { summary: { requested: 0, succeeded: 0, failed: 0 }, results: [] },
            responseCode: '000',
        })
    }

    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))

    const actorCredentialId = resolveActorCredentialId(req)
    const actorDisplay = resolveActorDisplay(req)
    const results = []
    for (const card of eligible) {
        const outcome = await applyCardStateChange({
            card,
            freeze: true,
            reason: FREEZE_REASON.OTHERS,
            reasonNote: 'Member removed from the corporate',
            isAdmin: true,
            actorRole: FREEZE_ACTOR.SYSTEM,
            actorCredentialId,
            actorDisplay,
            corporateId,
            creds,
            logTraceId: req?.LogTraceId,
        })
        results.push({ id: card.id, ok: outcome.ok, message: outcome.message })
    }

    const succeeded = results.filter((r) => r.ok).length
    const failed = results.length - succeeded
    return res.status(200).json({
        status: true,
        message: `${succeeded} card${succeeded === 1 ? '' : 's'} frozen.`,
        data: { summary: { requested: eligible.length, succeeded, failed }, results },
        responseCode: '000',
    })
})
