const { getValue, setValue } = require('./cacheDataMethods')
const { customLog } = require('./loggerHelper')
const { encrypt, decrypt } = require('./cardCrypto')
const { safeAudit } = require('./cardHelpers')
const { sendPhysicalCardConfirmed } = require('../services/physicalCardEmails')
const {
    pinelabsRequest,
    pinelabsCredsFromService,
    isPinelabsSuccess,
    DEFAULT_ACCESS_KEY,
} = require('./pinelabsGateway')
const {
    normalizeVendorCard,
    classifyOrderStatus,
    buildIssuedCardFields,
    vendorErrorSummary,
    isPreflightFailure,
} = require('./cardOrderStatus')
const { PINELABS_CARD_ORDER_STATUS_PATH } = require('../constants/pinelabs')
const {
    ORDER_VERDICT,
    RECONCILE_OUTCOME,
    RECONCILE_RESULT,
    RECONCILE_DEFAULTS,
    reconcileCredsCacheKey,
    LOG_PREFIX,
} = require('../constants/cardReconcile')
const { CARD_STATUS, UPI_STATUS } = require('../constants/card')
const { CARD_TYPE, CARD_REQUEST_STATUS } = require('../constants/cardRequest')
const { AUDIT_ACTION, AUDIT_CATEGORY } = require('../constants/cardLimits')
const {
    findCardById,
    claimForReconcile,
    releaseReconcileClaim,
    scheduleReconcile,
    finishReconcile,
    findDueForReconcile,
    replaceVirtualCardById,
    restoreReplacedVirtualById,
} = require('../models/use-cases/cardIssuance')
const { finalizeFromProcessingCAS } = require('../models/use-cases/cardRequest')

const SENSITIVE_LOG_FIELDS = ['accountNumber', 'cardViewLink', 'cardLink', 'pinSetLink', 'maskedCardNumber', 'cardNumber', 'pan', 'cvv', 'approvalCode']

let cachedConfig = null

const readInt = (name, fallback, min, max) => {
    const raw = process.env[name]
    if (raw === undefined || raw === '') return fallback
    const n = Number(raw)
    if (!Number.isFinite(n) || n < min || n > max) {
        customLog(null, 'error', {
            message: `${LOG_PREFIX} invalid ${name} — using the default`,
            value: raw,
            fallback,
        }, 'CONSOLE')
        return fallback
    }
    return Math.floor(n)
}

const reconcileConfig = () => {
    if (cachedConfig) return cachedConfig
    const d = RECONCILE_DEFAULTS
    const delayDefault = process.env.NODE_ENV === 'staging' ? d.stagingDelayMinutes : d.delayMinutes
    cachedConfig = {
        delayMinutes: readInt('CARD_ORDER_RECONCILE_DELAY_MINUTES', delayDefault, 1, 1440),
        sweepEnabled: process.env.CARD_ORDER_RECONCILE_SWEEP_ENABLED !== 'false',
        sweepSeconds: readInt('CARD_ORDER_RECONCILE_SWEEP_SECONDS', d.sweepSeconds, 15, 900),
        giveUpHours: readInt('CARD_ORDER_RECONCILE_GIVEUP_HOURS', d.giveUpHours, 1, 240),
        batch: readInt('CARD_ORDER_RECONCILE_BATCH', d.batch, 1, 100),
        leaseSeconds: readInt('CARD_ORDER_RECONCILE_LEASE_SECONDS', d.leaseSeconds, 30, 600),
        maxAttempts: readInt('CARD_ORDER_RECONCILE_MAX_ATTEMPTS', d.maxAttempts, 1, 10),
        statusTimeoutMs: readInt('CARD_ORDER_STATUS_TIMEOUT_MS', d.statusTimeoutMs, 1000, 120000),
        issueTimeoutMs: readInt('CARD_ISSUE_TIMEOUT_MS', d.issueTimeoutMs, 5000, 300000),
        credsTtlSeconds: readInt('CARD_RECONCILE_CREDS_TTL_SECONDS', d.credsTtlSeconds, 3600, 2592000),
        maxAgeDays: d.maxAgeDays,
    }
    return cachedConfig
}

