const { pinelabsRequest } = require('./pinelabsGateway')
const { client: redis } = require('./cacheDataMethods')
const { customLog } = require('./loggerHelper')
const {
    PINELABS_SVA_REDEEM_PATH,
    PINELABS_SVA_CANCEL_PATH,
    PINELABS_SVA_REVERSE_PATH,
    PINELABS_SUCCESS_CODE,
    PINELABS_IN_APP_CLIENT_ID,
    svaTransactionIdKey,
} = require('../constants/pinelabs')
const { REDEEM_TIMEOUT_MS } = require('../constants/inAppPayment')

const pad = (n) => String(n).padStart(2, '0')

// Pine Labs wants local wall-clock time with no zone: YYYY-MM-DDTHH:MM:SS.
const dateAtClient = (d = new Date()) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`

// X-Transaction-Id must strictly increase within a batch and fit 14 digits. A Redis counter seeded with epoch
// millis stays monotonic across instances and restarts (a flush re-seeds above the old value); with Redis down
// the clock itself is used, which is still ahead of the counter.
const nextTransactionId = async (logTraceId) => {
    try {
        await redis.set(svaTransactionIdKey, String(Date.now()), { NX: true })
        return Number(await redis.incr(svaTransactionIdKey))
    } catch (error) {
        customLog(logTraceId, 'error', {
            message: '[Pinelabs][SVA] Transaction id counter unavailable — using the clock',
            error: error.message,
        }, 'VENDOR')
        return Date.now()
    }
}

const svaHeaders = (transactionId, logTraceId) => ({
    'X-Transaction-Id': String(transactionId),
    'X-Date-At-Client': dateAtClient(),
    ...(logTraceId ? { 'X-Trace-Id': String(logTraceId) } : {}),
    ...(PINELABS_IN_APP_CLIENT_ID ? { 'X-Client-Id': PINELABS_IN_APP_CLIENT_ID } : {}),
})

// A success carries the receipt at top level and the balance per account. A refused account comes back as
// top-level 10838 "Validation Failed" with the real code per account under errorDetails. `unknown` means the
// outcome was never seen (timeout / no response) and the caller must treat the money as possibly moved.
const normalize = (result, transactionId) => {
    const body = result?.ok
        ? result.data
        : (result?.error && typeof result.error === 'object' ? result.error : null)
    if (!body) {
        return {
            ok: false,
            vendorAnswered: false,
            // No answer, or a 5xx from their edge with no vendor body: the redeem may have gone through.
            unknown: !!result?.noResponse || Number(result?.status) >= 500,
            transactionId,
            batchNumber: null,
            code: null,
            message: typeof result?.error === 'string' ? result.error : 'Vendor unreachable',
            raw: null,
        }
    }
    const details = body.errorDetails || body
    const account = (Array.isArray(details.accounts) && details.accounts[0]) || {}
    const topCode = Number(body.responseCode)
    const accountCode = account.responseCode === undefined ? null : Number(account.responseCode)
    const ok = !!result.ok && topCode === PINELABS_SUCCESS_CODE
    return {
        ok,
        vendorAnswered: true,
        unknown: false,
        transactionId: details.transactionId ?? transactionId,
        batchNumber: details.currentBatchNumber ?? null,
        approvalCode: body.approvalCode ?? account.approvalCode ?? null,
        appUtr: body.appUTR ?? account.appUTR ?? null,
        balance: account.balance === undefined ? null : Number(account.balance),
        code: ok ? PINELABS_SUCCESS_CODE : (accountCode !== null && accountCode !== PINELABS_SUCCESS_CODE ? accountCode : topCode),
        message: ok ? null : (account.responseMessage || body.responseMessage || 'Vendor error'),
        raw: body,
    }
}

const send = async ({ path, label, transactionId, body, creds, req, logTraceId }) => {
    const result = await pinelabsRequest({
        method: 'post',
        path,
        headers: svaHeaders(transactionId, logTraceId),
        body,
        creds,
        req,
        logTraceId,
        label,
        timeout: REDEEM_TIMEOUT_MS,
    })
    return normalize(result, transactionId)
}

// Body shapes are the ones Pine Labs sent for the In-App Debit flow (2026-10-27); nothing beyond them.
// `transactionId` may be pre-allocated by the caller so it is on record before the vendor call: a Reverse after
// a crash needs the original id, and the response may never arrive.
const svaRedeem = async ({ accountNumber, amount, invoiceNumber, transactionId: allocated, creds, req, logTraceId }) => {
    const transactionId = allocated ?? await nextTransactionId(logTraceId)
    return send({
        path: PINELABS_SVA_REDEEM_PATH,
        label: 'SVA redeem',
        transactionId,
        body: { accounts: [{ number: accountNumber, amount }], invoiceNumber, invoiceAmount: amount },
        creds, req, logTraceId,
    })
}

const svaCancel = async ({ accountNumber, amount, invoiceNumber, originalTransactionId, originalBatchNumber, creds, req, logTraceId }) => {
    const transactionId = await nextTransactionId(logTraceId)
    return send({
        path: PINELABS_SVA_CANCEL_PATH,
        label: 'SVA cancel redeem',
        transactionId,
        body: {
            accounts: [{
                originalRequest: {
                    originalTransactionId,
                    originalBatchNumber,
                    originalInvoiceNumber: invoiceNumber,
                    originalAmount: amount,
                },
                number: accountNumber,
                amount,
            }],
        },
        creds, req, logTraceId,
    })
}

// Only for a redeem whose outcome was never seen. Pine Labs matches a reversal on the ORIGINAL X-Transaction-Id.
const svaReverse = async ({ accountNumber, amount, invoiceNumber, originalTransactionId, creds, req, logTraceId }) =>
    send({
        path: PINELABS_SVA_REVERSE_PATH,
        label: 'SVA reverse',
        transactionId: originalTransactionId,
        body: { accounts: [{ number: accountNumber, amount }], invoiceNumber, invoiceAmount: amount },
        creds, req, logTraceId,
    })

module.exports = { svaRedeem, svaCancel, svaReverse, nextTransactionId, dateAtClient }
