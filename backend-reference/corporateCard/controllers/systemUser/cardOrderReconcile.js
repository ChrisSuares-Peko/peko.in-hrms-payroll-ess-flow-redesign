const asyncHandler = require('../../middlewares/async')
const ErrorResponse = require('../../utils/error-response')
const { customLog } = require('../../utils/loggerHelper')
const {
    reconcileConfig,
    resolveReconcileCreds,
    reconcileOne,
    sweepDueCardOrders,
} = require('../../utils/cardOrderReconciler')
const { findAndCountStuckIssuances, findCardById, scheduleReconcile } = require('../../models/use-cases/cardIssuance')
const { parsePaging } = require('../../utils/cardHelpers')
const { GENERIC_ERROR } = require('../../constants/messages')
const { LOG_PREFIX, RECONCILE_RESULT } = require('../../constants/cardReconcile')

exports.listStuckIssuances = asyncHandler(async (req, res) => {
    const { limit, offset } = parsePaging(req, 20)
    const { giveUpHours } = reconcileConfig()
    const { count, rows } = await findAndCountStuckIssuances({ limit, offset, giveUpHours })

    return res.status(200).json({
        status: true,
        message: 'Stuck card issuances fetched.',
        data: {
            count,
            rows: rows.map((r) => ({
                id: r.id,
                corporateId: r.corporateId,
                userId: r.userId,
                cardType: r.cardType,
                status: r.status,
                externalRequestId: r.externalRequestId,
                reconcileOutcome: r.reconcileOutcome ?? null,
                reconcileAttempts: r.reconcileAttempts ?? 0,
                vendorOrderStatus: r.vendorOrderStatus ?? null,
                reconcileLastError: r.reconcileLastError ?? null,
                createdAt: r.createdAt,
            })),
        },
        responseCode: '000',
    })
})

exports.forceReconcileIssuance = asyncHandler(async (req, res, next) => {
    const card = await findCardById(req.params.cardIssuanceId)
    if (!card) return next(new ErrorResponse('Card not found.', 404))

    const creds = await resolveReconcileCreds(req?.LogTraceId)
    if (!creds) {
        customLog(req?.LogTraceId, 'error', {
            message: `${LOG_PREFIX} force-reconcile unavailable — vendor credential cache is cold`,
            cardId: card.id,
            hint: 'Any corporate-side issuance or reconcile re-primes the stash.',
        }, 'CONSOLE')
        return next(new ErrorResponse(GENERIC_ERROR, 503))
    }

    await scheduleReconcile(card.id, { delaySeconds: 0 })
    const { result, reason } = await reconcileOne(card.id, {
        creds,
        actor: { credentialId: req.user?.id ?? null, display: 'System user' },
        logTraceId: req?.LogTraceId,
    })
    const fresh = (await findCardById(card.id)) || card

    return res.status(200).json({
        status: true,
        message: result === RECONCILE_RESULT.ISSUED || result === RECONCILE_RESULT.FAILED
            ? 'Card order reconciled.'
            : 'The issuer has not resolved this order yet.',
        data: {
            result,
            reason: reason ?? null,
            issuanceStatus: fresh.status,
            reconcileOutcome: fresh.reconcileOutcome ?? null,
        },
        responseCode: '000',
    })
})

exports.runReconcileSweep = asyncHandler(async (req, res) => {
    const counters = await sweepDueCardOrders({ logTraceId: req?.LogTraceId })
    return res.status(200).json({
        status: true,
        message: 'Reconciliation sweep completed.',
        data: counters,
        responseCode: '000',
    })
})
