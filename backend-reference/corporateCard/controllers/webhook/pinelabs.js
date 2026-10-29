const asyncHandler = require('../../middlewares/async')
const { customLog } = require('../../utils/loggerHelper')
const { KYC_STATUS, KYC_CALLBACK_STATUS } = require('../../constants/kyc')
const { CARD_STATUS } = require('../../constants/card')
const { JIT_AUTHORIZATION_STATUS, TRANSACTION_DECISION, TRANSACTION_STATUS, DECLINE_REASON, TRANSACTION_TYPE, REVERSAL_REASON_CODE, REVERSAL_DECLINE_REASON } = require('../../constants/jit')
const { toNum, limitWindowRangeUtc, isRestrictedCategory, isAtmTransaction, cardholderColumnsOf } = require('../../utils/cardHelpers')
const { isVendorBlockedMcc } = require('../../constants/vendorBlockedMcc')
const { upsertByMobileIfNewer } = require('../../models/use-cases/cardholderKyc')
const { findByExternalCardIdentifier, findPhysicalByReferenceNumber, appendDispatches, findCardById } = require('../../models/use-cases/cardIssuance')
const { findByInvoiceNumber: findInAppByInvoice, updateById: updateInAppPayment } = require('../../models/use-cases/cardInAppPayment')
const { IN_APP_MERCHANT_NAME } = require('../../constants/inAppPayment')
const { AUDIT_ACTION, AUDIT_CATEGORY } = require('../../constants/cardLimits')
const { safeAudit } = require('../../utils/cardHelpers')
const {
    MAX_DISPATCHES_PER_CARD,
    dispatchKey,
    toStoredDispatch,
    asRecordArray,
    groupByReference,
} = require('../../utils/cardDispatch')
const { recordAuth, recordNotify, recordRefund, findByTransactionUniqueId, getAuthorizedSpendForCard } = require('../../models/use-cases/cardTransaction')
const { findBySvcCardNumber } = require('../../models/use-cases/corporateCardAdminApplication')
const { createEntry } = require('../../models/use-cases/corporateCardLedger')
const { LEDGER_DIRECTION, LEDGER_ENTRY_TYPE, BALANCE_SYNC } = require('../../constants/ledger')
const { round2, last4 } = require('../../utils/cardHelpers')
const { walletBalance } = require('../../services/walletBalance')
const { syncIssuerBalanceSafely, toBalance } = require('../../services/walletBalanceSync')
const { sendWalletTopupSuccessEmails } = require('../../services/walletTopupEmail')
const { sendPhysicalCardDispatched } = require('../../services/physicalCardEmails')
const { sendCorporateSupportEmailFromWebhook, notifyAdminOfDecline } = require('../../services/supportEmails')
const { walletTopupPendingTemplate } = require('../../utils/supportEmailTemplates')
const { SUPPORT_EMAIL } = require('../../constants/supportEmails')

// F-CC-16: fields masked out of vendor/webhook logs (card data + cardholder PII).
const SENSITIVE_LOG_FIELDS = ['maskedCardNumber', 'cardNumber', 'pan', 'cvv', 'cardViewLink', 'resetPinLink', 'customerSignature', 'mobileNumber', 'mobile', 'email', 'accountNumber', 'approvalCode']

/**
 * Whose wallet this balance belongs to — resolved from the card that transacted, exactly as the
 * transaction row itself is.
 *
 * A corporate has one wallet, so identifying the corporate is the whole job. The transaction row already
 * carries it (stamped from the card issuance at AUTH), and the card is the fallback when it does not: the
 * row's corporateId is null whenever AUTH could not resolve the card, and a stand-in authorisation leaves
 * no row at all — which is precisely when our ledger has drifted and most needs correcting.
 *
 * Deliberately NOT keyed on `transferCardNumber`. That is the funding pool card, and requiring it to match
 * a stored `svcCardNumber` makes the sync silently do nothing whenever it does not — the failure mode being
 * fixed here.
 */
