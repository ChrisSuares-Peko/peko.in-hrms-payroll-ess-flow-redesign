const { customLog } = require('../utils/loggerHelper')
const { createInitiated, findByPaymentRefId, findById, updateById } = require('../models/use-cases/cardInAppPayment')
const { findRecentAuthorizedForCard } = require('../models/use-cases/cardTransaction')
const { findCardById } = require('../models/use-cases/cardIssuance')
const { svaRedeem, svaCancel, svaReverse, nextTransactionId } = require('../utils/pinelabsSva')
const { resolveReconcileCreds, rememberReconcileCreds } = require('../utils/cardOrderReconciler')
const { pinelabsCredsFromService, DEFAULT_ACCESS_KEY } = require('../utils/pinelabsGateway')
const { findServiceOperatorByAccessKey } = require('../utils/checkAndFetchServiceDetails')
const { safeDecrypt, round2, toNum } = require('../utils/cardHelpers')
const { evaluateEligibility } = require('./inAppEligibility')
const { sendInAppDebitSuccess, sendInAppDebitFailure, sendInAppDebitRefund } = require('./inAppPaymentEmails')
const { IN_APP_STATUS, REVERSE_DELAY_MS, JIT_LINK_WINDOW_MS, INVOICE_PREFIX } = require('../constants/inAppPayment')
const { PINELABS_SVA_CANCEL_WINDOW_CODE } = require('../constants/pinelabs')

const LOG = '[InAppPayment]'
const NO_CREDS = 'Card payments are not configured'

const receiptOf = (row, extra = {}) => ({
    paymentRefId: row.paymentRefId,
    status: row.status,
    reason: row.reason || null,
    amount: Number(row.amount),
    cardIssuanceId: toNum(row.cardIssuanceId),
    invoiceNumber: row.invoiceNumber || null,
    transactionId: toNum(row.vendorTransactionId),
    batchNumber: toNum(row.vendorBatchNumber),
    approvalCode: row.approvalCode || null,
    appUtr: row.appUtr || null,
    balanceAfter: toNum(row.balanceAfter),
    vendorResponseCode: toNum(row.vendorResponseCode),
    jitTransactionUniqueId: toNum(row.jitTransactionUniqueId),
    ...extra,
})

// Pine Labs caps invoiceNumber at 15 chars, so the row id stands in for the (longer) paymentRefId.
const invoiceNumberFor = (id) => `${INVOICE_PREFIX}${String(id).padStart(10, '0')}`

// Vendor credentials: the cache first, then the paying user's own entitlement lookup through the session headers
// paymentGateway forwarded. The internal route has no session of its own, so the lookup is shaped as the
// corporate's own request, which is exactly what the card dashboard would send. Refills the cache on success.
const resolveVendorCreds = async ({ corporateId, session, logTraceId }) => {
    const cached = await resolveReconcileCreds(logTraceId)
    if (cached) return cached
    if (!session?.authorization || !session?.sessionid || !corporateId) return null
    try {
        const asCorporate = {
            originalUrl: `/api/v1/corporate/${corporateId}/corporate-cards/in-app`,
            headers: { authorization: session.authorization, sessionid: session.sessionid },
            user: { corporateId },
            LogTraceId: logTraceId,
        }
        const operator = await findServiceOperatorByAccessKey(DEFAULT_ACCESS_KEY, asCorporate)
        const creds = pinelabsCredsFromService(operator)
        if (creds) await rememberReconcileCreds(creds)
        return creds
    } catch (error) {
        customLog(logTraceId, 'error', { message: `${LOG} Vendor lookup through the session failed`, corporateId, error: error?.message }, 'VENDOR')
        return null
    }
}

// The JIT handler links the AUTH by our invoiceNumber while the redeem call is still open; this only fills the
// gap when that did not happen.
const linkJitAuth = async (row, logTraceId) => {
    try {
        const fresh = await findById(row.id)
        if (fresh?.jitTransactionUniqueId) return fresh
        const auth = await findRecentAuthorizedForCard({
            cardIssuanceId: row.cardIssuanceId,
            amount: Number(row.amount),
            since: new Date(Date.now() - JIT_LINK_WINDOW_MS),
        })
        if (!auth) return row
        return await updateById(row.id, { jitTransactionUniqueId: auth.transactionUniqueId })
    } catch (error) {
        customLog(logTraceId, 'error', { message: `${LOG} Could not link the JIT AUTH`, paymentRefId: row.paymentRefId, error: error.message }, 'CONSOLE')
        return row
    }
}