const resetReconcileConfig = () => { cachedConfig = null }

const nextDelaySeconds = () => reconcileConfig().delayMinutes * 60

const rememberReconcileCreds = async (creds, accessKey = DEFAULT_ACCESS_KEY) => {
    if (!creds?.baseUrl || !creds?.username || !creds?.apiKey) return
    const { credsTtlSeconds } = reconcileConfig()
    await setValue(reconcileCredsCacheKey(accessKey), credsTtlSeconds, encrypt(creds))
}

const resolveReconcileCreds = async (logTraceId, accessKey = DEFAULT_ACCESS_KEY) => {
    const stashed = await getValue(reconcileCredsCacheKey(accessKey))
    if (stashed) {
        try {
            const creds = JSON.parse(decrypt(stashed))
            if (creds?.baseUrl && creds?.username && creds?.apiKey) return creds
        } catch (err) {
            customLog(logTraceId, 'error', { message: `${LOG_PREFIX} stashed creds unreadable`, error: err?.message }, 'CONSOLE')
        }
    }
    for (const key of [`cc:internal:so:${accessKey}`, `cc:internal:so:${accessKey}:stale`]) {
        const raw = await getValue(key)
        if (!raw) continue
        try {
            const creds = pinelabsCredsFromService(JSON.parse(raw))
            if (creds) return creds
        } catch (err) {
            customLog(logTraceId, 'error', { message: `${LOG_PREFIX} operator cache unreadable`, key, error: err?.message }, 'CONSOLE')
        }
    }
    return null
}

const fetchOrderStatus = ({ externalRequestId, creds, logTraceId }) =>
    pinelabsRequest({
        method: 'get',
        path: `${PINELABS_CARD_ORDER_STATUS_PATH}${encodeURIComponent(externalRequestId)}`,
        creds,
        timeout: reconcileConfig().statusTimeoutMs,
        suppressErrorLog: true,
        label: 'Card order status',
        logTraceId,
    })