const resolveNotifyWalletOwner = async (req, data, transactionRow) => {
    if (transactionRow?.corporateId) return transactionRow.corporateId

    const externalCardIdentifier = data.cardDetail?.externalCardIdentifier
    const cardIssuance = externalCardIdentifier
        ? await findByExternalCardIdentifier(externalCardIdentifier)
        : null

    if (!cardIssuance?.corporateId) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Pinelabs] JIT NOTIFY could not be attributed to a corporate — wallet not synced',
            transactionUniqueId: data.transactionUniqueId,
            externalCardIdentifier: externalCardIdentifier || null,
            maskedCardNumber: data.cardDetail?.maskedCardNumber || null,
        }, 'VENDOR')
        return null
    }

    return cardIssuance.corporateId
}

/**
 * A refund NOTIFY gets a brand-new row linked to the original debit, instead of mutating it in place —
 * the debit genuinely happened and stays on record exactly as it settled; the refund is a separate,
 * linked credit event (see recordRefund for why). Only reachable once the original AUTH row is found;
 * an unknown transactionUniqueId is acknowledged the same as any other unrecognized NOTIFY.
 */
const processRefundNotify = async (req, data, issuerBalance) => {
    const parent = await findByTransactionUniqueId(data.transactionUniqueId)
    if (!parent) {
        customLog(req?.LogTraceId, 'info', {
            message: '[Pinelabs] JIT NOTIFY refund for an unknown transactionUniqueId — acknowledging anyway',
            transactionUniqueId: data.transactionUniqueId,
        }, 'VENDOR')
        return null
    }

    const refundRow = await recordRefund({
        parent,
        notificationUniqueId: data.notificationUniqueId,
        transactionAmount: data.transactionDetail?.transactionAmount,
        transactionType: data.transactionDetail?.transactionType,
        issuerWalletBalance: issuerBalance,
        rawNotifyPayload: data,
    })

    customLog(req?.LogTraceId, 'info', {
        message: '[Pinelabs] JIT NOTIFY refund received — new refund row created',
        transactionUniqueId: data.transactionUniqueId,
        parentTransactionId: parent.id,
        refundTransactionId: refundRow?.id ?? null,
    }, 'VENDOR')

    return parent
}

const processJitNotify = async (req, data) => {
    if (!data.transactionUniqueId) return

    // transactionType 23 is a refund of an earlier debit, not a reversal — the debit genuinely happened,
    // the merchant is giving the money back afterward. It gets its own row (processRefundNotify), never
    // the reversal path, even if reasonCode (documented as "reason for reversal") is also set.
    const transactionType = data.transactionDetail?.transactionType
    const isRefund = transactionType === TRANSACTION_TYPE.REFUND

    // Pine Labs sends reasonCode: 0 on every NOTIFY, reversal or not — it is never omitted — so its
    // presence alone is not a reversal signal (confirmed against production traffic: a plain
    // transactionType 2 debit arrives with reasonCode 0). Only a genuine, documented reason (1-5) counts.
    const reasonCode = data.transactionDetail?.reasonCode
    const isReversal = !isRefund && (
        transactionType === TRANSACTION_TYPE.REVERSAL
        || (reasonCode !== undefined && reasonCode !== null && Number(reasonCode) > 0)
    )

    const issuerBalance = toBalance(data.transactionDetail?.transferCardBalance)

    let updated
    if (isRefund) {
        updated = await processRefundNotify(req, data, issuerBalance)
    } else {
        const stateFields = isReversal
            ? {
                decision: TRANSACTION_DECISION.DECLINED,
                status: TRANSACTION_STATUS.REVERSED,
                declineReason: REVERSAL_DECLINE_REASON[reasonCode] || REVERSAL_DECLINE_REASON[REVERSAL_REASON_CODE.OTHER],
            }
            : {}

        updated = await recordNotify(data.transactionUniqueId, {
            notificationUniqueId: data.notificationUniqueId,
            transactionAmount: data.transactionDetail?.transactionAmount,
            ...(transactionType !== undefined && transactionType !== null ? { transactionType } : {}),
            ...(issuerBalance !== null ? { issuerWalletBalance: issuerBalance } : {}),
            rawNotifyPayload: data,
            ...stateFields,
        })
        if (!updated) {
            customLog(req?.LogTraceId, 'info', {
                message: '[Pinelabs] JIT NOTIFY for an unknown transactionUniqueId — acknowledging anyway',
                transactionUniqueId: data.transactionUniqueId,
            }, 'VENDOR')
        } else if (isReversal) {
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] JIT NOTIFY reversal received — transaction marked declined',
                transactionUniqueId: data.transactionUniqueId,
                reasonCode,
                declineReason: stateFields.declineReason,
            }, 'VENDOR')
        }
    }

    /**
     * The NOTIFY balance is the post-transaction figure, and the only one we get for a transaction the
     * issuer stood in for. Recording it on the transaction row (above) left the wallet itself untouched,
     * because the wallet is derived from the ledger — so it needs its own correcting entry. Runs even when
     * `updated` is null: no row means we never saw the spend, which is the largest drift there is.
     */
    if (issuerBalance === 0) {
        customLog(req?.LogTraceId, 'info', {
            message: '[Pinelabs] JIT NOTIFY reported a zero issuer balance — wallet not synced',
            action: 'corporateCard:walletSync:skippedZeroBalance',
            transactionUniqueId: data.transactionUniqueId,
            reasonCode,
            transactionType,
        }, 'VENDOR')
    } else if (issuerBalance !== null) {
        const corporateId = await resolveNotifyWalletOwner(req, data, updated)
        if (corporateId) {
            await syncIssuerBalanceSafely({
                corporateId,
                issuerBalance,
                transactionUniqueId: data.transactionUniqueId,
                phase: BALANCE_SYNC.PHASE.NOTIFY,
                logTraceId: req?.LogTraceId,
            })
        }
    }
}

