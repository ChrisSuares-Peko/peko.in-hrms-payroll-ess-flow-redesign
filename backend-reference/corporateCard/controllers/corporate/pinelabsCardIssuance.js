const { v4: uuidv4 } = require('uuid')
const { literal } = require('sequelize')
const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const { pinelabsRequest, isPinelabsSuccess } = require('../../utils/pinelabsGateway')
const {
    PINELABS_INSTANT_DIGITAL_CARD_ISSUE_PATH,
    PINELABS_PHYSICAL_CARD_ISSUE_PATH,
    PHYSICAL_CARD_IDENTIFIER,
    PHYSICAL_PIN_MODE,
    PHYSICAL_IS_CONTACTLESS,
} = require('../../constants/pinelabs')
const { KYC_STATUS } = require('../../constants/kyc')
const { CARD_STATUS, UPI_STATUS } = require('../../constants/card')
const { CARD_TYPE, CARD_TYPE_OPTIONS, CARD_REQUEST_TYPE } = require('../../constants/cardRequest')
const { GENERIC_ERROR } = require('../../constants/messages')
const { findByMobile } = require('../../models/use-cases/cardholderKyc')
const {
    findAndCountCardsWithHolder,
    findBlockingIssuance,
    createCard,
    updateCardById,
    scheduleReconcile,
    replaceVirtualCardById,
} = require('../../models/use-cases/cardIssuance')
const { reservePhysicalCardSlot, CardSlotError } = require('../../services/cardSlotReservation')
const { encrypt } = require('../../utils/cardCrypto')
const { classifyIssueOutcome, buildIssuedCardFields, normalizeVendorCard, vendorErrorSummary } = require('../../utils/cardOrderStatus')
const { reconcileConfig, rememberReconcileCreds } = require('../../utils/cardOrderReconciler')
const { ISSUE_OUTCOME, RECONCILE_OUTCOME, ACTIVE_ISSUANCE_INDEX } = require('../../constants/cardReconcile')
const { AUDIT_ACTION, AUDIT_CATEGORY } = require('../../constants/cardLimits')
const { serializeCard } = require('../../utils/serializeCard')
const { getSpendByCard } = require('../../models/use-cases/cardTransaction')
const { findTerminationStatusByCardIds, findOpenRequestStatusByCardIds } = require('../../models/use-cases/cardRequest')
const { findActiveTerminateCardIds } = require('../../models/use-cases/cardRequest')
const { MOBILE_REGEX, safeAudit, parsePaging, currentMonthRangeUtc, attachCardholders, resolveScope, cardholderIdentity, rowBelongsToCardholder } = require('../../utils/cardHelpers')
const { searchCardUserIds } = require('../../utils/sharedDirectory')
const { sendPhysicalCardConfirmed } = require('../../services/physicalCardEmails')
const { sendCorporateSupportEmail } = require('../../services/supportEmails')
const { cardRequestReceivedTemplate } = require('../../utils/supportEmailTemplates')
const { SUPPORT_EMAIL } = require('../../constants/supportEmails')

const SENSITIVE_LOG_FIELDS = ['accountNumber', 'cardViewLink', 'maskedCardNumber', 'cardNumber', 'pan', 'cvv', 'approvalCode', 'InstrumentNumber']

const genId = (prefix) => `${prefix}${uuidv4().replace(/-/g, '')}`