// A redeem whose answer never arrived may still have gone through; Pine Labs' rule is to reverse it after a
// pause rather than retry. Fire-and-forget: a restart inside the pause leaves the row at TIMEOUT for a sweep.
const reverseLater = ({ row, accountNumber, creds, logTraceId }) => {
    setTimeout(async () => {
        try {
            const result = await svaReverse({
                accountNumber,
                amount: Number(row.amount),
                invoiceNumber: row.invoiceNumber,
                originalTransactionId: toNum(row.vendorTransactionId),
                creds,
                logTraceId,
            })
            customLog(logTraceId, result.ok ? 'info' : 'error', {
                message: `${LOG} Reverse after timeout`,
                paymentRefId: row.paymentRefId,
                code: result.code,
                responseMessage: result.message,
            }, 'VENDOR')
            if (result.ok) await updateById(row.id, { status: IN_APP_STATUS.REVERSED, reversedAt: new Date(), reason: 'Reversed after timeout' })
        } catch (error) {
            customLog(logTraceId, 'error', { message: `${LOG} Reverse after timeout threw`, paymentRefId: row.paymentRefId, error: error.message }, 'CONSOLE')
        }
    }, REVERSE_DELAY_MS)
}

const redeemForPayment = async ({ paymentRefId, corporateId, userId, credentialId, accessKey, amount, session, logTraceId }) => {
    const existing = await findByPaymentRefId(paymentRefId)
    if (existing) return receiptOf(existing, { duplicate: true })

    const eligibility = await evaluateEligibility({ corporateId, userId, amount })
    if (!eligibility.available) {
        customLog(logTraceId, 'info', { message: `${LOG} Redeem declined before the vendor`, paymentRefId, corporateId, userId, amount, reason: eligibility.reason }, 'VENDOR')
        return { paymentRefId, status: IN_APP_STATUS.DECLINED, reason: eligibility.reason, amount: round2(amount), card: eligibility.card, duplicate: false }
    }

    const creds = await resolveVendorCreds({ corporateId, session, logTraceId })
    if (!creds) {
        customLog(logTraceId, 'error', { message: `${LOG} No vendor credentials — redeem refused`, paymentRefId }, 'VENDOR')
        return { paymentRefId, status: IN_APP_STATUS.FAILED, reason: NO_CREDS, amount: round2(amount), duplicate: false }
    }

    const row = await createInitiated({
        corporateId,
        cardIssuanceId: eligibility.cardRow.id,
        userId,
        credentialId: credentialId ?? null,
        paymentRefId,
        accessKey: accessKey ?? null,
        amount: round2(amount),
    })
    if (!row.wasCreated) return receiptOf(row, { duplicate: true })
    const invoiceNumber = invoiceNumberFor(row.id)
    // Both are on the row before the vendor call: the AUTH is matched on the invoice, a sweep reverses on the id.
    const transactionId = await nextTransactionId(logTraceId)
    await updateById(row.id, { invoiceNumber, vendorTransactionId: transactionId })
    customLog(logTraceId, 'info', {
        message: `${LOG} Redeem started`,
        paymentRefId,
        invoiceNumber,
        transactionId,
        cardIssuanceId: row.cardIssuanceId,
        corporateId,
        amount: round2(amount),
    }, 'VENDOR')

    const result = await svaRedeem({ accountNumber: eligibility.accountNumber, amount: round2(amount), invoiceNumber, transactionId, creds, logTraceId })

    if (result.unknown) {
        const updated = await updateById(row.id, { status: IN_APP_STATUS.TIMEOUT, vendorTransactionId: result.transactionId, reason: result.message })
        customLog(logTraceId, 'error', { message: `${LOG} Redeem outcome unknown — reversing after the vendor pause`, paymentRefId, transactionId: result.transactionId }, 'VENDOR')
        reverseLater({ row: updated, accountNumber: eligibility.accountNumber, creds, logTraceId })
        return receiptOf(updated, { duplicate: false })
    }

    if (!result.ok) {
        const updated = await updateById(row.id, {
            status: result.vendorAnswered ? IN_APP_STATUS.DECLINED : IN_APP_STATUS.FAILED,
            reason: result.message,
            vendorResponseCode: result.code,
            vendorTransactionId: result.transactionId,
            vendorBatchNumber: result.batchNumber,
            rawRedeemResponse: result.raw,
        })
        customLog(logTraceId, 'error', { message: `${LOG} Redeem refused`, paymentRefId, code: result.code, responseMessage: result.message }, 'VENDOR')
        if (result.vendorAnswered) {
            sendInAppDebitFailure({ card: eligibility.cardRow, amount: round2(amount), reference: paymentRefId, reason: result.message, logTraceId })
        }
        return receiptOf(updated, { duplicate: false })
    }

    const redeemed = await updateById(row.id, {
        status: IN_APP_STATUS.REDEEMED,
        reason: null,
        vendorResponseCode: result.code,
        vendorTransactionId: result.transactionId,
        vendorBatchNumber: result.batchNumber,
        approvalCode: result.approvalCode,
        appUtr: result.appUtr,
        balanceAfter: result.balance,
        rawRedeemResponse: result.raw,
    })
    customLog(logTraceId, 'info', { message: `${LOG} Redeemed`, paymentRefId, transactionId: result.transactionId, batchNumber: result.batchNumber }, 'VENDOR')
    sendInAppDebitSuccess({ card: eligibility.cardRow, amount: round2(amount), reference: paymentRefId, logTraceId })
    return receiptOf(await linkJitAuth(redeemed, logTraceId), { duplicate: false })
}

