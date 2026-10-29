const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { GENERIC_ERROR, SELF_ADMIN_DENIED } = require('../../constants/messages')
const { CARD_TYPE } = require('../../constants/cardRequest')
const { CARD_STATE, CARD_STATUS } = require('../../constants/card')
const { LIMIT_FREQUENCY, FREQUENCY_OPTIONS, AUDIT_ACTION, AUDIT_CATEGORY } = require('../../constants/cardLimits')
const { findMerchantCategory } = require('../../constants/merchantCategories')
const { issueCardCore } = require('./pinelabsCardIssuance')
const { buildShipping } = require('./cardRequests')
const { resolvePinelabsCredsForRequest } = require('../../utils/pinelabsGateway')
const { resolveCardBaseLimit, resolveCardUnitPrice } = require('../../utils/cardQuota')
const { findCardUserScoped } = require('../../models/use-cases/cardUser')
const { findByIdScoped, applyLimit } = require('../../models/use-cases/cardIssuance')
const { findByCorporate: findCorporateApplication } = require('../../models/use-cases/corporateCardAdminApplication')
const { serializeCard } = require('../../utils/serializeCard')
const { round2, toNum, actorCredentialId, actorDisplay, isSubAdminSelfTarget, isProtectedOwnerTarget, safeAudit, fmt, cardholderColumnsOfDirectoryRow, cardholderColumnsOf, rowCardholderIdentity} = require('../../utils/cardHelpers')

const MAX_LIMIT = 9999999999.99

exports.issueCardByAdmin = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const { userId, cardLimit, frequency, perTxnLimit, restrictedCategories, atmEnabled, nameOnCard } = req.body || {}

    if (userId === undefined || userId === null || !/^\d+$/.test(String(userId).trim())) {
        return next(new ErrorResponse('A valid member is required.', 400))
    }
    const limitNum = Number(cardLimit)
    if (!Number.isFinite(limitNum) || limitNum <= 0) return next(new ErrorResponse('A valid card limit is required.', 400))
    if (limitNum > MAX_LIMIT) return next(new ErrorResponse('Card limit is too large.', 400))

    const freq = frequency || LIMIT_FREQUENCY.MONTHLY
    if (!FREQUENCY_OPTIONS.includes(freq)) return next(new ErrorResponse('Invalid limit frequency.', 400))

    let perTxnNum = null
    if (perTxnLimit !== undefined && perTxnLimit !== null && perTxnLimit !== '') {
        perTxnNum = Number(perTxnLimit)
        if (!Number.isFinite(perTxnNum) || perTxnNum <= 0) return next(new ErrorResponse('A valid per-transaction limit is required.', 400))
        if (perTxnNum > limitNum) return next(new ErrorResponse('Per-transaction limit cannot exceed the card limit.', 400))
    }

    let restricted = null
    if (restrictedCategories !== undefined) {
        if (!Array.isArray(restrictedCategories)) return next(new ErrorResponse('restrictedCategories must be an array.', 400))
        const resolved = restrictedCategories.map((name) => findMerchantCategory(name))
        if (resolved.some((c) => !c)) return next(new ErrorResponse('One or more restricted categories are invalid.', 400))
        restricted = resolved
    }
    const atm = atmEnabled === undefined ? undefined : Boolean(atmEnabled)

    if (isSubAdminSelfTarget(req, String(userId).trim())) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }
    const holder = await findCardUserScoped({ userId: String(userId).trim(), req })
    if (!holder) return next(new ErrorResponse('Cardholder not found.', 404))
    if (await isProtectedOwnerTarget(req, holder.id)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }

    const customerName = (typeof nameOnCard === 'string' && nameOnCard.trim() ? nameOnCard.trim() : holder.name) || ''

    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))
    const application = await findCorporateApplication(corporateId)
    const cardSchemeId = application?.cardSchemeId
    if (!cardSchemeId) {
        customLog(req?.LogTraceId, 'error', { message: '[AdminCardIssue] Card scheme id not configured (per-corporate or vendor.optional3)' }, 'VENDOR')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    const spendControls = {
        limitFrequency: freq,
        ...(perTxnNum !== null ? { perTxnLimit: round2(perTxnNum) } : {}),
        ...(restricted !== null ? { restrictedCategories: restricted } : {}),
        ...(atm !== undefined ? { atmEnabled: atm } : {}),
    }

    const result = await issueCardCore({
        cardholder: {
            customerName,
            mobile: holder.mobileNo,
            email: holder.email,
            ...cardholderColumnsOfDirectoryRow(holder),
            corporateId,
            credentialId: null,
        },
        params: { enforcedLimit: round2(limitNum), requestedLimit: round2(limitNum), cardType: CARD_TYPE.VIRTUAL, ...spendControls },
        creds,
        cardSchemeId,
        actor: { credentialId: actorCredentialId(req), display: actorDisplay(req) },
        logTraceId: req?.LogTraceId,
        req,
    })

    if (!result.ok) return next(new ErrorResponse(result.message, result.statusCode))

    if (result.confirmed === false) {
        return res.status(200).json({
            status: true,
            message: 'Card issuance is being processed. The card will show as Pending until the issuer confirms it.',
            data: { card: serializeCard(result.card), confirmed: false, controlsApplied: true },
            responseCode: '000',
        })
    }

    const fields = { cardLimit: round2(limitNum), ...spendControls }

    let card = result.card
    let controlsApplied = true
    try {
        card = await applyLimit(result.card.id, fields, actorCredentialId(req))
    } catch (firstErr) {
        try {
            card = await applyLimit(result.card.id, fields, actorCredentialId(req))
        } catch (retryErr) {
            controlsApplied = false
            customLog(req?.LogTraceId, 'error', {
                message: '[AdminCardIssue] Card issued but controls not applied (card is live at cardLimit with default controls)',
                cardIssuanceId: result.card.id,
                error: retryErr?.message,
            }, 'CONSOLE')
            card = (await findByIdScoped(result.card.id, corporateId)) || result.card
        }
    }

    return res.status(200).json({
        status: true,
        message: controlsApplied
            ? 'Card issued.'
            : 'Card issued, but the spend controls could not be applied. Please set them from Manage card.',
        data: { card: serializeCard(card), confirmed: true, controlsApplied },
        responseCode: '000',
    })
})

