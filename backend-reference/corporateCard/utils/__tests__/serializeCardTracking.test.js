const {
    serializeCardTracking,
    serializeDispatch,
    shippingLine,
    TRACKING_STATUS_FILTERS,
} = require('../serializeCardTracking')

const row = (overrides = {}) => ({
    id: 77,
    createdAt: '2026-08-01T04:30:00.000Z',
    userId: '99',
    cardholder: { name: 'Sophia Martinez', role: 'Marketing' },
    maskedCardNumber: '608363******9870',
    nameOnCard: 'SOPHIA MARTINEZ',
    referenceNumber: 31157821,
    status: 'ISSUED',
    shipping: {
        addressLine1: 'B-22',
        addressLine2: 'Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400050',
    },
    dispatches: [],
    ...overrides,
})

const dispatch = (overrides = {}) => ({
    awbNumber: '35870411223',
    courierPartnerID: 1,
    courierPartnerName: 'Bluedart',
    city: 'Bengaluru',
    state: 'Karnataka',
    pinCode: 560034,
    dispatchedOn: '2026-08-08T18:11:10',
    dispatchedAtUtc: '2026-08-08T12:41:10.000Z',
    receivedAt: '2026-08-12T10:00:00.000Z',
    ...overrides,
})

describe('shippingLine', () => {
    it('reads as one address line', () => {
        expect(shippingLine(row().shipping)).toBe('B-22, Bandra West Mumbai, Maharashtra 400050')
    })

    it('skips the parts that were not filled in, leaving no stray commas', () => {
        expect(shippingLine({ addressLine1: 'Plot 14', city: 'Bengaluru', pinCode: '560038' }))
            .toBe('Plot 14 Bengaluru 560038')
    })

    it.each([[null], [undefined], [{}], ['not an object'], [[]]])('yields null for %p', (value) =>
        expect(shippingLine(value)).toBeNull())
})

describe('serializeDispatch', () => {
    it('carries the courier, consignment and both timestamps', () => {
        expect(serializeDispatch(dispatch())).toEqual({
            awbNumber: '35870411223',
            courierPartnerName: 'Bluedart',
            courierPartnerId: 1,
            dispatchedOn: '2026-08-08T18:11:10',
            dispatchedAtUtc: '2026-08-08T12:41:10.000Z',
            origin: 'Bengaluru, Karnataka, 560034',
            receivedAt: '2026-08-12T10:00:00.000Z',
        })
    })

    it('nulls every field of an empty record rather than emitting undefined', () => {
        expect(serializeDispatch({})).toEqual({
            awbNumber: null,
            courierPartnerName: null,
            courierPartnerId: null,
            dispatchedOn: null,
            dispatchedAtUtc: null,
            origin: null,
            receivedAt: null,
        })
    })
})

describe('serializeCardTracking', () => {
    it('maps a physical card order onto the tracking row the table renders', () => {
        expect(serializeCardTracking(row())).toEqual({
            key: '77',
            cardIssuanceId: 77,
            orderedOn: '2026-08-01T04:30:00.000Z',
            holderId: '99',
            holder: 'Sophia Martinez',
            department: 'Marketing',
            maskedCardNumber: '608363******9870',
            last4: '9870',
            nameOnCard: 'SOPHIA MARTINEZ',
            shippingAddress: 'B-22, Bandra West Mumbai, Maharashtra 400050',
            referenceNumber: '31157821',
            status: 'Issued',
            dispatches: [],
            dispatchCount: 0,
        })
    })

    // The Status column reads the ORDER's state; the courier leg has its own column.
    it.each([
        ['PENDING', 'Ordered'],
        ['ISSUED', 'Issued'],
        ['FAILED', 'Failed'],
        ['REPLACED', 'Replaced'],
    ])('shows %s as %s', (status, expected) => {
        expect(serializeCardTracking(row({ status })).status).toBe(expected)
    })

    it('passes an unrecognised status through rather than blanking the column', () => {
        expect(serializeCardTracking(row({ status: 'SOMETHING_NEW' })).status).toBe('SOMETHING_NEW')
    })

    it('serialises the dispatch history and counts it', () => {
        const serialized = serializeCardTracking(row({ dispatches: [dispatch(), dispatch({ awbNumber: 'X2' })] }))

        expect(serialized.dispatchCount).toBe(2)
        expect(serialized.dispatches[1].awbNumber).toBe('X2')
    })

    it('treats a non-array dispatches column as empty', () => {
        expect(serializeCardTracking(row({ dispatches: 'corrupt' })).dispatches).toEqual([])
    })

    it('survives a card with no cardholder, no shipping and no reference', () => {
        const serialized = serializeCardTracking(row({
            cardholder: null, shipping: null, referenceNumber: null, maskedCardNumber: null, nameOnCard: null,
        }))

        expect(serialized).toEqual(expect.objectContaining({
            holder: null, department: null, shippingAddress: null, referenceNumber: null, last4: null,
        }))
    })

    // The BIGINT reference arrives as a number or a string depending on the driver; the client compares
    // it as text, so it is always a string on the wire.
    it('always sends the reference as a string', () => {
        expect(serializeCardTracking(row({ referenceNumber: 31157821 })).referenceNumber).toBe('31157821')
        expect(serializeCardTracking(row({ referenceNumber: '31157821' })).referenceNumber).toBe('31157821')
    })

    it('never leaks the cardholder PII the dispatch record carries', () => {
        const serialized = serializeCardTracking(row({
            dispatches: [dispatch({ customerName: 'Sophia Martinez', mobileNumber: 9876543210 })],
        }))

        expect(JSON.stringify(serialized)).not.toContain('9876543210')
        expect(serialized.dispatches[0]).not.toHaveProperty('customerName')
        expect(serialized.dispatches[0]).not.toHaveProperty('mobileNumber')
    })
})

describe('TRACKING_STATUS_FILTERS', () => {
    it('maps the filter labels the UI offers onto issuance statuses', () => {
        expect(TRACKING_STATUS_FILTERS).toEqual({ Ordered: 'PENDING', Issued: 'ISSUED', Failed: 'FAILED' })
    })
})
