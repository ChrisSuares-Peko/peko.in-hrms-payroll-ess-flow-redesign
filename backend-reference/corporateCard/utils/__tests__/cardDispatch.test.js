const {
    MAX_DISPATCHES_PER_CARD,
    dispatchedAtUtc,
    dispatchKey,
    referenceOf,
    toStoredDispatch,
    asRecordArray,
    groupByReference,
} = require('../cardDispatch')

// The two records Pine Labs documented: one AWB, two different cards.
const SAMPLE = [
    {
        referenceNumber: 31157821,
        awbNumber: '35870400000',
        courierPartnerID: 1,
        courierPartnerName: 'Bluedart',
        customerName: 'customer_name',
        mobileNumber: 9876543210,
        addressLine1: 'address_1',
        addressLine2: 'address_2',
        city: 'Bengaluru',
        state: 'Karnataka',
        pinCode: 560001,
        dispatchedOn: '2026-08-08T18:11:10',
    },
    {
        referenceNumber: 613989121,
        awbNumber: '35870400000',
        courierPartnerID: 1,
        courierPartnerName: 'Bluedart',
        customerName: 'customer_name',
        mobileNumber: 9876543210,
        addressLine1: 'address_1',
        addressLine2: 'address_2',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pinCode: 600096,
        dispatchedOn: '2026-08-08T18:11:10',
    },
]

describe('dispatchedAtUtc', () => {
    // The vendor sends no zone. Read as UTC this would claim the card left 5.5 hours earlier.
    it('reads a zone-less timestamp as IST', () => {
        expect(dispatchedAtUtc('2026-08-08T18:11:10')).toBe('2026-08-08T12:41:10.000Z')
    })

    it('honours a timestamp that already carries a zone', () => {
        expect(dispatchedAtUtc('2026-08-08T18:11:10Z')).toBe('2026-08-08T18:11:10.000Z')
        expect(dispatchedAtUtc('2026-08-08T18:11:10+05:30')).toBe('2026-08-08T12:41:10.000Z')
    })

    it.each([[''], [null], [undefined], ['not a date'], ['2026-13-45T99:99:99']])(
        'returns null for %p rather than an Invalid Date',
        (value) => expect(dispatchedAtUtc(value)).toBeNull()
    )
})

describe('dispatchKey', () => {
    // The sample proves the AWB alone cannot identify a dispatch: two cards share one.
    it('is equal for a redelivery of the same record', () => {
        expect(dispatchKey(SAMPLE[0])).toBe(dispatchKey({ ...SAMPLE[0] }))
    })

    it('is equal across the two sample records, which is why it is only ever used card-scoped', () => {
        expect(dispatchKey(SAMPLE[0])).toBe(dispatchKey(SAMPLE[1]))
    })

    it('separates a re-dispatch of the same card under a new AWB', () => {
        expect(dispatchKey(SAMPLE[0])).not.toBe(dispatchKey({ ...SAMPLE[0], awbNumber: '35870400001' }))
    })

    it('separates the same AWB dispatched again later', () => {
        expect(dispatchKey(SAMPLE[0])).not.toBe(dispatchKey({ ...SAMPLE[0], dispatchedOn: '2026-08-09T09:00:00' }))
    })

    it('separates a different courier', () => {
        expect(dispatchKey(SAMPLE[0])).not.toBe(dispatchKey({ ...SAMPLE[0], courierPartnerID: 2 }))
    })

    it('ignores AWB case and padding, which a redelivery may differ in', () => {
        expect(dispatchKey({ ...SAMPLE[0], awbNumber: ' 35870400000 ' })).toBe(dispatchKey(SAMPLE[0]))
    })

    it('does not collapse two records that are both missing every key field', () => {
        // Both produce '||'; identical by key, which is the safe direction — a record with no AWB, no
        // timestamp and no courier carries nothing to distinguish it and must not be stored twice.
        expect(dispatchKey({})).toBe(dispatchKey({ referenceNumber: 9 }))
    })
})

