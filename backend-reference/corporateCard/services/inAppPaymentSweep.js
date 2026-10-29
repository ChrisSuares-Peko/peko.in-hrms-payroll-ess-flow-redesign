const { customLog } = require('../utils/loggerHelper')
const { findStale, updateById } = require('../models/use-cases/cardInAppPayment')
const { findCardById } = require('../models/use-cases/cardIssuance')
const { svaReverse } = require('../utils/pinelabsSva')
const { resolveReconcileCreds } = require('../utils/cardOrderReconciler')
const { safeDecrypt, toNum } = require('../utils/cardHelpers')
const {
    IN_APP_STATUS,
    SWEEP_INITIATED_AFTER_MS,
    SWEEP_TIMEOUT_AFTER_MS,
    SWEEP_BATCH,
} = require('../constants/inAppPayment')

const LOG = '[InAppPaymentSweep]'

/**
 * Closes rows the redeem call never closed: a restart between the vendor call and the row update, or a reverse
 * scheduled in-process and lost with it. The transaction id is on the row before the vendor call, so a Reverse is
 * always possible; Pine Labs answers it whether or not the original ever reached them, and the row records what
 * they said. A refused reverse parks the row as CANCEL_FAILED for a human rather than retrying forever.
 */
const sweepStaleInAppPayments = async ({ logTraceId }) => {
    const counters = { scanned: 0, reversed: 0, closed: 0, parked: 0, skipped: 0 }
    const now = Date.now()
    const rows = await findStale({
        initiatedBefore: new Date(now - SWEEP_INITIATED_AFTER_MS),
        timeoutBefore: new Date(now - SWEEP_TIMEOUT_AFTER_MS),
        limit: SWEEP_BATCH,
    })
    if (!rows.length) return counters

    const creds = await resolveReconcileCreds(logTraceId)
    for (const row of rows) {
        counters.scanned += 1
        try {
            const transactionId = toNum(row.vendorTransactionId)
            if (!transactionId) {
                await updateById(row.id, { status: IN_APP_STATUS.FAILED, reason: 'Redeem was never sent' })
                counters.closed += 1
                continue
            }
            const card = await findCardById(row.cardIssuanceId)
            const accountNumber = safeDecrypt(card?.accountNumber)
            if (!creds || !accountNumber) {
                counters.skipped += 1
                continue
            }

            const result = await svaReverse({
                accountNumber,
                amount: Number(row.amount),
                invoiceNumber: row.invoiceNumber,
                originalTransactionId: transactionId,
                creds,
                logTraceId,
            })
            customLog(logTraceId, result.ok ? 'info' : 'error', {
                message: `${LOG} Reverse ${result.ok ? 'done' : 'refused'}`,
                paymentRefId: row.paymentRefId,
                previousStatus: row.status,
                code: result.code,
                responseMessage: result.message,
            }, 'VENDOR')

            if (result.ok) {
                await updateById(row.id, { status: IN_APP_STATUS.REVERSED, reversedAt: new Date(), reason: 'Reversed by sweep' })
                counters.reversed += 1
            } else if (result.vendorAnswered) {
                await updateById(row.id, {
                    status: IN_APP_STATUS.CANCEL_FAILED,
                    reason: `Reverse refused: ${result.message}`,
                    vendorResponseCode: result.code,
                })
                counters.parked += 1
            } else {
                counters.skipped += 1
            }
        } catch (error) {
            customLog(logTraceId, 'error', { message: `${LOG} Row could not be swept`, paymentRefId: row.paymentRefId, error: error?.message }, 'CONSOLE')
            counters.skipped += 1
        }
    }
    return counters
}

module.exports = { sweepStaleInAppPayments }
