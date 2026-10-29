jest.mock('../pinelabsGateway', () => ({
    ...jest.requireActual('../pinelabsGateway'),
    pinelabsRequest: jest.fn(),
}))
jest.mock('../cardHelpers', () => ({
    ...jest.requireActual('../cardHelpers'),
    safeAudit: jest.fn(),
}))
jest.mock('../../models/use-cases/cardIssuance', () => ({
    findCardById: jest.fn(),
    claimForReconcile: jest.fn(),
    releaseReconcileClaim: jest.fn(),
    scheduleReconcile: jest.fn(),
    finishReconcile: jest.fn(),
    findDueForReconcile: jest.fn(),
    replaceVirtualCardById: jest.fn(),
    restoreReplacedVirtualById: jest.fn(),
}))
jest.mock('../../models/use-cases/cardRequest', () => ({ finalizeFromProcessingCAS: jest.fn() }))

const { pinelabsRequest } = require('../pinelabsGateway')
const {
    findCardById,
    claimForReconcile,
    releaseReconcileClaim,
    scheduleReconcile,
    finishReconcile,
    findDueForReconcile,
    replaceVirtualCardById,
    restoreReplacedVirtualById,
} = require('../../models/use-cases/cardIssuance')
const { finalizeFromProcessingCAS } = require('../../models/use-cases/cardRequest')
const { getValue } = require('../cacheDataMethods')
const {
    reconcileOne,
    sweepDueCardOrders,
    nextDelaySeconds,
    resetReconcileConfig,
    reconcileConfig,
} = require('../cardOrderReconciler')
const { RECONCILE_RESULT, RECONCILE_OUTCOME } = require('../../constants/cardReconcile')

const REQ = 'PKREQaaaa'
const CREDS = { baseUrl: 'https://vendor', username: 'u', apiKey: 'k' }

const ancient = () => new Date(Date.now() - 72 * 3600 * 1000)

const card = (over = {}) => ({
    id: 7,
    corporateId: 42,
    userId: 99,
    status: 'PENDING',
    cardType: 'Virtual',
    externalRequestId: REQ,
    externalCardIdentifier: 'PKCARDaaa',
    reconcileAttempts: 1,
    createdAt: new Date(Date.now() - 60 * 60 * 1000),
    cardRequestId: null,
    sourceCardIssuanceId: null,
    ...over,
})

const processedOk = (records, counts = {}) => ({
    ok: true,
    data: {
        responseCode: 0,
        externalRequestId: REQ,
        orderId: 51177,
        orderStatus: 6,
        totalQuantity: 1,
        successCount: 1,
        failedCount: 0,
        ...counts,
        orderResponseList: records,
    },
})

beforeEach(() => {
    jest.clearAllMocks()
    resetReconcileConfig()
    claimForReconcile.mockResolvedValue(1)
    finishReconcile.mockResolvedValue(1)
    getValue.mockResolvedValue(null)
})

describe('reconcileOne — claiming', () => {
    it('does nothing when another replica already claimed the row', async () => {
        claimForReconcile.mockResolvedValue(0)

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.SKIPPED)
        expect(pinelabsRequest).not.toHaveBeenCalled()
    })

    it('does nothing when the row was resolved between the claim and the read', async () => {
        findCardById.mockResolvedValue(card({ status: 'ISSUED' }))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.SKIPPED)
        expect(pinelabsRequest).not.toHaveBeenCalled()
    })
})

