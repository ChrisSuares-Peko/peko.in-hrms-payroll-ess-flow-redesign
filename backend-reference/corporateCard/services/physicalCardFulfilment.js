const { customLog } = require('../utils/loggerHelper')
const { findByIdScoped, findByPurchasePaymentRef } = require('../models/use-cases/cardIssuance')
const { findByCorporate: findCorporateApplication } = require('../models/use-cases/corporateCardAdminApplication')
const { resolveReconcileCreds } = require('../utils/cardOrderReconciler')
const { findByCardholderUserId } = require('../models/use-cases/cardholderKyc')
const {
    findByIdScoped: findRequestScoped,
    decideFromPendingCAS,
    finalizeFromProcessingCAS,
} = require('../models/use-cases/cardRequest')
const { CARD_TYPE, CARD_REQUEST_TYPE, CARD_REQUEST_STATUS } = require('../constants/cardRequest')
const { CARD_STATUS, CARD_STATE } = require('../constants/card')
const { toNum, round2, last4 } = require('../utils/cardHelpers')

const LOG_PREFIX = '[PhysicalCardPurchase]'

const fail = (reason, logTraceId, extra = {}) => {
    customLog(logTraceId, 'error', {
        message: `${LOG_PREFIX} paid physical card could not be allocated — the payment stands`,
        reason,
        ...extra,
    }, 'CONSOLE')
    return { recorded: false, reason }
}

