const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { resolvePinelabsCredsForRequest } = require('../../utils/pinelabsGateway')
const { reconcileConfig, rememberReconcileCreds, reconcileOne } = require('../../utils/cardOrderReconciler')
const { findByIdScoped, findCardById, scheduleReconcile } = require('../../models/use-cases/cardIssuance')
const { serializeCard } = require('../../utils/serializeCard')
const { actorCredentialId, actorDisplay } = require('../../utils/cardHelpers')
const { CARD_STATUS } = require('../../constants/card')
const { RECONCILE_RESULT } = require('../../constants/cardReconcile')

exports.reconcileCardOrder = asyncHandler(async (req, res, next) => {
    const corporateId = req.user?.corporateId
    if (!corporateId) return next(new ErrorResponse('Corporate context is missing.', 400))

    const card = await findByIdScoped(req.params.cardIssuanceId, corporateId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))

    if (card.status !== CARD_STATUS.PENDING) {
        return res.status(200).json({
            status: true,
            message: 'Card status is already up to date.',
            data: { confirmed: card.status === CARD_STATUS.ISSUED, issuanceStatus: card.status, card: serializeCard(card) },
            responseCode: '000',
        })
    }

    const { delayMinutes } = reconcileConfig()
    const ageMs = Date.now() - new Date(card.createdAt).getTime()
    if (ageMs < delayMinutes * 60 * 1000) {
        return next(new ErrorResponse(
            'This card was requested recently. Its status is checked automatically in a few minutes.',
            409
        ))
    }

    const { error, statusCode, creds } = await resolvePinelabsCredsForRequest(req)
    if (error) return next(new ErrorResponse(error, statusCode))
    await rememberReconcileCreds(creds)

    await scheduleReconcile(card.id, { delaySeconds: 0 })
    const { result } = await reconcileOne(card.id, {
        creds,
        actor: { credentialId: actorCredentialId(req), display: actorDisplay(req) },
        logTraceId: req?.LogTraceId,
    })

    const fresh = (await findCardById(card.id)) || card
    let message = 'The card issuance is still being processed. Please check again later.'
    if (result === RECONCILE_RESULT.ISSUED) message = 'Card issuance confirmed.'
    else if (result === RECONCILE_RESULT.FAILED) message = 'The card could not be issued. You can raise the request again.'

    return res.status(200).json({
        status: true,
        message,
        data: {
            confirmed: fresh.status === CARD_STATUS.ISSUED,
            issuanceStatus: fresh.status,
            card: serializeCard(fresh),
        },
        responseCode: '000',
    })
})