describe('reconcileOne — credentials', () => {
    it('hands the attempt back when no credentials are available', async () => {
        findCardById.mockResolvedValue(card({ reconcileAttempts: 2 }))

        const { result } = await reconcileOne(7, {})

        expect(result).toBe(RECONCILE_RESULT.DEFERRED)
        expect(pinelabsRequest).not.toHaveBeenCalled()
        expect(finishReconcile).not.toHaveBeenCalled()
        expect(releaseReconcileClaim).toHaveBeenCalledWith(7, expect.objectContaining({ delaySeconds: 900 }))
    })

    it('hands the attempt back when the request never left this process', async () => {
        findCardById.mockResolvedValue(card())
        pinelabsRequest.mockResolvedValue({ ok: false, error: 'AUTH_FAILED' })

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.DEFERRED)
        expect(releaseReconcileClaim).toHaveBeenCalled()
        expect(scheduleReconcile).not.toHaveBeenCalled()
    })

    it('falls back to the shared operator cache when the stash is cold', async () => {
        findCardById.mockResolvedValue(card())
        getValue.mockImplementation(async (key) => (key === 'cc:internal:so:corporate_cards'
            ? JSON.stringify({ vendor: { apiUrl: 'https://v', optional1: 'u', optional2: 'k' } })
            : null))
        pinelabsRequest.mockResolvedValue(processedOk([{ responseCode: 0, referenceNumber: 111, externalCardIdentifier: 'PKCARDaaa' }]))

        const { result } = await reconcileOne(7, {})

        expect(result).toBe(RECONCILE_RESULT.ISSUED)
    })
})

describe('reconcileOne — verdicts', () => {
    it('confirms an issued card and clears it from the queue', async () => {
        findCardById.mockResolvedValue(card())
        pinelabsRequest.mockResolvedValue(processedOk([
            { responseCode: 0, referenceNumber: 8381581115, maskedCardNumber: '608363******1386', cardLink: 'https://view', externalCardIdentifier: 'PKCARDaaa' },
        ]))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.ISSUED)
        expect(finishReconcile).toHaveBeenCalledWith(7, expect.objectContaining({
            outcome: RECONCILE_OUTCOME.CONFIRMED_ISSUED,
            status: 'ISSUED',
        }))
        const { fields } = finishReconcile.mock.calls[0][1]
        expect(fields.referenceNumber).toBe(8381581115)
        expect(fields.cardViewLink).toBe('https://view')
    })

    it('calls the status endpoint with OUR externalRequestId, not a reference or card identifier', async () => {
        findCardById.mockResolvedValue(card())
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0, externalRequestId: REQ, orderStatus: 2 } })

        await reconcileOne(7, { creds: CREDS })

        expect(pinelabsRequest).toHaveBeenCalledWith(expect.objectContaining({
            method: 'get',
            path: `/v1/cards/orders/statuses/${REQ}`,
        }))
    })

    it('reschedules a still-processing order instead of resolving it', async () => {
        findCardById.mockResolvedValue(card())
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0, externalRequestId: REQ, orderStatus: 2 } })

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.PROCESSING)
        expect(finishReconcile).not.toHaveBeenCalled()
        expect(scheduleReconcile).toHaveBeenCalled()
    })

    it('marks FAILED only on a processed order whose record failed with corroborating counts', async () => {
        findCardById.mockResolvedValue(card())
        pinelabsRequest.mockResolvedValue(processedOk(
            [{ responseCode: 53, responseMessage: 'Invalid card detail', externalCardIdentifier: 'PKCARDaaa' }],
            { successCount: 0, failedCount: 1 }
        ))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.FAILED)
        expect(finishReconcile).toHaveBeenCalledWith(7, expect.objectContaining({
            outcome: RECONCILE_OUTCOME.CONFIRMED_FAILED,
            status: 'FAILED',
        }))
    })

    // Within its bounds an ambiguous answer still resolves nothing — the vendor may yet confirm the
    // order, so no status is written and the card is asked again.
    it('writes nothing on an ambiguous answer while retries remain', async () => {
        findCardById.mockResolvedValue(card({ createdAt: new Date(), reconcileAttempts: 0 }))
        pinelabsRequest.mockResolvedValue({ ok: false, status: 400, error: { responseCode: 425 } })

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.AMBIGUOUS)
        expect(finishReconcile).not.toHaveBeenCalled()
        expect(scheduleReconcile).toHaveBeenCalled()
    })

    // Past the give-up cut-off it becomes terminal instead of Pending forever.
    it('writes FAILED on an ambiguous answer once the card is past the give-up cut-off', async () => {
        findCardById.mockResolvedValue(card({ createdAt: ancient(), reconcileAttempts: 0 }))
        pinelabsRequest.mockResolvedValue({ ok: false, status: 400, error: { responseCode: 425 } })

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.UNRESOLVED)
        expect(finishReconcile.mock.calls[0][1].status).toBe('FAILED')
    })
})