// `req` is optional and only carries the caller's headers to the directory lookup behind the
// "card request received" mail. Paths without one (the purchase webhook) simply do not send it.
const issueCardCore = async ({ cardholder, params = {}, creds, cardSchemeId, baseLimit, unitPrice, actor = {}, logTraceId, req }) => {
    const customerName = (cardholder?.customerName || '').trim()
    const mobile = String(cardholder?.mobile || '')
    const email = cardholder?.email || null
    const { userId, corporateId, credentialId } = cardholder || {}

    if (!customerName || customerName.length > 50) {
        return { ok: false, reason: 'NO_NAME', statusCode: 400, message: 'A valid cardholder name is required.' }
    }
    if (!MOBILE_REGEX.test(mobile)) {
        return { ok: false, reason: 'NO_MOBILE', statusCode: 400, message: 'A valid 10-digit cardholder mobile number is required.' }
    }

    const kyc = await findByMobile(mobile)
    if (kyc?.kycStatus !== KYC_STATUS.COMPLETED) {
        return { ok: false, reason: 'KYC_INCOMPLETE', statusCode: 400, message: 'KYC is not completed for this cardholder.' }
    }

    if (params.cardType !== undefined && !CARD_TYPE_OPTIONS.includes(params.cardType)) {
        return { ok: false, reason: 'INVALID_TYPE', statusCode: 400, message: 'A valid card type is required.' }
    }
    const cardType = params.cardType ?? CARD_TYPE.VIRTUAL
    const isPhysical = cardType === CARD_TYPE.PHYSICAL
    const sourceCardIssuanceId = isPhysical ? (params.sourceCardIssuanceId ?? null) : null

    // Only physical cards draw on the plan allowance; virtual cards are unlimited. An omitted allowance on
    // a physical order means a caller was missed, and a default is how a fail-closed gate becomes
    // fail-open — that has to be loud, not a free card.
    const purchasePaymentRefId = isPhysical ? (params.purchasePaymentRefId ?? null) : null
    const prepaid = Boolean(purchasePaymentRefId)

    if (isPhysical && !prepaid && (baseLimit === undefined || baseLimit === null)) {
        customLog(logTraceId, 'error', {
            message: '[PhysicalCard] Refusing to issue — the caller passed no plan allowance',
            corporateId,
            userId,
        }, 'CONSOLE')
        return { ok: false, reason: 'NO_ALLOWANCE', statusCode: 500, message: GENERIC_ERROR }
    }

    const blocking = await findBlockingIssuance({ cardholder: { userId: userId ?? null }, cardType, sourceCardIssuanceId })
    if (blocking) {
        return {
            ok: false,
            reason: 'PENDING',
            statusCode: 409,
            message: isPhysical
                ? 'A physical card for this card is already in progress or already exists.'
                : 'A card issuance is already in progress for this cardholder.',
            card: blocking,
        }
    }

    try {
        encrypt('probe')
    } catch (err) {
        customLog(logTraceId, 'error', { message: '[Card] Encryption not configured', error: err.message }, 'VENDOR')
        return { ok: false, reason: 'ENCRYPT', statusCode: 500, message: GENERIC_ERROR }
    }

    const externalRequestId = genId('PKREQ')
    const externalCardIdentifier = genId('PKCARD')
    const { delayMinutes, issueTimeoutMs } = reconcileConfig()

    const enforcedLimit = params.enforcedLimit
    const hasEnforced = enforcedLimit !== undefined && enforcedLimit !== null
    const shipping = isPhysical ? (params.shipping || null) : null
    const spendControls = {
        ...(params.limitFrequency ? { limitFrequency: params.limitFrequency } : {}),
        ...(params.perTxnLimit !== undefined && params.perTxnLimit !== null ? { perTxnLimit: params.perTxnLimit } : {}),
        ...(params.restrictedCategories !== undefined && params.restrictedCategories !== null
            ? { restrictedCategories: params.restrictedCategories }
            : {}),
        ...(params.atmEnabled !== undefined ? { atmEnabled: params.atmEnabled } : {}),
    }
    let card
    try {
        const claimFields = {
            corporateId,
            userId: userId ?? null,
            credentialId,
            externalRequestId,
            externalCardIdentifier,
            cardSchemeId,
            cardType,
            sourceCardIssuanceId,
            cardRequestId: params.cardRequestId ?? null,
            requestedLimit: params.requestedLimit ?? null,
            requestReason: params.requestReason ?? null,
            status: CARD_STATUS.PENDING,
            purchasePaymentRefId,
            nameOnCard: params.nameOnCard ?? customerName,
            email,
            reconcileNextAt: literal(`DATE_ADD(NOW(), INTERVAL ${delayMinutes * 60} SECOND)`),
            ...(shipping ? { shipping } : {}),
            ...spendControls,
            ...(hasEnforced
                ? { cardLimit: enforcedLimit, limitFrequency: spendControls.limitFrequency || 'monthly', limitUpdatedAt: new Date(), limitUpdatedByCredentialId: actor.credentialId ?? null }
                : {}),
        }
        card = isPhysical
            ? await reservePhysicalCardSlot({ corporateId, baseLimit, unitPrice, prepaid, fields: claimFields, logTraceId })
            : await createCard(claimFields)
    } catch (err) {
        if (err instanceof CardSlotError) {
            await safeAudit(logTraceId, {
                corporateId,
                userId,
                action: AUDIT_ACTION.CARD_ISSUE_BLOCKED,
                category: AUDIT_CATEGORY.LIFECYCLE,
                actorCredentialId: actor.credentialId ?? null,
                actorDisplay: actor.display || 'System',
                title: 'Physical card order blocked',
                description: err.message,
                metadata: { externalRequestId, ...(err.quota || {}) },
            })
            return {
                ok: false,
                reason: err.statusCode === 402 ? 'PAYMENT_REQUIRED' : 'QUOTA',
                statusCode: err.statusCode,
                message: err.message,
                quota: err.quota,
            }
        }
        const duplicate = err?.name === 'SequelizeUniqueConstraintError'
            && (String(err?.parent?.sqlMessage || '').includes(ACTIVE_ISSUANCE_INDEX)
                || Object.keys(err?.fields || {}).some((f) => String(f).includes('activeIssuance')))
        if (!duplicate) throw err
        customLog(logTraceId, 'error', {
            message: '[Card] Concurrent issuance rejected by the duplicate guard',
            userId,
            cardType,
            sourceCardIssuanceId,
        }, 'CONSOLE')
        return {
            ok: false,
            reason: 'PENDING',
            statusCode: 409,
            message: isPhysical
                ? 'A physical card for this card is already in progress or already exists.'
                : 'A card issuance is already in progress for this cardholder.',
        }
    }

    // The order is on record now, whatever the vendor answers next — this is the acknowledgement.
    if (req) {
        await sendCorporateSupportEmail({
            corporateId,
            template: cardRequestReceivedTemplate,
            templateKey: SUPPORT_EMAIL.CARD_REQUEST_RECEIVED,
            req,
        })
    }

    const digitalBody = { externalRequestId, cardSchemeId, customerName, mobileNumber: Number(mobile), email, amount: 0, externalCardIdentifier }
    const physicalBody = {
        externalRequestId,
        cardSchemeId,
        cardIdentifier: PHYSICAL_CARD_IDENTIFIER,
        pinMode: PHYSICAL_PIN_MODE,
        isContactless: PHYSICAL_IS_CONTACTLESS,
        referenceNumber: params.sourceReferenceNumber != null ? Number(params.sourceReferenceNumber) : null,
        serialNumber: null,
        customerName,
        nameOnCard: shipping?.nameOnCard || customerName,
        address: {
            addressLine1: shipping?.addressLine1,
            addressLine2: shipping?.addressLine2 || undefined,
            city: shipping?.city || undefined,
            state: shipping?.state || undefined,
            pinCode: shipping?.pinCode ? Number(shipping.pinCode) : undefined,
        },
    }
    const result = await pinelabsRequest({
        method: 'post',
        path: isPhysical ? PINELABS_PHYSICAL_CARD_ISSUE_PATH : PINELABS_INSTANT_DIGITAL_CARD_ISSUE_PATH,
        body: isPhysical ? physicalBody : digitalBody,
        creds,
        timeout: issueTimeoutMs,
        logTraceId,
        label: isPhysical ? 'Physical card issue' : 'Instant digital card issue',
    })

    customLog(logTraceId, 'info', {
        message: `[Pinelabs] ${isPhysical ? 'Physical' : 'Digital'} card issue — request + response`,
        request: { path: isPhysical ? PINELABS_PHYSICAL_CARD_ISSUE_PATH : PINELABS_INSTANT_DIGITAL_CARD_ISSUE_PATH, body: isPhysical ? physicalBody : digitalBody },
        responseData: result.data ?? null,
        responseError: result.error ?? null,
        ok: isPinelabsSuccess(result),
    }, 'VENDOR', SENSITIVE_LOG_FIELDS)

    await rememberReconcileCreds(creds)

    const outcome = classifyIssueOutcome(result)
    const cardNoun = isPhysical ? 'Physical card' : 'Virtual card'

    if (outcome.outcome === ISSUE_OUTCOME.DEFINITIVE_FAILURE) {
        await updateCardById(card.id, {
            status: CARD_STATUS.FAILED,
            reconcileOutcome: RECONCILE_OUTCOME.CONFIRMED_FAILED,
            reconcileLastError: vendorErrorSummary(outcome.vendorCode, result.data?.responseMessage ?? result.error),
            reconcileNextAt: null,
        })
        customLog(logTraceId, 'error', {
            message: `[Pinelabs] ${isPhysical ? 'Physical' : 'Instant digital'} card issue rejected before any order was created`,
            responseCode: outcome.vendorCode,
            responseMessage: result.data?.responseMessage,
            reason: outcome.reason,
            error: result.error,
        }, 'VENDOR', SENSITIVE_LOG_FIELDS)
        await safeAudit(logTraceId, {
            corporateId,
            userId,
            cardIssuanceId: card.id,
            action: AUDIT_ACTION.CARD_ISSUE_FAILED,
            category: AUDIT_CATEGORY.LIFECYCLE,
            actorCredentialId: actor.credentialId ?? null,
            actorDisplay: actor.display || 'System',
            title: 'Card issuance failed',
            description: 'The card could not be issued by the vendor.',
            metadata: { externalRequestId, responseCode: outcome.vendorCode },
        })
        return { ok: false, reason: 'VENDOR_FAIL', statusCode: 502, message: GENERIC_ERROR, card }
    }

    if (outcome.outcome === ISSUE_OUTCOME.UNKNOWN) {
        await scheduleReconcile(card.id, {
            delaySeconds: delayMinutes * 60,
            lastError: vendorErrorSummary(outcome.vendorCode, result.data?.responseMessage ?? result.error),
        })
        customLog(logTraceId, 'error', {
            message: `[Pinelabs] ${isPhysical ? 'Physical' : 'Instant digital'} card issue unconfirmed — card kept PENDING for order-status reconciliation`,
            externalRequestId,
            responseCode: outcome.vendorCode,
            reason: outcome.reason,
            error: result.error,
            reconcileInMinutes: delayMinutes,
        }, 'VENDOR', SENSITIVE_LOG_FIELDS)
        await safeAudit(logTraceId, {
            corporateId,
            userId,
            cardIssuanceId: card.id,
            action: AUDIT_ACTION.CARD_ISSUE_PROCESSING,
            category: AUDIT_CATEGORY.LIFECYCLE,
            actorCredentialId: actor.credentialId ?? null,
            actorDisplay: actor.display || 'System',
            title: 'Card issuance in progress',
            description: `${cardNoun} order placed; awaiting confirmation from the issuer.`,
            metadata: { externalRequestId, responseCode: outcome.vendorCode },
        })
        return { ok: true, card, confirmed: false }
    }

    const data = result.data
    const vendorCard = normalizeVendorCard(data)
    const issued = await updateCardById(card.id, {
        status: CARD_STATUS.ISSUED,
        ...buildIssuedCardFields(vendorCard, data),
        upiStatus: UPI_STATUS.PENDING,
        reconcileOutcome: RECONCILE_OUTCOME.CONFIRMED_ISSUED,
        reconcileNextAt: null,
    })

    if (isPhysical && sourceCardIssuanceId) {
        await replaceVirtualCardById(sourceCardIssuanceId)
    }

    if (isPhysical) {
        // The issuer confirmed the order in the same call; the cardholder and address are still in hand.
        await sendPhysicalCardConfirmed({
            to: email,
            nameOnCard: shipping?.nameOnCard || customerName,
            shipping,
            referenceNumber: vendorCard.referenceNumber,
            cardIssuanceId: card.id,
            logTraceId,
        })
    }

    await safeAudit(logTraceId, {
        corporateId,
        userId,
        cardIssuanceId: card.id,
        action: AUDIT_ACTION.CARD_ISSUED,
        category: AUDIT_CATEGORY.LIFECYCLE,
        actorCredentialId: actor.credentialId ?? null,
        actorDisplay: actor.display || 'System',
        title: 'Card issued',
        description: vendorCard.maskedCardNumber
            ? `${cardNoun} issued (•• ${String(vendorCard.maskedCardNumber).slice(-4)})`
            : `${cardNoun} issued`,
        newValue: { status: CARD_STATUS.ISSUED, maskedCardNumber: vendorCard.maskedCardNumber ?? null, ...(hasEnforced ? { cardLimit: enforcedLimit } : {}) },
        metadata: { externalRequestId, orderId: vendorCard.orderId ?? null },
    })

    return { ok: true, card: issued, confirmed: true }
}
exports.issueCardCore = issueCardCore

