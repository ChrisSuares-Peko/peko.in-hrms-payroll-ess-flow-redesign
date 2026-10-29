const {
    normalizeOrderStatus,
    normalizeVendorCard,
    pickOrderRecord,
    classifyIssueOutcome,
    classifyOrderStatus,
    buildIssuedCardFields,
    vendorErrorSummary,
} = require('../cardOrderStatus')
const { ORDER_VERDICT, ISSUE_OUTCOME } = require('../../constants/cardReconcile')
const { PINELABS_DEFINITIVE_ISSUE_FAILURE_CODES } = require('../../constants/pinelabs')

const ok = (data) => ({ ok: true, data, responseCode: data?.responseCode })
const httpError = (status, responseCode) => ({ ok: false, status, error: { responseCode }, noResponse: false })
const timedOut = () => ({ ok: false, status: undefined, error: 'timeout of 60000ms exceeded', noResponse: true })

const REQ = 'PKREQ0123456789abcdef0123456789ab'
const CARD_ID = 'PKCARDdeadbeefdeadbeefdeadbeefdead'

describe('normalizeOrderStatus', () => {
    it('reads the record array under BOTH documented names', () => {
        expect(normalizeOrderStatus({ orderResponseList: [{ referenceNumber: 1 }] }).records).toHaveLength(1)
        expect(normalizeOrderStatus({ orders: [{ referenceNumber: 1 }] }).records).toHaveLength(1)
    })

    it('keeps an absent count as null, not 0 — absent counts at orderStatus 2 are normal', () => {
        const order = normalizeOrderStatus({ orderStatus: 2 })
        expect(order.successCount).toBeNull()
        expect(order.failedCount).toBeNull()
        expect(order.totalQuantity).toBeNull()
    })

    it('degrades a non-array record list and a non-object payload to an empty record set', () => {
        expect(normalizeOrderStatus({ orders: 'nope' }).records).toEqual([])
        expect(normalizeOrderStatus(null).records).toEqual([])
    })
})

describe('normalizeVendorCard', () => {
    it('prefers pinSetLink — the only PIN-link name the vendor actually sends', () => {
        expect(normalizeVendorCard({ pinSetLink: 'https://p/set' }).pinSetLink).toBe('https://p/set')
    })

    it('still accepts the legacy PIN-link spellings', () => {
        expect(normalizeVendorCard({ resetPinLink: 'a' }).pinSetLink).toBe('a')
        expect(normalizeVendorCard({ setPinLink: 'b' }).pinSetLink).toBe('b')
    })

    it('accepts cardViewLink (schema) and cardLink (sample) for the card-view link', () => {
        expect(normalizeVendorCard({ cardViewLink: 'x' }).cardViewLink).toBe('x')
        expect(normalizeVendorCard({ cardLink: 'y' }).cardViewLink).toBe('y')
    })

    it('takes order-level fields from the envelope when the record omits them', () => {
        const card = normalizeVendorCard({ amount: 100 }, { orderId: 51177, issuanceCharge: 0 })
        expect(card.orderId).toBe(51177)
        expect(card.orderAmount).toBe(100)
        expect(card.issuanceCharge).toBe(0)
    })
})

describe('pickOrderRecord', () => {
    const order = (records) => ({ records })

    it('returns the only record without needing a selector', () => {
        expect(pickOrderRecord(order([{ referenceNumber: 7 }])).record.referenceNumber).toBe(7)
    })

    it('matches a digital card on externalCardIdentifier', () => {
        const res = pickOrderRecord(
            order([{ externalCardIdentifier: 'other' }, { externalCardIdentifier: CARD_ID, referenceNumber: 9 }]),
            { externalCardIdentifier: CARD_ID }
        )
        expect(res.record.referenceNumber).toBe(9)
    })

    it('matches a physical card on the echoed source referenceNumber', () => {
        const res = pickOrderRecord(
            order([{ referenceNumber: 111 }, { referenceNumber: 222 }]),
            { sourceReferenceNumber: 222 }
        )
        expect(res.record.referenceNumber).toBe(222)
    })

    it('reports ambiguous rather than blind-indexing when nothing matches', () => {
        const res = pickOrderRecord(order([{ referenceNumber: 1 }, { referenceNumber: 2 }]), { sourceReferenceNumber: 999 })
        expect(res).toEqual({ record: null, ambiguous: true })
    })
})