describe('reconcileOne — the physical/virtual pair', () => {
    it('hides the source virtual only once the plastic is confirmed, and only that row', async () => {
        findCardById.mockImplementation(async (id) => (id === 7
            ? card({ cardType: 'Physical', sourceCardIssuanceId: 10 })
            : card({ id: 10, referenceNumber: 6718937685 })))
        pinelabsRequest.mockResolvedValue(processedOk([{ responseCode: 0, referenceNumber: 6718937685 }]))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.ISSUED)
        expect(replaceVirtualCardById).toHaveBeenCalledWith(10)
    })

    it('gives the virtual card back when the plastic is confirmed to have failed', async () => {
        findCardById.mockImplementation(async (id) => (id === 7
            ? card({ cardType: 'Physical', sourceCardIssuanceId: 10 })
            : card({ id: 10, referenceNumber: 6718937685 })))
        pinelabsRequest.mockResolvedValue(processedOk(
            [{ responseCode: 53, referenceNumber: 6718937685 }],
            { successCount: 0, failedCount: 1 }
        ))

        await reconcileOne(7, { creds: CREDS })

        expect(restoreReplacedVirtualById).toHaveBeenCalledWith(10)
    })

    it('does not touch the source card when another path won the race', async () => {
        finishReconcile.mockResolvedValue(0)
        findCardById.mockImplementation(async (id) => (id === 7
            ? card({ cardType: 'Physical', sourceCardIssuanceId: 10 })
            : card({ id: 10, referenceNumber: 6718937685 })))
        pinelabsRequest.mockResolvedValue(processedOk([{ responseCode: 0, referenceNumber: 6718937685 }]))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.SKIPPED)
        expect(replaceVirtualCardById).not.toHaveBeenCalled()
    })
})

describe('reconcileOne — the originating request', () => {
    it('approves the request once the card is real', async () => {
        findCardById.mockResolvedValue(card({ cardRequestId: 55 }))
        pinelabsRequest.mockResolvedValue(processedOk([{ responseCode: 0, referenceNumber: 1, externalCardIdentifier: 'PKCARDaaa' }]))

        await reconcileOne(7, { creds: CREDS })

        expect(finalizeFromProcessingCAS).toHaveBeenCalledWith(55, expect.objectContaining({ status: 'APPROVED' }))
    })

    it('re-opens the request ONLY when the card is confirmed not to exist', async () => {
        findCardById.mockResolvedValue(card({ cardRequestId: 55 }))
        pinelabsRequest.mockResolvedValue(processedOk(
            [{ responseCode: 53, externalCardIdentifier: 'PKCARDaaa' }],
            { successCount: 0, failedCount: 1 }
        ))

        await reconcileOne(7, { creds: CREDS })

        expect(finalizeFromProcessingCAS).toHaveBeenCalledWith(55, expect.objectContaining({ status: 'PENDING' }))
    })

    it('leaves the request claimed while the answer is still unknown', async () => {
        findCardById.mockResolvedValue(card({ cardRequestId: 55 }))
        pinelabsRequest.mockResolvedValue({ ok: true, data: { responseCode: 0, externalRequestId: REQ, orderStatus: 2 } })

        await reconcileOne(7, { creds: CREDS })

        expect(finalizeFromProcessingCAS).not.toHaveBeenCalled()
    })
})