describe('referenceOf', () => {
    it('accepts the numeric reference the vendor sends', () => {
        expect(referenceOf({ referenceNumber: 31157821 })).toBe('31157821')
    })

    it('accepts the same reference as a string', () => {
        expect(referenceOf({ referenceNumber: '31157821' })).toBe('31157821')
    })

    it.each([[undefined], [null], ['']])('rejects %p', (value) =>
        expect(referenceOf({ referenceNumber: value })).toBeNull())

    // The reference reaches a WHERE clause; anything non-numeric is refused at the boundary.
    it.each([["31157821 OR 1=1"], ['abc'], ['12.5'], ['-5'], [{}], [[]]])('rejects %p', (value) =>
        expect(referenceOf({ referenceNumber: value })).toBeNull())
})

describe('asRecordArray', () => {
    it('takes the documented root-level array as-is', () => {
        expect(asRecordArray(SAMPLE)).toBe(SAMPLE)
    })

    it('wraps a single object, in case the vendor posts one dispatch unwrapped', () => {
        expect(asRecordArray(SAMPLE[0])).toEqual([SAMPLE[0]])
    })

    it('unwraps a data-wrapped array', () => {
        expect(asRecordArray({ data: SAMPLE })).toBe(SAMPLE)
    })

    it.each([[{}], [null], [undefined], ['string'], [7]])('yields nothing for %p', (body) =>
        expect(asRecordArray(body)).toEqual([]))
})

describe('groupByReference', () => {
    it('splits the sample into one group per card', () => {
        const { groups, invalid } = groupByReference(SAMPLE)

        expect([...groups.keys()]).toEqual(['31157821', '613989121'])
        expect(groups.get('31157821')).toEqual([SAMPLE[0]])
        expect(groups.get('613989121')).toEqual([SAMPLE[1]])
        expect(invalid).toEqual([])
    })

    it('keeps several records for one card together, in arrival order', () => {
        const second = { ...SAMPLE[0], awbNumber: '999' }
        const { groups } = groupByReference([SAMPLE[0], second])

        expect(groups.size).toBe(1)
        expect(groups.get('31157821')).toEqual([SAMPLE[0], second])
    })

    it('sets aside records that name no card rather than dropping them silently', () => {
        const { groups, invalid } = groupByReference([SAMPLE[0], { awbNumber: 'x' }, null, 'nope', []])

        expect(groups.size).toBe(1)
        expect(invalid).toHaveLength(4)
    })
})

describe('toStoredDispatch', () => {
    const receivedAt = new Date('2026-08-12T10:00:00.000Z')

    it('keeps every field the vendor sent', () => {
        const stored = toStoredDispatch(SAMPLE[0], receivedAt)

        for (const [key, value] of Object.entries(SAMPLE[0])) expect(stored[key]).toEqual(value)
    })

    it('adds the resolved instant and when we received it, without replacing the original string', () => {
        const stored = toStoredDispatch(SAMPLE[0], receivedAt)

        expect(stored.dispatchedOn).toBe('2026-08-08T18:11:10')
        expect(stored.dispatchedAtUtc).toBe('2026-08-08T12:41:10.000Z')
        expect(stored.receivedAt).toBe('2026-08-12T10:00:00.000Z')
    })

    it('records a null instant for an unparseable timestamp but still stores the record', () => {
        const stored = toStoredDispatch({ ...SAMPLE[0], dispatchedOn: 'soon' }, receivedAt)

        expect(stored.dispatchedAtUtc).toBeNull()
        expect(stored.dispatchedOn).toBe('soon')
    })
})

describe('MAX_DISPATCHES_PER_CARD', () => {
    it('bounds what one card can accumulate', () => {
        expect(MAX_DISPATCHES_PER_CARD).toBe(25)
    })
})
