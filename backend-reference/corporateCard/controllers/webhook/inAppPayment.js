const asyncHandler = require('../../middlewares/async')
const { customLog } = require('../../utils/loggerHelper')
const { evaluateEligibility } = require('../../services/inAppEligibility')
const { redeemForPayment, cancelForPayment } = require('../../services/inAppPayment')
const { SUCCESS, ERROR, NOT_FOUND } = require('../../constants/responseCodes')
const { IN_APP_STATUS } = require('../../constants/inAppPayment')

const positiveInt = (value) => {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
const positiveAmount = (value) => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) / 100 : null
}
const isMissing = (value) => value === undefined || value === null || value === ''
const reject = (res, message) => res.status(400).json({ status: false, message, data: {}, responseCode: ERROR })
const ok = (res, message, data) => res.status(200).json({ status: true, message, data, responseCode: SUCCESS })
// The paying user's session headers, forwarded by paymentGateway; used only to look the vendor up when the cache is cold.
const forwardedSession = (req) => ({ authorization: req.headers?.authorization, sessionid: req.headers?.sessionid })

exports.eligibility = asyncHandler(async (req, res) => {
    const body = req.body || {}
    const corporateId = positiveInt(body.corporateId)
    const userId = positiveInt(body.userId)
    const amount = isMissing(body.amount) ? null : positiveAmount(body.amount)
    if (!corporateId || !userId || (!isMissing(body.amount) && amount === null)) {
        return reject(res, 'corporateId, userId and a valid amount are required.')
    }
    const { available, reason, card } = await evaluateEligibility({ corporateId, userId, amount })
    return ok(res, available ? 'Card available.' : reason, { available, reason, card })
})

// Always HTTP 200 once authenticated and well-formed: paymentGateway reads data.status, and must never retry a
// redeem on a transport error because the money may already have moved.
exports.redeem = asyncHandler(async (req, res) => {
    const body = req.body || {}
    const paymentRefId = body.paymentRefId ? String(body.paymentRefId).trim() : ''
    const corporateId = positiveInt(body.corporateId)
    const userId = positiveInt(body.userId)
    const amount = positiveAmount(body.amount)
    if (!paymentRefId || paymentRefId.length > 64 || !corporateId || !userId || !amount) {
        customLog(req?.LogTraceId, 'error', {
            message: '[InAppPayment] Rejected a malformed redeem call',
            hasPaymentRef: Boolean(paymentRefId),
            corporateId: body.corporateId ?? null,
            userId: body.userId ?? null,
            amount: body.amount ?? null,
        }, 'CONSOLE')
        return reject(res, 'paymentRefId, corporateId, userId and amount are required.')
    }

    const receipt = await redeemForPayment({
        paymentRefId,
        corporateId,
        userId,
        credentialId: positiveInt(body.credentialId),
        accessKey: body.accessKey ? String(body.accessKey).slice(0, 64) : null,
        amount,
        session: forwardedSession(req),
        logTraceId: req?.LogTraceId,
    })
    const message = receipt.status === IN_APP_STATUS.REDEEMED
        ? 'Payment redeemed from the corporate card.'
        : (receipt.reason || 'Card payment was not completed.')
    return ok(res, message, receipt)
})

exports.cancel = asyncHandler(async (req, res) => {
    const paymentRefId = req.body?.paymentRefId ? String(req.body.paymentRefId).trim() : ''
    if (!paymentRefId) return reject(res, 'paymentRefId is required.')

    const receipt = await cancelForPayment({ paymentRefId, session: forwardedSession(req), logTraceId: req?.LogTraceId })
    if (!receipt) {
        return res.status(404).json({ status: false, message: 'No card payment found for this reference.', data: {}, responseCode: NOT_FOUND })
    }
    const message = receipt.cancelled ? 'Card payment cancelled.' : (receipt.reason || 'Card payment could not be cancelled.')
    return ok(res, message, receipt)
})