const cancelForPayment = async ({ paymentRefId, session, logTraceId }) => {
    const row = await findByPaymentRefId(paymentRefId)
    if (!row) return null
    if (row.status === IN_APP_STATUS.CANCELLED) return receiptOf(row, { duplicate: true, cancelled: true })
    if (![IN_APP_STATUS.REDEEMED, IN_APP_STATUS.CANCEL_FAILED].includes(row.status)) {
        return receiptOf(row, { duplicate: false, cancelled: false, cancellable: false })
    }

    const [creds, card] = await Promise.all([
        resolveVendorCreds({ corporateId: row.corporateId, session, logTraceId }),
        findCardById(row.cardIssuanceId),
    ])
    const accountNumber = safeDecrypt(card?.accountNumber)
    if (!creds || !accountNumber) {
        const updated = await updateById(row.id, { status: IN_APP_STATUS.CANCEL_FAILED, reason: creds ? 'Card account number missing' : NO_CREDS })
        return receiptOf(updated, { duplicate: false, cancelled: false, cancellable: true })
    }

    const result = await svaCancel({
        accountNumber,
        amount: Number(row.amount),
        invoiceNumber: row.invoiceNumber,
        originalTransactionId: toNum(row.vendorTransactionId),
        originalBatchNumber: toNum(row.vendorBatchNumber),
        creds,
        logTraceId,
    })

    if (!result.ok) {
        const updated = await updateById(row.id, { status: IN_APP_STATUS.CANCEL_FAILED, reason: result.message, rawCancelResponse: result.raw })
        customLog(logTraceId, 'error', { message: `${LOG} Cancel refused`, paymentRefId, code: result.code, responseMessage: result.message }, 'VENDOR')
        return receiptOf(updated, { duplicate: false, cancelled: false, cancellable: true, outsideWindow: result.code === PINELABS_SVA_CANCEL_WINDOW_CODE })
    }

    const updated = await updateById(row.id, {
        status: IN_APP_STATUS.CANCELLED,
        reason: null,
        cancelTransactionId: result.transactionId,
        cancelBatchNumber: result.batchNumber,
        cancelledAt: new Date(),
        rawCancelResponse: result.raw,
    })
    customLog(logTraceId, 'info', { message: `${LOG} Cancelled`, paymentRefId, cancelTransactionId: result.transactionId }, 'VENDOR')
    sendInAppDebitRefund({ card, amount: Number(row.amount), reference: paymentRefId, logTraceId })
    return receiptOf(updated, { duplicate: false, cancelled: true })
}

module.exports = { redeemForPayment, cancelForPayment }
