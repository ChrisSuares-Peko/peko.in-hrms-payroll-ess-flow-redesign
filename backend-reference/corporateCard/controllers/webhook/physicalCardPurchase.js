const asyncHandler = require('../../middlewares/async')
const { customLog } = require('../../utils/loggerHelper')
const { applyPhysicalCardPurchase } = require('../../services/physicalCardFulfilment')
const { RETRYABLE_REASONS } = require('../../constants/physicalCardPurchase')

const positiveInt = (value) => {
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

exports.recordPhysicalCardPurchase = asyncHandler(async (req, res) => {
    const body = req.body || {}
    const paymentRefId = body.paymentRefId ? String(body.paymentRefId).trim() : ''
    const corporateId = positiveInt(body.corporateId)
    const quantity = positiveInt(body.quantity ?? 1)

    if (!paymentRefId || !corporateId || !quantity) {
        customLog(req?.LogTraceId, 'error', {
            message: '[PhysicalCardPurchase] Rejected a malformed purchase callback',
            hasPaymentRef: Boolean(paymentRefId),
            corporateId: body.corporateId ?? null,
            quantity: body.quantity ?? null,
        }, 'CONSOLE')
        return res.status(400).json({
            status: false,
            message: 'paymentRefId, corporateId and quantity are required.',
            data: {},
            responseCode: '001',
        })
    }

    const result = await applyPhysicalCardPurchase({
        payload: {
            paymentRefId,
            corporateId,
            quantity,
            unitPrice: body.unitPrice,
            amount: body.amount,
            purchasedByCredentialId: positiveInt(body.purchasedByCredentialId),
            userId: body.userId ?? null,
            sourceCardIssuanceId: body.sourceCardIssuanceId ?? null,
            cardRequestId: positiveInt(body.cardRequestId),
            shipping: body.shipping ?? null,
        },
        logTraceId: req?.LogTraceId,
    })

    if (result.recorded || result.duplicate) {
        return res.status(200).json({
            status: true,
            message: result.duplicate ? 'Purchase already allocated.' : 'Purchase allocated.',
            data: result,
            responseCode: '000',
        })
    }

    // 503 invites the caller's retry; anything else would fail identically next time, so say so plainly
    // rather than have paymentGateway hammer it.
    const retryable = RETRYABLE_REASONS.includes(result.reason)
    return res.status(retryable ? 503 : 409).json({
        status: false,
        message: 'The paid physical card could not be allocated.',
        data: result,
        responseCode: '001',
    })
})