// An in-app redeem's AUTH names no card at all (cardDetail is blank, merchantDetail is null); the only handle in
// it is the invoiceNumber we sent, which is the redeem row created before calling Pine Labs. Seen on UAT 2026-10-27.
const findInAppPaymentForAuth = async (data, logTraceId) => {
    const invoiceNumber = data.transactionDetail?.invoiceNumber
    if (!invoiceNumber) return null
    try {
        const row = await findInAppByInvoice(String(invoiceNumber))
        if (!row) return null
        if (round2(row.amount) !== round2(data.transactionDetail?.transactionAmount)) {
            customLog(logTraceId, 'error', {
                message: '[Pinelabs] JIT AUTH invoice matched an in-app payment with a different amount — not linking',
                invoiceNumber,
                rowAmount: row.amount,
                transactionAmount: data.transactionDetail?.transactionAmount,
            }, 'VENDOR')
            return null
        }
        return row
    } catch (error) {
        customLog(logTraceId, 'error', { message: '[Pinelabs] JIT AUTH in-app lookup failed', invoiceNumber, error: error?.message }, 'VENDOR')
        return null
    }
}

exports.jit = asyncHandler(async (req, res) => {
    const body = req.body || {}
    const data = body?.data || body || {}
    try {

        customLog(req?.LogTraceId, 'info', {
            message: '[Pinelabs] JIT AUTH webhook received',
            event: body?.event,
            clientId: body?.clientId,
            transactionUniqueId: data.transactionUniqueId,
            transactionType: data.transactionDetail?.transactionType,
            transactionAmount: data.transactionDetail?.transactionAmount,
            maskedCardNumber: data.cardDetail?.maskedCardNumber,
            body,
        }, 'VENDOR', SENSITIVE_LOG_FIELDS)

        if (!data.transactionUniqueId) {
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] JIT AUTH missing transactionUniqueId — declining',
                contentType: req?.headers?.['content-type'] || null,
                contentLength: req?.headers?.['content-length'] || null,
                bodyKeys: Object.keys(body),
            }, 'VENDOR')
            return res.status(200).json({
                authorizationStatus: JIT_AUTHORIZATION_STATUS.DECLINED,
                authorizationTransactionId: '',
                responseMessage: 'Malformed request: transactionUniqueId is required',
            })
        }

        const externalCardIdentifier = data.cardDetail?.externalCardIdentifier
        const inAppPayment = externalCardIdentifier ? null : await findInAppPaymentForAuth(data, req?.LogTraceId)
        const cardIssuance = externalCardIdentifier
            ? await findByExternalCardIdentifier(externalCardIdentifier)
            : (inAppPayment ? await findCardById(inAppPayment.cardIssuanceId) : null)
        const transactionAmount = Number(data.transactionDetail?.transactionAmount)
        const issuerBalance = toBalance(data.transactionDetail?.transferCardBalance)

        let decision = TRANSACTION_DECISION.AUTHORIZED
        let declineReason = null
        let ourBalance = null

        if (!Number.isFinite(transactionAmount) || transactionAmount <= 0) {
            decision = TRANSACTION_DECISION.DECLINED
            declineReason = 'Invalid transaction amount'
        } else if (isVendorBlockedMcc(data.merchantDetail?.mcc)) {
            decision = TRANSACTION_DECISION.DECLINED
            declineReason = DECLINE_REASON.VENDOR_BLOCKED_MCC
        } else if (!cardIssuance) {
            decision = TRANSACTION_DECISION.DECLINED
            declineReason = DECLINE_REASON.CARD_NOT_RECOGNIZED
        } else if (cardIssuance.status !== CARD_STATUS.ISSUED) {
            decision = TRANSACTION_DECISION.DECLINED
            declineReason = DECLINE_REASON.CARD_NOT_LIVE
        } else if (cardIssuance.cardState === 'FROZEN') {
            decision = TRANSACTION_DECISION.DECLINED
            declineReason = DECLINE_REASON.CARD_FROZEN
        } else if (isAtmTransaction(data.transactionDetail?.transactionMode) && !cardIssuance.atmEnabled) {
            decision = TRANSACTION_DECISION.DECLINED
            declineReason = DECLINE_REASON.ATM_DISABLED
        } else if (isRestrictedCategory(cardIssuance.restrictedCategories, data.merchantDetail?.mcc)) {
            decision = TRANSACTION_DECISION.DECLINED
            declineReason = DECLINE_REASON.RESTRICTED_MERCHANT_CATEGORY
        } else {
            const perTxnLimit = toNum(cardIssuance.perTxnLimit)
            const cardLimit = toNum(cardIssuance.cardLimit)

            if (perTxnLimit !== null && transactionAmount > perTxnLimit) {
                decision = TRANSACTION_DECISION.DECLINED
                declineReason = DECLINE_REASON.OVER_PER_TXN_LIMIT
            } else if (cardLimit !== null) {
                const { windowStart, windowEnd } = limitWindowRangeUtc(cardIssuance.limitFrequency)
                const spentSoFar = await getAuthorizedSpendForCard({ cardIssuanceId: cardIssuance.id, windowStart, windowEnd })
                if (spentSoFar + transactionAmount > cardLimit) {
                    decision = TRANSACTION_DECISION.DECLINED
                    declineReason = DECLINE_REASON.OVER_PERIOD_LIMIT
                }
            }

            if (decision === TRANSACTION_DECISION.AUTHORIZED) {
                ourBalance = await walletBalance({ corporateId: cardIssuance.corporateId })
                const spendable = issuerBalance === null
                    ? ourBalance
                    : Math.min(ourBalance, issuerBalance)
                if (spendable < transactionAmount) {
                    decision = TRANSACTION_DECISION.DECLINED
                    declineReason = DECLINE_REASON.INSUFFICIENT_WALLET_BALANCE
                }
            }
        }

        if (decision === TRANSACTION_DECISION.DECLINED) {
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] JIT AUTH declined',
                transactionUniqueId: data.transactionUniqueId,
                externalCardIdentifier,
                invoiceNumber: data.transactionDetail?.invoiceNumber || null,
                declineReason,
            }, 'VENDOR')
            // Not awaited: the authorisation answer goes back to Pine Labs first, the mail follows.
            notifyAdminOfDecline({ cardIssuance, declineReason, logTraceId: req?.LogTraceId })
        }

        await recordAuth({
            transactionUniqueId: data.transactionUniqueId,
            externalCardIdentifier: externalCardIdentifier || null,
            referenceNumber: data.cardDetail?.referenceNumber || null,
            cardIssuanceId: cardIssuance?.id || null,
            corporateId: cardIssuance?.corporateId || null,
            ...cardholderColumnsOf(cardIssuance),
            transactionType: data.transactionDetail?.transactionType,
            transactionMode: data.transactionDetail?.transactionMode,
            transactionAmount: data.transactionDetail?.transactionAmount,
            merchantName: data.merchantDetail?.merchantName || (inAppPayment ? IN_APP_MERCHANT_NAME : null),
            merchantCategoryCode: data.merchantDetail?.mcc || null,
            merchantCity: data.merchantDetail?.city || null,
            decision,
            declineReason,
            issuerWalletBalance: issuerBalance,
            rawAuthPayload: data,
        })

        if (inAppPayment) {
            try {
                await updateInAppPayment(inAppPayment.id, { jitTransactionUniqueId: data.transactionUniqueId })
            } catch (error) {
                customLog(req?.LogTraceId, 'error', {
                    message: '[Pinelabs] Could not link the JIT AUTH to the in-app payment',
                    paymentRefId: inAppPayment.paymentRefId,
                    error: error?.message,
                }, 'VENDOR')
            }
        }

        try {
            await syncIssuerBalanceSafely({
                corporateId: cardIssuance?.corporateId,
                issuerBalance,
                transactionUniqueId: data.transactionUniqueId,
                logTraceId: req?.LogTraceId,
            })
        } catch (error) {
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] Wallet balance sync threw — answering the authorisation regardless',
                transactionUniqueId: data.transactionUniqueId,
                error: error?.message,
            }, 'VENDOR')
        }

        const authorized = decision === TRANSACTION_DECISION.AUTHORIZED
        return res.status(200).json({
            authorizationStatus: authorized ? JIT_AUTHORIZATION_STATUS.AUTHORIZED : JIT_AUTHORIZATION_STATUS.DECLINED,
            authorizationTransactionId: String(data.transactionUniqueId),
            responseMessage: authorized ? 'Approved' : declineReason,
        })
    } catch (error) {
        // F-CC-07: fail closed — any error declines, never a 500 that could let the issuer stand-in approve.
        customLog(req?.LogTraceId, 'error', { message: '[Pinelabs] JIT AUTH handler error — declining', transactionUniqueId: data?.transactionUniqueId, error: error?.message }, 'VENDOR')
        return res.status(200).json({
            authorizationStatus: JIT_AUTHORIZATION_STATUS.DECLINED,
            authorizationTransactionId: String(data?.transactionUniqueId || ''),
            responseMessage: 'Declined',
        })
    }
})
exports.kyc = asyncHandler(async (req, res) => {
    const body = req.body || {}
    const { mobileNumber, kycType, status, reason, updatedOn, additionalInfo } = body

    const safeBody = { ...body }
    delete safeBody.kycDetail

    customLog(req?.LogTraceId, 'info', {
        message: '[Pinelabs] KYC callback received',
        endpoint: req.originalUrl,
        kycType,
        status,
        hasKycDetail: !!body.kycDetail,
        body: safeBody,
    }, 'VENDOR', SENSITIVE_LOG_FIELDS)

    const isAccepted = status === KYC_CALLBACK_STATUS.ACCEPTED
    const isRejected = status === KYC_CALLBACK_STATUS.REJECTED

    if (!mobileNumber || (!isAccepted && !isRejected)) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Pinelabs] KYC callback missing mobileNumber/status',
            endpoint: req.originalUrl,
            mobilePresent: !!mobileNumber,
            status,
            isArray: Array.isArray(body),
            bodyKeys: Array.isArray(body) ? Object.keys(body[0] || {}) : Object.keys(body),
            body: safeBody,
        }, 'VENDOR', SENSITIVE_LOG_FIELDS)
        return res.status(200).json({ status: true, message: 'Acknowledged', data: {}, responseCode: '000' })
    }

    const { applied } = await upsertByMobileIfNewer(mobileNumber, {
        kycType,
        kycStatus: isAccepted ? KYC_STATUS.COMPLETED : KYC_STATUS.REJECTED,
        reason: reason || null,
        customerSignature: additionalInfo?.customerSignature,
        lastEventAt: updatedOn,
        provider: 'PINEPERKS',
        rawResponse: safeBody,
    })

    if (!applied) {
        customLog(req?.LogTraceId, 'info', {
            message: '[Pinelabs] KYC callback ignored — event older than the stored status',
            mobileNumber: String(mobileNumber),
            updatedOn,
        }, 'VENDOR', SENSITIVE_LOG_FIELDS)
        return res.status(200).json({ status: true, message: 'Acknowledged', data: {}, responseCode: '000' })
    }

    customLog(req?.LogTraceId, 'info', {
        message: '[Pinelabs] Cardholder KYC status updated',
        mobileNumber: String(mobileNumber),
        kycStatus: isAccepted ? KYC_STATUS.COMPLETED : KYC_STATUS.REJECTED,
    }, 'VENDOR', SENSITIVE_LOG_FIELDS)

    return res.status(200).json({ status: true, message: 'KYC notification processed', data: {}, responseCode: '000' })
})