describe('classifyIssueOutcome', () => {
    it('A1 — 2xx + responseCode 0 + referenceNumber is CONFIRMED', () => {
        expect(classifyIssueOutcome(ok({ responseCode: 0, referenceNumber: 8381581115 })).outcome)
            .toBe(ISSUE_OUTCOME.CONFIRMED)
    })

    it('A2 — responseCode 0 with NO referenceNumber is UNKNOWN, never a hollow ISSUED', () => {
        const res = classifyIssueOutcome(ok({ responseCode: 0 }))
        expect(res.outcome).toBe(ISSUE_OUTCOME.UNKNOWN)
        expect(res.alert).toBe(true)
    })

    it('A4 — every documented pre-order rejection code is DEFINITIVE_FAILURE', () => {
        PINELABS_DEFINITIVE_ISSUE_FAILURE_CODES.forEach((code) => {
            expect(classifyIssueOutcome(httpError(400, code)).outcome).toBe(ISSUE_OUTCOME.DEFINITIVE_FAILURE)
        })
    })

    it('A5 — responseCode 50 is UNKNOWN: the vendor tells us to call order status, not to fail', () => {
        expect(classifyIssueOutcome(httpError(400, 50)).outcome).toBe(ISSUE_OUTCOME.UNKNOWN)
    })

    it('A7 — 409/318 is UNKNOWN, because it PROVES an order exists', () => {
        expect(classifyIssueOutcome(httpError(409, 318)).outcome).toBe(ISSUE_OUTCOME.UNKNOWN)
    })

    it('A11 — a timeout is UNKNOWN for both card types', () => {
        expect(classifyIssueOutcome(timedOut()).outcome).toBe(ISSUE_OUTCOME.UNKNOWN)
    })

    it('A12 — a pre-flight failure never reached the vendor, so it is DEFINITIVE_FAILURE', () => {
        expect(classifyIssueOutcome({ ok: false, error: 'AUTH_FAILED' }).outcome).toBe(ISSUE_OUTCOME.DEFINITIVE_FAILURE)
        expect(classifyIssueOutcome({ ok: false, error: 'VENDOR_NOT_CONFIGURED' }).outcome)
            .toBe(ISSUE_OUTCOME.DEFINITIVE_FAILURE)
    })

    it('an UNDOCUMENTED code defaults to UNKNOWN — the allowlist direction is what keeps I1 true', () => {
        [7, 99, 4242, 50007].forEach((code) => {
            expect(classifyIssueOutcome(httpError(400, code)).outcome).toBe(ISSUE_OUTCOME.UNKNOWN)
        })
    })
})