const releaseRequest = async (cardRequestId, logTraceId) => {
    try {
        await finalizeFromProcessingCAS(cardRequestId, {
            status: CARD_REQUEST_STATUS.PENDING,
            decidedAt: null,
            decidedByCredentialId: null,
            decisionNote: null,
            result: null,
        })
    } catch (err) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} could not release the originating request`,
            cardRequestId,
            error: err?.message,
        }, 'CONSOLE')
    }
}

/**
 * Allocates a physical card that has been paid for.
 *
 * The card row IS the record of the purchase — `purchasePaymentRefId` carries the payment reference and a
 * unique index on it makes a replayed confirmation a no-op. A row whose issuance later fails drops out of
 * the used count while still counting as purchased, which is what leaves the corporate a free card.
 */
const applyPhysicalCardPurchase = async ({ payload, logTraceId }) => {
    const {
        paymentRefId, corporateId, sourceCardIssuanceId, cardRequestId, shipping, purchasedByCredentialId,
    } = payload

    const existing = await findByPurchasePaymentRef(paymentRefId)
    if (existing) {
        customLog(logTraceId, 'info', {
            message: `${LOG_PREFIX} payment already allocated — ignoring the replay`,
            paymentRefId,
            corporateId,
            cardIssuanceId: existing.id,
        }, 'CONSOLE')
        return {
            recorded: false,
            duplicate: true,
            cardIssuanceId: existing.id,
            confirmed: existing.status === CARD_STATUS.ISSUED,
            cardLast4: last4(existing.maskedCardNumber),
        }
    }

    if (!sourceCardIssuanceId) return fail('NO_SOURCE_CARD', logTraceId, { paymentRefId, corporateId })

    const source = await findByIdScoped(sourceCardIssuanceId, corporateId)
    if (!source || !source.referenceNumber) return fail('SOURCE_UNUSABLE', logTraceId, { paymentRefId, corporateId })
    if (source.status !== CARD_STATUS.ISSUED) return fail('SOURCE_NOT_ACTIVE', logTraceId, { paymentRefId, corporateId })
    if ((source.cardState || CARD_STATE.ACTIVE) !== CARD_STATE.ACTIVE) {
        return fail('SOURCE_FROZEN', logTraceId, { paymentRefId, corporateId })
    }

    const creds = await resolveReconcileCreds(logTraceId)
    if (!creds) return fail('NO_CREDS', logTraceId, { paymentRefId, corporateId })

    const application = await findCorporateApplication(corporateId)
    const cardSchemeId = application?.cardSchemeId
    if (!cardSchemeId) return fail('NO_CARD_SCHEME', logTraceId, { paymentRefId, corporateId })

    const customerName = (source.nameOnCard || '').trim()
    if (!customerName) return fail('NO_CARDHOLDER_NAME', logTraceId, { paymentRefId, corporateId })

    const kyc = await findByCardholderUserId({ corporateId, userId: source.userId })
    const mobile = kyc?.mobileNumber ? String(kyc.mobileNumber) : ''
    if (!mobile) return fail('NO_CARDHOLDER_MOBILE', logTraceId, { paymentRefId, corporateId })

    let requestShipping = null
    if (cardRequestId) {
        const request = await findRequestScoped(cardRequestId, corporateId)
        const belongsHere = request
            && request.requestType === CARD_REQUEST_TYPE.CARD_ISSUANCE
            && request.payload?.cardType === CARD_TYPE.PHYSICAL
            && String(request.cardIssuanceId) === String(sourceCardIssuanceId)
        if (!belongsHere) {
            return fail('REQUEST_UNUSABLE', logTraceId, { paymentRefId, corporateId, cardRequestId })
        }
        requestShipping = request.payload?.shipping ?? null

        const claimed = await decideFromPendingCAS(cardRequestId, {
            status: CARD_REQUEST_STATUS.PROCESSING,
            decidedByCredentialId: purchasedByCredentialId ?? null,
            decidedAt: new Date(),
        })
        if (!claimed) {
            customLog(logTraceId, 'error', {
                message: `${LOG_PREFIX} request was no longer pending — issuing the paid card anyway`,
                paymentRefId,
                corporateId,
                cardRequestId,
                status: request.status,
            }, 'CONSOLE')
        }
    }

    // Required late to avoid a require cycle: pinelabsCardIssuance pulls in the reservation service, which
    // pulls in the quota, which pulls in this module's use-cases.
    const { issueCardCore } = require('../controllers/corporate/pinelabsCardIssuance')
    const enforcedLimit = round2(toNum(source.cardLimit) ?? 0)

    const result = await issueCardCore({
        cardholder: {
            customerName,
            mobile,
            // Inherited from the virtual card this is the physical form of: this webhook has no
            // session to ask the directory, and the lifecycle mails need somewhere to go.
            email: source.email || null,
            userId: source.userId,
            corporateId,
            credentialId: null,
        },
        params: {
            enforcedLimit,
            requestedLimit: enforcedLimit,
            cardType: CARD_TYPE.PHYSICAL,
            shipping: requestShipping || shipping || source.shipping || null,
            sourceReferenceNumber: source.referenceNumber,
            sourceCardIssuanceId: source.id,
            cardRequestId: cardRequestId ?? null,
            purchasePaymentRefId: String(paymentRefId),
            limitFrequency: source.limitFrequency || undefined,
            perTxnLimit: toNum(source.perTxnLimit),
            restrictedCategories: source.restrictedCategories ?? null,
            atmEnabled: Boolean(source.atmEnabled),
        },
        creds,
        cardSchemeId,
        actor: { credentialId: purchasedByCredentialId ?? null, display: 'System (paid order)' },
        logTraceId,
    })

    if (!result?.ok) {
        // The card row may still exist and carry the payment reference — issueCardCore writes it FAILED on
        // a definitive vendor rejection — in which case the corporate keeps the credit and can retry.
        if (cardRequestId) await releaseRequest(cardRequestId, logTraceId)
        return fail(result?.reason || 'ISSUE_REFUSED', logTraceId, {
            paymentRefId,
            corporateId,
            cardIssuanceId: result?.card?.id ?? null,
        })
    }

    if (cardRequestId && result.confirmed !== false) {
        await finalizeFromProcessingCAS(cardRequestId, {
            status: CARD_REQUEST_STATUS.APPROVED,
            result: { issuedCardIssuanceId: result.card?.id ?? null, purchasePaymentRefId: String(paymentRefId) },
        }).catch((err) => {
            customLog(logTraceId, 'error', {
                message: `${LOG_PREFIX} could not close the originating request`,
                paymentRefId,
                corporateId,
                cardRequestId,
                error: err?.message,
            }, 'CONSOLE')
        })
    }

    const cardLast4 = last4(result.card?.maskedCardNumber)

    customLog(logTraceId, 'info', {
        message: `${LOG_PREFIX} paid physical card allocated`,
        paymentRefId,
        corporateId,
        cardIssuanceId: result.card?.id ?? null,
        confirmed: result.confirmed !== false,
        cardLast4,
    }, 'CONSOLE')

    return {
        recorded: true,
        cardIssuanceId: result.card?.id ?? null,
        confirmed: result.confirmed !== false,
        cardLast4,
    }
}

module.exports = { applyPhysicalCardPurchase }