exports.callback = asyncHandler(async (req, res) => {
    const body = req.body || {}

    customLog(req?.LogTraceId, 'info', {
        message: '[Pinelabs] JIT NOTIFY (callback) received',
        endpoint: req.originalUrl,
        transactionUniqueId: body.transactionUniqueId,
        body,
    }, 'VENDOR', SENSITIVE_LOG_FIELDS)

    await processJitNotify(req, body)
    return res.status(200).json({ status: true, message: 'Acknowledged', data: {}, responseCode: '000' })
})

exports.walletTopup = asyncHandler(async (req, res) => {
    const body = req.body || {}
    const cards = Array.isArray(body.cards) ? body.cards : []

    customLog(req?.LogTraceId, 'info', {
        message: '[Pinelabs] Wallet top-up (SVC reload) webhook received',
        endpoint: req.originalUrl,
        transactionId: body.transactionId,
        transactionType: body.transactionType,
        batchNumber: body.currentBatchNumber,
        cardCount: cards.length,
    }, 'VENDOR')

    let posted = 0
    let hardFailure = false
    const creditsByCorporate = new Map()

    for (let i = 0; i < cards.length; i += 1) {
        const card = cards[i] || {}
        const svc = card.cardNumber ? String(card.cardNumber).trim() : ''
        const amount = round2(Number(card.transactionAmount))
        const cardLast4 = last4(svc)

        if (Number(card.responseCode) !== 0) {
            customLog(req?.LogTraceId, 'info', {
                message: '[Pinelabs] Reload card not successful — skipped',
                transactionId: body.transactionId, cardLast4, responseCode: card.responseCode, responseMessage: card.responseMessage,
            }, 'VENDOR')
            // The corporate transferred the money and will not see it land. Tell them before they ask.
            const failedFor = svc ? await findBySvcCardNumber(svc) : null
            if (failedFor) {
                await sendCorporateSupportEmailFromWebhook({
                    corporateId: failedFor.corporateId,
                    template: walletTopupPendingTemplate,
                    templateKey: SUPPORT_EMAIL.WALLET_TOPUP_PENDING,
                    logTraceId: req?.LogTraceId,
                })
            }
            continue
        }
        if (!svc || !Number.isFinite(amount) || amount <= 0) {
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] Reload card missing card number / amount — skipped',
                transactionId: body.transactionId, cardLast4,
            }, 'CONSOLE')
            continue
        }

        const application = await findBySvcCardNumber(svc)
        if (!application) {
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] Reload — no corporate found for SVC card number',
                transactionId: body.transactionId, cardLast4,
            }, 'CONSOLE')
            continue
        }

        const refId = String(card.callbackResponseInsertId || card.invoiceNumber || `${body.transactionId}:${card.approvalCode || i}`)
        const occurred = card.transactionDateTime ? new Date(card.transactionDateTime) : new Date()

        try {
            const entry = await createEntry({
                corporateId: application.corporateId,
                entryType: LEDGER_ENTRY_TYPE.TOPUP,
                direction: LEDGER_DIRECTION.IN,
                amount,
                description: `SVC card reload${cardLast4 ? ` (•••• ${cardLast4})` : ''}`,
                reference: card.invoiceNumber || card.approvalCode || null,
                refType: 'PINELABS_RELOAD',
                refId,
                occurredAt: Number.isNaN(occurred.getTime()) ? new Date() : occurred,
                createdByCredentialId: null,
                metadata: {
                    transactionId: body.transactionId,
                    approvalCode: card.approvalCode || body.approvalCode || null,
                    batchNumber: body.currentBatchNumber || null,
                    cardLast4,
                },
            })
            posted += 1
            if (entry?.wasCreated) {
                const key = String(application.corporateId)
                const agg = creditsByCorporate.get(key) || { corporateId: application.corporateId, credits: [] }
                agg.credits.push({ amount, cardLast4, reference: card.invoiceNumber || card.approvalCode || null })
                creditsByCorporate.set(key, agg)
            }
        } catch (err) {
            hardFailure = true
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] Reload — failed to record ledger credit',
                transactionId: body.transactionId, cardLast4, error: err?.message,
            }, 'CONSOLE')
        }
    }

    // Only freshly created ledger entries email the customer — a redelivered webhook re-posts nothing,
    // so it re-sends nothing either.
    if (creditsByCorporate.size) {
        await sendWalletTopupSuccessEmails({ creditsByCorporate, logTraceId: req?.LogTraceId })
    }

    customLog(req?.LogTraceId, 'info', {
        message: '[Pinelabs] Wallet top-up processed', transactionId: body.transactionId, posted, total: cards.length, hardFailure,
    }, 'VENDOR')

    if (hardFailure) return res.status(500).json({ status: false, message: 'Retry', data: {}, responseCode: '001' })
    return res.status(200).json({ status: true, message: 'Acknowledged', data: {}, responseCode: '000' })
})