exports.listCards = asyncHandler(async (req, res, next) => {
    const scope = resolveScope(req)
    if (scope.error) return next(new ErrorResponse(scope.error, 400))

    const { corporateId, cardholder } = scope
    const sessionIdentity = cardholderIdentity(req)
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const type = typeof req.query.type === 'string' ? req.query.type : undefined
    const searchText = typeof req.query.searchText === 'string' ? req.query.searchText : undefined

    const { limit, offset } = parsePaging(req, 20)

    let searchMatchIds
    let searchMatchUserIds
    if (searchText && searchText.trim()) {
        ({ ids: searchMatchIds, userIds: searchMatchUserIds } = await searchCardUserIds({
            searchText: searchText.trim(),
            fields: ['name', 'email'],
            req,
        }))
    }

    const { count, rows } = await findAndCountCardsWithHolder({
        corporateId, status, type, searchText, searchMatchIds, searchMatchUserIds, cardholder, limit, offset,
    })
    await attachCardholders(rows, req)

    const { monthStart, monthEnd } = currentMonthRangeUtc()
    const spendMap = await getSpendByCard({
        corporateId,
        cardIssuanceIds: rows.map((r) => String(r.id)),
        monthStart,
        monthEnd,
    })
    const terminationMap = await findTerminationStatusByCardIds(rows.map((r) => String(r.id)))
    const unfreezeMap = await findOpenRequestStatusByCardIds({
        cardIssuanceIds: rows.map((r) => String(r.id)),
        requestType: CARD_REQUEST_TYPE.UNFREEZE,
    })
    const terminatingIds = new Set(
        (await findActiveTerminateCardIds({ cardIssuanceIds: rows.map((r) => r.id) })).map(String)
    )

    return res.status(200).json({
        status: true,
        message: 'Cards fetched.',
        data: {
            count,
            rows: rows.map((r) => serializeCard(r, {
                includeViewLink: rowBelongsToCardholder(r, sessionIdentity),
               
                spent: spendMap.get(String(r.id)) || 0,
                terminationStatus: terminationMap.get(String(r.id)) || null,
                unfreezeRequestStatus: unfreezeMap.get(String(r.id)) || null,
                terminationRequested: terminatingIds.has(String(r.id)),
            })),
        },
        responseCode: '000',
    })
})

exports.enableUpi = asyncHandler(async (req, res) =>
    res.status(200).json({
        status: true,
        message: 'UPI enablement is currently unavailable.',
        data: { upiStatus: null, walletNumber: null },
        responseCode: '000',
    }))