describe('reconcileOne — exactly two attempts', () => {
    const stillProcessing = () => ({ ok: true, data: { responseCode: 0, externalRequestId: REQ, orderStatus: 2 } })
    // The issuer answered, but the answer settles nothing — classifyOrderStatus calls this AMBIGUOUS.
    const unresolvableStatus = () => ({ ok: false, status: 400, error: { responseCode: 425 } })

    it('reschedules after the FIRST inconclusive answer', async () => {
        findCardById.mockResolvedValue(card({ reconcileAttempts: 1 }))
        pinelabsRequest.mockResolvedValue(stillProcessing())

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.PROCESSING)
        expect(scheduleReconcile).toHaveBeenCalledWith(7, expect.objectContaining({ delaySeconds: 900 }))
        expect(finishReconcile).not.toHaveBeenCalled()
    })

    // Changed deliberately: giving up used to leave the card PENDING with its schedule nulled, so
    // nothing could ever pick it up again and it sat Pending on screen for good. It is now written
    // FAILED — a terminal state an admin can act on — with the reason kept on the row.
    it('gives up after the SECOND inconclusive answer and writes the card FAILED', async () => {
        findCardById.mockResolvedValue(card({ reconcileAttempts: 2 }))
        pinelabsRequest.mockResolvedValue(unresolvableStatus())

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.UNRESOLVED)
        expect(scheduleReconcile).not.toHaveBeenCalled()
        const [, payload] = finishReconcile.mock.calls[0]
        expect(payload.outcome).toBe(RECONCILE_OUTCOME.UNRESOLVED)
        expect(payload.status).toBe('FAILED')
        expect(payload.fields.reconcileLastError).toBeTruthy()
    })

    // The issuer saying the order EXISTS and is being created is the one answer age must not override:
    // failing a live order orphans a real card at the issuer that this system then has no record of.
    it('never fails a card the issuer says is still being created, however old it is', async () => {
        findCardById.mockResolvedValue(card({ createdAt: ancient(), reconcileAttempts: 9 }))
        pinelabsRequest.mockResolvedValue(stillProcessing())

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.PROCESSING)
        expect(finishReconcile).not.toHaveBeenCalled()
        expect(scheduleReconcile).toHaveBeenCalled()
    })

    // A throw is our own transport failing, not an answer. Age must not turn that into a failed card.
    it('never fails on age when the status call itself threw', async () => {
        findCardById.mockResolvedValue(card({ createdAt: ancient(), reconcileAttempts: 1 }))
        pinelabsRequest.mockRejectedValue(new Error('socket hang up'))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.AMBIGUOUS)
        expect(finishReconcile).not.toHaveBeenCalled()
        expect(scheduleReconcile).toHaveBeenCalled()
    })

    it('still resolves on the second attempt when the answer IS conclusive', async () => {
        findCardById.mockResolvedValue(card({ reconcileAttempts: 2 }))
        pinelabsRequest.mockResolvedValue(processedOk([{ responseCode: 0, referenceNumber: 1, externalCardIdentifier: 'PKCARDaaa' }]))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.ISSUED)
    })

    it('age alone never ends the retries — only answered attempts do', async () => {
        findCardById.mockResolvedValue(card({ createdAt: ancient(), reconcileAttempts: 1 }))
        pinelabsRequest.mockResolvedValue(stillProcessing())

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.PROCESSING)
        expect(scheduleReconcile).toHaveBeenCalled()
    })

    it('re-spaces a throwing row by the configured delay, not the short claim lease', async () => {
        findCardById.mockResolvedValue(card({ reconcileAttempts: 1 }))
        pinelabsRequest.mockRejectedValue(new Error('socket hang up'))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.AMBIGUOUS)
        const [, payload] = scheduleReconcile.mock.calls[0]
        expect(payload.delaySeconds).toBe(900)
        expect(payload.delaySeconds).toBeGreaterThan(reconcileConfig().leaseSeconds)
    })

    it('gives up when the final attempt throws', async () => {
        findCardById.mockResolvedValue(card({ reconcileAttempts: 2 }))
        pinelabsRequest.mockRejectedValue(new Error('socket hang up'))

        const { result } = await reconcileOne(7, { creds: CREDS })

        expect(result).toBe(RECONCILE_RESULT.UNRESOLVED)
    })
})