describe('classifyOrderStatus', () => {
    const ctx = { externalRequestId: REQ, externalCardIdentifier: CARD_ID }
    const processed = (records, counts = {}) => ok({
        responseCode: 0,
        externalRequestId: REQ,
        orderId: 51177,
        orderStatus: 6,
        totalQuantity: 1,
        successCount: 1,
        failedCount: 0,
        ...counts,
        orderResponseList: records,
    })

    it('B1 — processed + record rc 0 + referenceNumber is ISSUED', () => {
        const res = classifyOrderStatus(processed([{ responseCode: 0, referenceNumber: 8381581115, externalCardIdentifier: CARD_ID }]), ctx)
        expect(res.verdict).toBe(ORDER_VERDICT.ISSUED)
        expect(res.record.referenceNumber).toBe(8381581115)
    })

    it('B2 — processed + record rc non-zero + corroborating counts is the ONLY route to FAILED', () => {
        const res = classifyOrderStatus(
            processed([{ responseCode: 53, responseMessage: 'Invalid card detail', externalCardIdentifier: CARD_ID }],
                { successCount: 0, failedCount: 1 }),
            ctx
        )
        expect(res.verdict).toBe(ORDER_VERDICT.FAILED)
        expect(res.reason).toContain('code=53')
    })

    it('a failed record WITHOUT corroborating counts stays AMBIGUOUS, not FAILED', () => {
        const res = classifyOrderStatus(
            processed([{ responseCode: 53, externalCardIdentifier: CARD_ID }], { successCount: null, failedCount: null }),
            ctx
        )
        expect(res.verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
    })

    it('B3 — record rc 0 with no referenceNumber is AMBIGUOUS', () => {
        expect(classifyOrderStatus(processed([{ responseCode: 0, externalCardIdentifier: CARD_ID }]), ctx).verdict)
            .toBe(ORDER_VERDICT.AMBIGUOUS)
    })

    it('B4 — a mixed-count order is AMBIGUOUS; a per-card verdict is never split out of it', () => {
        const res = classifyOrderStatus(
            processed([{ responseCode: 0, referenceNumber: 1, externalCardIdentifier: CARD_ID }],
                { successCount: 1, failedCount: 1, totalQuantity: 2 }),
            ctx
        )
        expect(res.verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
    })

    it('B5 — processed with an empty record list is AMBIGUOUS', () => {
        expect(classifyOrderStatus(processed([]), ctx).verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
    })

    it('B7 — orderStatus 2 is PROCESSING: this is the expected answer at T+5min in UAT', () => {
        const res = classifyOrderStatus(ok({ responseCode: 0, externalRequestId: REQ, orderStatus: 2 }), ctx)
        expect(res.verdict).toBe(ORDER_VERDICT.PROCESSING)
    })

    it('B8 — an undocumented orderStatus is AMBIGUOUS and alerts', () => {
        const res = classifyOrderStatus(ok({ responseCode: 0, externalRequestId: REQ, orderStatus: 9 }), ctx)
        expect(res.verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
        expect(res.alert).toBe(true)
    })

    it('B12 — 53/425 stay AMBIGUOUS: there is no documented order-not-found code', () => {
        expect(classifyOrderStatus(httpError(400, 53), ctx).verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
        expect(classifyOrderStatus(httpError(400, 425), ctx).verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
    })

    it('B18 — a timeout on the status call is AMBIGUOUS', () => {
        expect(classifyOrderStatus(timedOut(), ctx).verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
    })

    it('B20 — an echoed externalRequestId that is not ours is AMBIGUOUS and alerts, applying nothing', () => {
        const res = classifyOrderStatus(processed([{ responseCode: 0, referenceNumber: 1 }]), {
            ...ctx,
            externalRequestId: 'PKREQsomethingelse',
        })
        expect(res.verdict).toBe(ORDER_VERDICT.AMBIGUOUS)
        expect(res.alert).toBe(true)
        expect(res.reason).toBe('EXTERNAL_REQUEST_ID_MISMATCH')
    })

    it('NEVER returns FAILED for any non-2xx status response, across every documented code', () => {
        [1, 2, 13, 50, 53, 91, 216, 303, 305, 318, 319, 425, 493, 505, 517, 50003, 50007].forEach((code) => {
            expect(classifyOrderStatus(httpError(400, code), ctx).verdict).not.toBe(ORDER_VERDICT.FAILED)
        })
    })
})

describe('buildIssuedCardFields', () => {
    it('maps pinSetLink onto the resetPinLink column and omits it when absent', () => {
        const withPin = buildIssuedCardFields(normalizeVendorCard({ referenceNumber: 1, pinSetLink: 'p' }), {})
        expect(withPin.resetPinLink).toBeDefined()
        const withoutPin = buildIssuedCardFields(normalizeVendorCard({ referenceNumber: 1 }), {})
        expect(withoutPin).not.toHaveProperty('resetPinLink')
    })

    it('writes neither cardIdentifier nor a tracking field — the vendor documents no such response fields', () => {
        const fields = buildIssuedCardFields(
            normalizeVendorCard({ referenceNumber: 1, cardIdentifier: 1, trackingReference: 'T1' }), {}
        )
        expect(fields).not.toHaveProperty('cardIdentifier')
        expect(fields).not.toHaveProperty('trackingRef')
    })
})

describe('vendorErrorSummary', () => {
    it('formats code and message and bounds the column width', () => {
        expect(vendorErrorSummary(53, 'Invalid card detail')).toBe('code=53 msg=Invalid card detail')
        expect(vendorErrorSummary(NaN, null)).toBe('code=none msg=')
        expect(vendorErrorSummary(1, 'x'.repeat(400)).length).toBe(255)
    })
})