// The dispatch payload carries the cardholder's name, mobile and postal address — masked in logs.
const CARD_NOTIFICATION_MASK_FIELDS = [
    'accountNumber', 'cardViewLink', 'maskedCardNumber', 'cardNumber', 'pan', 'cvv', 'approvalCode', 'InstrumentNumber',
    'customerName', 'mobileNumber', 'addressLine1', 'addressLine2', 'pinCode',
]

/**
 * Physical card dispatched from the printer to the cardholder.
 *
 * The body is a root-level ARRAY, and its entries need not belong to the same card: each names its card
 * by referenceNumber. Records are grouped per card so one card takes one write, then appended to that
 * card's `dispatches` array — skipping any it already holds, since a webhook is delivered at least once.
 *
 * Status codes are the retry contract. A record we cannot place (unparseable, or naming a card that is
 * not ours) is acknowledged 200: redelivery would fail identically. Only a write that failed answers
 * 500, because that one is worth retrying.
 */
exports.cardNotification = asyncHandler(async (req, res) => {
    const records = asRecordArray(req.body)
    const { groups, invalid } = groupByReference(records)

    // Error level when nothing usable arrived at all — an empty body, or a shape whose records name no
    // card. Both mean a contract mismatch that no redelivery will fix, so it has to be visible.
    customLog(req?.LogTraceId, groups.size ? 'info' : 'error', {
        message: '[Pinelabs] Physical card dispatch notification received',
        endpoint: req.originalUrl,
        contentType: req.headers?.['content-type'] ?? null,
        received: records.length,
        cards: groups.size,
        unusable: invalid.length,
        body: req.body,
    }, 'VENDOR', CARD_NOTIFICATION_MASK_FIELDS)

    const receivedAt = new Date()
    // capped is carried so the parts add up to `received`; without it a cap drop vanishes from the
    // acknowledgement and the arithmetic silently stops balancing.
    const summary = { received: records.length, stored: 0, duplicates: 0, capped: 0, unmatched: 0, unusable: invalid.length }
    let failed = 0

    for (const [referenceNumber, group] of groups) {
        try {
            const card = await findPhysicalByReferenceNumber(referenceNumber)
            if (!card) {
                summary.unmatched += group.length
                customLog(req?.LogTraceId, 'error', {
                    message: '[Pinelabs] Dispatch notification names no physical card of ours',
                    referenceNumber,
                    offered: group.length,
                    records: group,
                }, 'VENDOR', CARD_NOTIFICATION_MASK_FIELDS)
                continue
            }

            const result = await appendDispatches(
                card.id,
                group.map((record) => toStoredDispatch(record, receivedAt)),
                { keyOf: dispatchKey, max: MAX_DISPATCHES_PER_CARD, logTraceId: req?.LogTraceId }
            )
            if (!result) {
                summary.unmatched += group.length
                continue
            }

            summary.stored += result.added
            summary.duplicates += result.duplicates
            summary.capped += result.capped

            customLog(req?.LogTraceId, 'info', {
                message: '[Pinelabs] Dispatch recorded against card',
                cardIssuanceId: card.id,
                corporateId: card.corporateId,
                userId: card.userId,
                referenceNumber,
                offered: group.length,
                added: result.added,
                duplicates: result.duplicates,
                capped: result.capped,
                total: result.total,
                records: group,
            }, 'VENDOR', CARD_NOTIFICATION_MASK_FIELDS)

            if (result.capped) {
                customLog(req?.LogTraceId, 'error', {
                    message: '[Pinelabs] Dispatch history is at its cap — records dropped',
                    cardIssuanceId: card.id,
                    referenceNumber,
                    dropped: result.capped,
                    cap: MAX_DISPATCHES_PER_CARD,
                }, 'VENDOR')
            }

            if (result.added) {
                const latest = group[group.length - 1]
                // Only on a genuinely new dispatch — a redelivered webhook adds nothing and mails nothing.
                await sendPhysicalCardDispatched({
                    to: card.email,
                    nameOnCard: card.nameOnCard,
                    shipping: card.shipping,
                    courierPartner: latest?.courierPartnerName,
                    awbNumber: latest?.awbNumber,
                    cardIssuanceId: card.id,
                    logTraceId: req?.LogTraceId,
                })
                await safeAudit(req?.LogTraceId, {
                    corporateId: card.corporateId,
                    ...cardholderColumnsOf(card),
                    cardIssuanceId: card.id,
                    action: AUDIT_ACTION.CARD_DISPATCHED,
                    category: AUDIT_CATEGORY.LIFECYCLE,
                    actorCredentialId: null,
                    actorDisplay: 'Pine Labs',
                    title: 'Physical card dispatched',
                    description: `Dispatched via ${latest?.courierPartnerName || 'the courier'}${latest?.awbNumber ? ` (AWB ${latest.awbNumber})` : ''}.`,
                    metadata: {
                        referenceNumber,
                        awbNumber: latest?.awbNumber ?? null,
                        courierPartnerName: latest?.courierPartnerName ?? null,
                        dispatchedOn: latest?.dispatchedOn ?? null,
                        recorded: result.added,
                    },
                })
            }
        } catch (err) {
            failed += 1
            customLog(req?.LogTraceId, 'error', {
                message: '[Pinelabs] Dispatch notification could not be stored',
                referenceNumber,
                offered: group.length,
                records: group,
                error: err?.message,
            }, 'VENDOR', CARD_NOTIFICATION_MASK_FIELDS)
        }
    }

    customLog(req?.LogTraceId, failed ? 'error' : 'info', {
        message: failed
            ? '[Pinelabs] Dispatch notification refused — some records could not be stored'
            : '[Pinelabs] Dispatch notification processed',
        endpoint: req.originalUrl,
        cards: groups.size,
        failedCards: failed,
        ...summary,
        responseStatus: failed ? 500 : 200,
    }, 'VENDOR')

    // Anything unstored because a write failed must be retried, so the whole delivery is refused.
    if (failed) {
        return res.status(500).json({
            status: false,
            message: 'Some dispatch notifications could not be stored.',
            data: { ...summary, failed },
            responseCode: '001',
        })
    }

    return res.status(200).json({ status: true, message: 'Acknowledged', data: summary, responseCode: '000' })
})