describe('nextDelaySeconds', () => {
    it('is flat, so both calls land inside the vendor 15-30 minute window', () => {
        expect(nextDelaySeconds()).toBe(900)
    })

    it('honours the UAT override', () => {
        process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES = '5'
        resetReconcileConfig()

        expect(nextDelaySeconds()).toBe(300)
        delete process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES
        resetReconcileConfig()
    })

    it('allows at most two status calls per order by default', () => {
        expect(reconcileConfig().maxAttempts).toBe(2)
    })

    it('defaults to 15 minutes, so a missing UAT override waits longer rather than calling immediately', () => {
        expect(reconcileConfig().delayMinutes).toBe(15)
    })

    it('bounds the third-party calls: 5s on the issue POST, 20s on the status GET', () => {
        expect(reconcileConfig().issueTimeoutMs).toBe(5000)
        expect(reconcileConfig().statusTimeoutMs).toBe(20000)
    })

    it('refuses a timeout outside the safe band instead of letting 0 mean "no timeout"', () => {
        process.env.CARD_ISSUE_TIMEOUT_MS = '0'
        resetReconcileConfig()

        expect(reconcileConfig().issueTimeoutMs).toBe(5000)
        delete process.env.CARD_ISSUE_TIMEOUT_MS
        resetReconcileConfig()
    })

    it('rejects a malformed delay instead of letting NaN become an immediate call', () => {
        process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES = 'soon'
        resetReconcileConfig()

        expect(reconcileConfig().delayMinutes).toBe(15)
        delete process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES
        resetReconcileConfig()
    })
})

describe('the delay default per environment', () => {
    const withEnv = (nodeEnv, assert) => {
        const previous = process.env.NODE_ENV
        if (nodeEnv === undefined) delete process.env.NODE_ENV
        else process.env.NODE_ENV = nodeEnv
        resetReconcileConfig()
        try {
            assert()
        } finally {
            if (previous === undefined) delete process.env.NODE_ENV
            else process.env.NODE_ENV = previous
            resetReconcileConfig()
        }
    }

    it('waits 5 minutes on staging, so the status leg runs inside a test session', () => {
        withEnv('staging', () => {
            expect(reconcileConfig().delayMinutes).toBe(5)
            expect(nextDelaySeconds()).toBe(300)
        })
    })

    it.each([['production'], ['test'], [undefined]])('waits 15 minutes when NODE_ENV is %p', (nodeEnv) => {
        withEnv(nodeEnv, () => {
            expect(reconcileConfig().delayMinutes).toBe(15)
            expect(nextDelaySeconds()).toBe(900)
        })
    })

    // The env var is the escape hatch for a one-off, and must beat the per-environment default in
    // both directions — including back up to 15 on staging.
    it('lets an explicit override beat the staging default', () => {
        process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES = '15'
        withEnv('staging', () => {
            expect(reconcileConfig().delayMinutes).toBe(15)
        })
        delete process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES
        resetReconcileConfig()
    })

    it('lets an explicit override beat the production default', () => {
        process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES = '3'
        withEnv('production', () => {
            expect(reconcileConfig().delayMinutes).toBe(3)
        })
        delete process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES
        resetReconcileConfig()
    })

    // A bad override on staging must fall back to staging's 5, not production's 15.
    it('falls back to the staging default when the override is malformed', () => {
        process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES = 'soon'
        withEnv('staging', () => {
            expect(reconcileConfig().delayMinutes).toBe(5)
        })
        delete process.env.CARD_ORDER_RECONCILE_DELAY_MINUTES
        resetReconcileConfig()
    })
})

describe('sweepDueCardOrders', () => {
    it('reports an empty queue rather than staying silent — the summary line is the heartbeat', async () => {
        findDueForReconcile.mockResolvedValue([])

        const counters = await sweepDueCardOrders({})

        expect(counters).toEqual(expect.objectContaining({ scanned: 0, issued: 0 }))
    })

    it('counts each row by outcome', async () => {
        findDueForReconcile.mockResolvedValue([{ id: 7 }])
        findCardById.mockResolvedValue(card())
        getValue.mockResolvedValue(JSON.stringify(CREDS))
        pinelabsRequest.mockResolvedValue(processedOk([{ responseCode: 0, referenceNumber: 1, externalCardIdentifier: 'PKCARDaaa' }]))

        const counters = await sweepDueCardOrders({})

        expect(counters.scanned).toBe(1)
        expect(counters.issued).toBe(1)
    })

    it('survives a row that throws, so one poisoned card cannot abort the sweep', async () => {
        findDueForReconcile.mockResolvedValue([{ id: 7 }])
        findCardById.mockRejectedValue(new Error('db blip'))

        await expect(sweepDueCardOrders({})).resolves.toEqual(expect.objectContaining({ scanned: 1 }))
    })
})