const finalizeRequest = async (card, issued, logTraceId) => {
    if (!card.cardRequestId) return
    try {
        if (issued) {
            await finalizeFromProcessingCAS(card.cardRequestId, {
                status: CARD_REQUEST_STATUS.APPROVED,
                result: { issuedCardIssuanceId: card.id },
            })
            return
        }
        await finalizeFromProcessingCAS(card.cardRequestId, {
            status: CARD_REQUEST_STATUS.PENDING,
            decidedAt: null,
            decidedByCredentialId: null,
            decisionNote: null,
            result: null,
        })
    } catch (err) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} could not finalise the originating request`,
            cardId: card.id,
            cardRequestId: card.cardRequestId,
            error: err?.message,
        }, 'CONSOLE')
    }
}

const applyIssued = async ({ card, classified, actor, logTraceId }) => {
    const vendorCard = normalizeVendorCard(classified.record, classified.order)
    const won = await finishReconcile(card.id, {
        outcome: RECONCILE_OUTCOME.CONFIRMED_ISSUED,
        status: CARD_STATUS.ISSUED,
        fields: {
            ...buildIssuedCardFields(vendorCard, classified.record),
            upiStatus: UPI_STATUS.PENDING,
            vendorOrderStatus: classified.order?.orderStatus ?? null,
            reconcileLastError: null,
        },
    })
    if (!won) return RECONCILE_RESULT.SKIPPED

    if (card.cardType === CARD_TYPE.PHYSICAL) {
        await replaceVirtualCardById(card.sourceCardIssuanceId)
        // The issuer confirmed the order after the fact; the address and email were kept on the row for this.
        await sendPhysicalCardConfirmed({
            to: card.email,
            nameOnCard: card.nameOnCard,
            shipping: card.shipping,
            referenceNumber: vendorCard.referenceNumber,
            cardIssuanceId: card.id,
            logTraceId,
        })
    }
    await safeAudit(logTraceId, {
        corporateId: card.corporateId,
        userId: card.userId,
        cardIssuanceId: card.id,
        action: AUDIT_ACTION.CARD_ISSUED,
        category: AUDIT_CATEGORY.LIFECYCLE,
        actorCredentialId: actor.credentialId ?? null,
        actorDisplay: actor.display || 'System',
        title: 'Card issued',
        description: vendorCard.maskedCardNumber
            ? `Issuance confirmed with the issuer (•• ${String(vendorCard.maskedCardNumber).slice(-4)}).`
            : 'Issuance confirmed with the issuer.',
        newValue: { status: CARD_STATUS.ISSUED, maskedCardNumber: vendorCard.maskedCardNumber ?? null },
        metadata: { externalRequestId: card.externalRequestId, orderId: classified.order?.orderId ?? null, reconciled: true },
    })
    await finalizeRequest(card, true, logTraceId)
    return RECONCILE_RESULT.ISSUED
}

const applyFailed = async ({ card, classified, actor, logTraceId }) => {
    const won = await finishReconcile(card.id, {
        outcome: RECONCILE_OUTCOME.CONFIRMED_FAILED,
        status: CARD_STATUS.FAILED,
        fields: {
            reconcileLastError: classified.reason,
            vendorOrderStatus: classified.order?.orderStatus ?? null,
            lastEventAt: new Date().toISOString(),
        },
    })
    if (!won) return RECONCILE_RESULT.SKIPPED

    if (card.cardType === CARD_TYPE.PHYSICAL) {
        await restoreReplacedVirtualById(card.sourceCardIssuanceId)
    }
    await safeAudit(logTraceId, {
        corporateId: card.corporateId,
        userId: card.userId,
        cardIssuanceId: card.id,
        action: AUDIT_ACTION.CARD_ISSUE_FAILED,
        category: AUDIT_CATEGORY.LIFECYCLE,
        actorCredentialId: actor.credentialId ?? null,
        actorDisplay: actor.display || 'System',
        title: 'Card issuance failed',
        description: 'The issuer confirmed the card could not be issued.',
        metadata: { externalRequestId: card.externalRequestId, reconciled: true },
    })
    await finalizeRequest(card, false, logTraceId)
    return RECONCILE_RESULT.FAILED
}

/**
 * Stop chasing an order and write the card FAILED.
 *
 * This used to leave the card PENDING with reconcileNextAt nulled, which meant nothing could ever pick
 * it up again — the sweep only selects rows with a schedule — so the card sat Pending on screen forever
 * with no retry behind it. A terminal state the admin can act on beats an indefinite one they cannot.
 *
 * Only ever reached AFTER the issuer has been asked and gave no usable answer, so this is not a guess:
 * a definitive ISSUED or FAILED verdict is applied by applyIssued/applyFailed long before here. The
 * residual risk is an order the issuer created but never reported, which is why the reason is kept on
 * the row (reconcileLastError) and logged at error level for follow-up.
 */
const giveUp = async ({ card, reason, logTraceId }) => {
    await finishReconcile(card.id, {
        outcome: RECONCILE_OUTCOME.UNRESOLVED,
        status: CARD_STATUS.FAILED,
        fields: { reconcileLastError: reason },
    })
    customLog(logTraceId, 'error', {
        message: `${LOG_PREFIX} giving up — card written FAILED, no longer PENDING`,
        cardId: card.id,
        corporateId: card.corporateId,
        cardType: card.cardType,
        externalRequestId: card.externalRequestId,
        attempts: card.reconcileAttempts,
        createdAt: card.createdAt,
        reason,
    }, 'CONSOLE')
    return RECONCILE_RESULT.UNRESOLVED
}

const reconcileOne = async (cardId, { creds: providedCreds, actor = {}, logTraceId } = {}) => {
    const { leaseSeconds, maxAttempts, giveUpHours } = reconcileConfig()

    const claimed = await claimForReconcile(cardId, leaseSeconds)
    if (!claimed) return { result: RECONCILE_RESULT.SKIPPED, reason: 'NOT_DUE_OR_CLAIMED_ELSEWHERE' }

    const card = await findCardById(cardId)
    if (!card || card.status !== CARD_STATUS.PENDING) {
        return { result: RECONCILE_RESULT.SKIPPED, reason: 'ALREADY_RESOLVED' }
    }

    const isFinalAttempt = Number(card.reconcileAttempts) >= maxAttempts
    // Age is a backstop on top of the attempt count, because the deferral paths (no creds, preflight
    // failure) hand the attempt back and could defer the same card forever — which is how one ends up
    // Pending for good. It applies ONLY to an answer the issuer actually gave: a thrown status call is
    // our own transport failing, and a card must not be failed for that.
    const ageMs = card.createdAt ? Date.now() - new Date(card.createdAt).getTime() : 0
    const pastGiveUp = ageMs >= giveUpHours * 60 * 60 * 1000
    const answerIsFinal = isFinalAttempt || pastGiveUp

    try {
        const creds = providedCreds || await resolveReconcileCreds(logTraceId)
        if (!creds) {
            customLog(logTraceId, 'error', {
                message: `${LOG_PREFIX} no vendor credentials available — deferring, attempt NOT consumed`,
                cardId,
            }, 'CONSOLE')
            await releaseReconcileClaim(cardId, { delaySeconds: nextDelaySeconds() })
            return { result: RECONCILE_RESULT.DEFERRED, reason: 'NO_CREDS' }
        }

        let sourceReferenceNumber = null
        if (card.cardType === CARD_TYPE.PHYSICAL && card.sourceCardIssuanceId) {
            const source = await findCardById(card.sourceCardIssuanceId)
            sourceReferenceNumber = source?.referenceNumber ?? null
        }

        const result = await fetchOrderStatus({ externalRequestId: card.externalRequestId, creds, logTraceId })

        customLog(logTraceId, 'info', {
            message: `${LOG_PREFIX} order status`,
            cardId,
            cardType: card.cardType,
            attempts: card.reconcileAttempts,
            request: { path: `${PINELABS_CARD_ORDER_STATUS_PATH}${card.externalRequestId}` },
            responseData: result.data ?? null,
            responseError: result.error ?? null,
            ok: isPinelabsSuccess(result),
        }, 'VENDOR', SENSITIVE_LOG_FIELDS)

        if (isPreflightFailure(result)) {
            await releaseReconcileClaim(cardId, { delaySeconds: nextDelaySeconds() })
            return { result: RECONCILE_RESULT.DEFERRED, reason: String(result.error) }
        }

        const classified = classifyOrderStatus(result, {
            externalRequestId: card.externalRequestId,
            externalCardIdentifier: card.externalCardIdentifier,
            sourceReferenceNumber,
        })

        if (classified.alert) {
            customLog(logTraceId, 'error', {
                message: `${LOG_PREFIX} order status needs attention`,
                cardId,
                verdict: classified.verdict,
                reason: classified.reason,
                vendorCode: classified.vendorCode,
            }, 'CONSOLE')
        }

        if (classified.verdict === ORDER_VERDICT.ISSUED) {
            return { result: await applyIssued({ card, classified, actor, logTraceId }), classified }
        }
        if (classified.verdict === ORDER_VERDICT.FAILED) {
            return { result: await applyFailed({ card, classified, actor, logTraceId }), classified }
        }

        // PROCESSING is the issuer stating the order EXISTS and is being created. That is the one answer
        // age must not override: writing FAILED over a live order guarantees an orphan — a real card at
        // the issuer that this system has no record of. It stays on the clock however old it is.
        // Everything else inconclusive ends as FAILED once the bounds are spent, so nothing sits PENDING
        // with no retry behind it.
        if (answerIsFinal && classified.verdict !== ORDER_VERDICT.PROCESSING) {
            return { result: await giveUp({ card, reason: classified.reason, logTraceId }), classified }
        }
        await scheduleReconcile(cardId, {
            delaySeconds: nextDelaySeconds(),
            lastError: classified.reason,
            vendorOrderStatus: classified.order?.orderStatus ?? null,
        })
        return {
            result: classified.verdict === ORDER_VERDICT.PROCESSING
                ? RECONCILE_RESULT.PROCESSING
                : RECONCILE_RESULT.AMBIGUOUS,
            classified,
        }
    } catch (err) {
        customLog(logTraceId, 'error', {
            message: `${LOG_PREFIX} reconcile threw`,
            cardId,
            error: err?.message,
        }, 'CONSOLE')
        if (isFinalAttempt) {
            await giveUp({ card, reason: vendorErrorSummary(NaN, err?.message), logTraceId })
            return { result: RECONCILE_RESULT.UNRESOLVED, reason: 'THREW_ON_FINAL_ATTEMPT' }
        }
        await scheduleReconcile(cardId, {
            delaySeconds: nextDelaySeconds(),
            lastError: vendorErrorSummary(NaN, err?.message),
        })
        return { result: RECONCILE_RESULT.AMBIGUOUS, reason: 'THREW' }
    }
}

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms) })

let sweeping = false

const sweepDueCardOrders = async ({ logTraceId } = {}) => {
    const { batch, maxAgeDays, giveUpHours } = reconcileConfig()
    const counters = {
        scanned: 0, issued: 0, failed: 0, processing: 0, ambiguous: 0, deferred: 0, unresolved: 0, skipped: 0,
    }
    if (sweeping) {
        customLog(logTraceId, 'info', { message: `${LOG_PREFIX} sweep already running — tick skipped`, ...counters, skipped: 'overlap' }, 'CONSOLE')
        return counters
    }
    sweeping = true
    try {
        const due = await findDueForReconcile({ limit: batch, maxAgeDays, giveUpHours })
        counters.scanned = due.length
        for (const row of due) {
            if (row.reconcileNextAt === null || row.reconcileNextAt === undefined) {
                await scheduleReconcile(row.id, { delaySeconds: 0 })
            }
            const { result } = await reconcileOne(row.id, { logTraceId })
            if (result === RECONCILE_RESULT.ISSUED) counters.issued += 1
            else if (result === RECONCILE_RESULT.FAILED) counters.failed += 1
            else if (result === RECONCILE_RESULT.PROCESSING) counters.processing += 1
            else if (result === RECONCILE_RESULT.AMBIGUOUS) counters.ambiguous += 1
            else if (result === RECONCILE_RESULT.DEFERRED) counters.deferred += 1
            else if (result === RECONCILE_RESULT.UNRESOLVED) counters.unresolved += 1
            else counters.skipped += 1
            if (due.length > 1) await sleep(2000)
        }
    } catch (err) {
        customLog(logTraceId, 'error', { message: `${LOG_PREFIX} sweep failed`, error: err?.message }, 'CONSOLE')
    } finally {
        sweeping = false
    }
    if (Object.values(counters).some((count) => count > 0)) {
        customLog(logTraceId, 'info', { message: `${LOG_PREFIX} sweep`, ...counters }, 'CONSOLE')
    }
    return counters
}

const startCardOrderReconcileSweep = () => {
    const { sweepEnabled, sweepSeconds } = reconcileConfig()
    if (!sweepEnabled) {
        customLog(null, 'info', { message: `${LOG_PREFIX} in-process sweep disabled by configuration` }, 'CONSOLE')
        return null
    }
    setTimeout(() => { void sweepDueCardOrders({}) }, 30000).unref()
    const handle = setInterval(() => { void sweepDueCardOrders({}) }, sweepSeconds * 1000)
    handle.unref()
    customLog(null, 'info', { message: `${LOG_PREFIX} in-process sweep started`, sweepSeconds }, 'CONSOLE')
    return handle
}

module.exports = {
    reconcileConfig,
    resetReconcileConfig,
    nextDelaySeconds,
    rememberReconcileCreds,
    resolveReconcileCreds,
    fetchOrderStatus,
    reconcileOne,
    sweepDueCardOrders,
    startCardOrderReconcileSweep,
}
