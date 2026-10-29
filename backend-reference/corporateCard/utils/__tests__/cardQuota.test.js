jest.mock('../../models/use-cases/cardIssuance', () => ({
    countPhysicalCardsUsed: jest.fn(),
    countPaidPhysicalCards: jest.fn(),
}))

const { countPhysicalCardsUsed, countPaidPhysicalCards } = require('../../models/use-cases/cardIssuance')
const {
    resolveCardBaseLimit,
    resolveCardUnitPrice,
    buildPhysicalQuota,
    assertPhysicalCardAllowed,
} = require('../cardQuota')
const { NO_PRICE_MESSAGE, physicalCardMessage } = require('../../constants/cardQuota')

beforeEach(() => {
    jest.clearAllMocks()
    countPaidPhysicalCards.mockResolvedValue(0)
})

describe('resolveCardBaseLimit', () => {
    it.each([
        ['a NULL column', null],
        ['an absent column', undefined],
        ['an empty string', ''],
        ['an unparseable value', 'abc'],
        ['a negative allowance', -1],
        ['an explicit zero', 0],
        ['Infinity', Infinity],
        ['NaN', NaN],
    ])('reads %s as no included cards', (_label, baseLimit) => {
        expect(resolveCardBaseLimit({ baseLimit })).toBe(0)
    })

    it('reads the decimal string mysql2 actually returns', () => {
        expect(resolveCardBaseLimit({ baseLimit: '5.00' })).toBe(5)
    })

    it.each([['2.70', 2], ['0.50', 0], ['1.99', 1]])(
        'floors %s to %i rather than rounding up',
        (baseLimit, expected) => {
            expect(resolveCardBaseLimit({ baseLimit })).toBe(expected)
        }
    )
})

describe('resolveCardUnitPrice', () => {
    it.each([
        ['a NULL column', null],
        ['an empty string', ''],
        ['an unparseable value', 'abc'],
        ['a negative price', -5],
        ['zero', 0],
        ['Infinity', Infinity],
    ])('reads %s as not purchasable', (_label, unitPrice) => {
        expect(resolveCardUnitPrice({ unitPrice })).toBe(0)
    })

    // Unlike the allowance, a price keeps its paise — flooring ₹19.50 would undercharge.
    it('keeps paise rather than flooring', () => {
        expect(resolveCardUnitPrice({ unitPrice: '19.50' })).toBe(19.5)
        expect(resolveCardUnitPrice({ unitPrice: '0.50' })).toBe(0.5)
    })
})

describe('buildPhysicalQuota', () => {
    it('counts purchased cards into the allowance', () => {
        expect(buildPhysicalQuota({ baseLimit: 1, purchased: 2, used: 2, unitPrice: 19 })).toEqual({
            used: 2, included: 1, purchased: 2, allowed: 3, remaining: 1,
            requiresPayment: false, unitPrice: 19, purchasable: true,
        })
    })

    it('requires payment once the allowance is used up', () => {
        expect(buildPhysicalQuota({ baseLimit: 1, purchased: 0, used: 1, unitPrice: 19 }))
            .toMatchObject({ allowed: 1, remaining: 0, requiresPayment: true })
    })

    /**
     * A plan with no free physical card is the paywall case, not a block: the admin can still buy one.
     */
    it('treats a zero allowance as purchasable rather than blocked', () => {
        expect(buildPhysicalQuota({ baseLimit: 0, purchased: 0, used: 0, unitPrice: 19 }))
            .toMatchObject({ requiresPayment: true, purchasable: true })
    })

    it.each([
        ['the 1st card is free', 0, false],
        ['the 5th card is free', 4, false],
        ['the 6th card is charged', 5, true],
        ['the 7th card is charged', 6, true],
    ])('with a 5-card allowance, %s', (_label, used, requiresPayment) => {
        expect(buildPhysicalQuota({ baseLimit: 5, purchased: 0, used, unitPrice: 290 }))
            .toMatchObject({ included: 5, allowed: 5, requiresPayment })
    })

    it('is not purchasable when the plan carries no price', () => {
        expect(buildPhysicalQuota({ baseLimit: 0, purchased: 0, used: 0, unitPrice: 0 }))
            .toMatchObject({ requiresPayment: true, purchasable: false })
    })
})

describe('assertPhysicalCardAllowed', () => {
    it('allows the first card when the plan includes one', async () => {
        countPhysicalCardsUsed.mockResolvedValue(0)

        await expect(assertPhysicalCardAllowed({ corporateId: 42, baseLimit: 1, unitPrice: 19 }))
            .resolves.toMatchObject({ ok: true, remaining: 1 })
    })

    it('refuses the second and quotes the price', async () => {
        countPhysicalCardsUsed.mockResolvedValue(1)

        const result = await assertPhysicalCardAllowed({ corporateId: 42, baseLimit: 1, unitPrice: 19 })

        expect(result.ok).toBe(false)
        expect(result.message).toBe(
            "You've used all 1 physical card included in your plan (1/1). You can order another for INR 19.00 + GST."
        )
    })

    // The whole point of the change: a paid credit makes the next card free again.
    it('allows a card that has been paid for', async () => {
        countPhysicalCardsUsed.mockResolvedValue(1)
        countPaidPhysicalCards.mockResolvedValue(1)

        await expect(assertPhysicalCardAllowed({ corporateId: 42, baseLimit: 1, unitPrice: 19 }))
            .resolves.toMatchObject({ ok: true, allowed: 2, purchased: 1 })
    })

    it('offers to sell when the plan includes none', async () => {
        countPhysicalCardsUsed.mockResolvedValue(0)

        const result = await assertPhysicalCardAllowed({ corporateId: 42, baseLimit: 0, unitPrice: 19 })

        expect(result.ok).toBe(false)
        expect(result.message).toContain('INR 19.00')
        expect(result.message).not.toMatch(/upgrade your plan/i)
    })

    it('tells the admin to upgrade only when there is no price to sell at', async () => {
        countPhysicalCardsUsed.mockResolvedValue(0)

        const result = await assertPhysicalCardAllowed({ corporateId: 42, baseLimit: 0, unitPrice: 0 })

        expect(result.message).toBe(NO_PRICE_MESSAGE)
    })

    it('counts and sums under the caller transaction so the claim and the insert agree', async () => {
        countPhysicalCardsUsed.mockResolvedValue(0)
        const transaction = { id: 'tx-1' }

        await assertPhysicalCardAllowed({ corporateId: 42, baseLimit: 1, unitPrice: 19 }, transaction)

        expect(countPhysicalCardsUsed).toHaveBeenCalledWith({ corporateId: 42 }, transaction)
        expect(countPaidPhysicalCards).toHaveBeenCalledWith({ corporateId: 42 }, transaction)
    })
})

/**
 * Amounts reach the shared notifications table and staging's default charset is armscii8, where a ₹ glyph
 * fails to INSERT and the row silently vanishes.
 */
describe('physicalCardMessage', () => {
    it('never carries a rupee glyph', () => {
        expect(physicalCardMessage({ included: 1, used: 1, unitPrice: 19 })).not.toContain('₹')
        expect(physicalCardMessage({ included: 0, used: 0, unitPrice: 0 })).not.toContain('₹')
    })
})