exports.issuePhysicalCardByAdmin = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const source = await findByIdScoped(req.params.cardIssuanceId, corporateId)
    if (!source) return next(new ErrorResponse('Card not found.', 404))
    if (isSubAdminSelfTarget(req, rowCardholderIdentity(source))
        || await isProtectedOwnerTarget(req, source.userId)) {
        return next(new ErrorResponse(SELF_ADMIN_DENIED, 403))
    }
    if (source.status !== CARD_STATUS.ISSUED) {
        return next(new ErrorResponse('You can only order a physical card for an active card.', 400))
    }
    if ((source.cardState || CARD_STATE.ACTIVE) !== CARD_STATE.ACTIVE) {
        return next(new ErrorResponse('You cannot order a physical card for a frozen card.', 400))
    }
    if (source.cardType === CARD_TYPE.PHYSICAL) {
        return next(new ErrorResponse('This card is already a physical card.', 400))
    }
    if (!source.referenceNumber) {
        return next(new ErrorResponse('The source card is missing a vendor reference; a physical card cannot be issued.', 400))
    }

    const built = buildShipping(req.body || {})
    if (built.error) return next(new ErrorResponse(built.error, 400))
    const { shipping } = built

    const holder = await findCardUserScoped({ cardholder: rowCardholderIdentity(source), req })
    if (!holder) {
        return next(new ErrorResponse('Cardholder not found — the member may have been removed or no longer has Corporate Cards access.', 404))
    }

    const { error, statusCode, creds, serviceDetails } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))
    const application = await findCorporateApplication(corporateId)
    const cardSchemeId = application?.cardSchemeId
    if (!cardSchemeId) {
        customLog(req?.LogTraceId, 'error', { message: '[AdminCardIssue] Card scheme id not configured (per-corporate or vendor.optional3)' }, 'VENDOR')
        return next(new ErrorResponse(GENERIC_ERROR, 500))
    }

    const enforcedLimit = round2(toNum(source.cardLimit) ?? 0)
    const result = await issueCardCore({
        cardholder: {
            customerName: (holder.name || '').trim(),
            mobile: holder.mobileNo,
            email: holder.email,
            ...cardholderColumnsOf(source),
            corporateId,
            credentialId: null,
        },
        params: {
            enforcedLimit,
            requestedLimit: enforcedLimit,
            cardType: CARD_TYPE.PHYSICAL,
            shipping,
            sourceReferenceNumber: source.referenceNumber,
            sourceCardIssuanceId: source.id,
            limitFrequency: source.limitFrequency || undefined,
            perTxnLimit: toNum(source.perTxnLimit),
            restrictedCategories: source.restrictedCategories ?? null,
            atmEnabled: Boolean(source.atmEnabled),
        },
        creds,
        cardSchemeId,
        baseLimit: resolveCardBaseLimit(serviceDetails),
        unitPrice: resolveCardUnitPrice(serviceDetails),
        actor: { credentialId: actorCredentialId(req), display: actorDisplay(req) },
        logTraceId: req?.LogTraceId,
        req,
    })

    if (!result.ok) return next(new ErrorResponse(result.message, result.statusCode))

    const confirmed = result.confirmed !== false
    await safeAudit(req?.LogTraceId, {
        corporateId,
        ...cardholderColumnsOf(source),
        cardIssuanceId: result.card.id,
        action: confirmed ? AUDIT_ACTION.CARD_ISSUED : AUDIT_ACTION.CARD_ISSUE_PROCESSING,
        category: AUDIT_CATEGORY.LIFECYCLE,
        actorCredentialId: actorCredentialId(req),
        actorDisplay: actorDisplay(req),
        title: confirmed ? 'Physical card issued' : 'Physical card order placed — awaiting issuer confirmation',
        description: confirmed
            ? `Issued a physical companion card for the cardholder (limit ₹${fmt(enforcedLimit)}).`
            : `Ordered a physical companion card for the cardholder (limit ₹${fmt(enforcedLimit)}); awaiting confirmation from the issuer.`,
        metadata: { sourceCardIssuanceId: source.id, cardIssuanceId: result.card.id },
    })

    return res.status(200).json({
        status: true,
        message: confirmed
            ? 'Physical card issued.'
            : 'The physical card order has been placed. It will show as Pending until the issuer confirms it.',
        data: { card: serializeCard(result.card), confirmed },
        responseCode: '000',
    })
})
