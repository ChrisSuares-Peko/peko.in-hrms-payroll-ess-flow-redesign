const { serializeCard } = require('../serializeCard')

const baseCard = (overrides = {}) => ({
    id: 1,
    status: 'ISSUED',
    cardType: 'Physical',
    createdAt: '2999-01-01T00:00:00.000Z',
    maskedCardNumber: '1234 56** **** 7890',
    cardLimit: '1000',
    ...overrides,
})

describe('serializeCard — status derivation', () => {
    it('shows an ISSUED card as Active', () => {
        expect(serializeCard(baseCard()).status).toBe('Active')
    })

    it('shows a frozen card as Frozen whatever its age', () => {
        const card = serializeCard(baseCard({ cardState: 'FROZEN', createdAt: '2020-01-01T00:00:00.000Z' }))
        expect(card.status).toBe('Frozen')
    })

    it('keeps an old ISSUED card Active — expiry is the issuer\'s to report, not ours', () => {
        const card = serializeCard(baseCard({ cardState: 'ACTIVE', createdAt: '2020-01-01T00:00:00.000Z' }))
        expect(card.status).toBe('Active')
    })

    it('maps PENDING / FAILED lifecycle statuses to their display words', () => {
        expect(serializeCard(baseCard({ status: 'PENDING', createdAt: '2020-01-01T00:00:00.000Z' })).status).toBe('Pending')
        expect(serializeCard(baseCard({ status: 'FAILED' })).status).toBe('Failed')
    })
})

describe('serializeCard — usage, defaults, view link', () => {
    it('computes remaining = cardLimit - spent, never negative', () => {
        expect(serializeCard(baseCard(), { spent: 300 })).toMatchObject({ spent: 300, remaining: 700 })
        expect(serializeCard(baseCard(), { spent: 1500 })).toMatchObject({ spent: 1500, remaining: 0 })
    })

    it('defaults spent to 0 so remaining equals the full limit', () => {
        expect(serializeCard(baseCard())).toMatchObject({ spent: 0, remaining: 1000, cardLimit: 1000 })
    })

    it('applies safe defaults for optional columns', () => {
        const card = serializeCard(baseCard({ cardType: undefined, cardState: undefined, limitFrequency: undefined, restrictedCategories: undefined, atmEnabled: undefined }))
        expect(card).toMatchObject({
            type: 'Virtual',
            cardState: 'ACTIVE',
            limitFrequency: 'monthly',
            restrictedCategories: [],
            atmEnabled: false,
            last4: '7890',
            cardholder: null,
        })
    })

    it('includes the decrypted card view link ONLY when includeViewLink is set', () => {
        const withLink = serializeCard(baseCard({ cardViewLink: 'https://view' }), { includeViewLink: true })
        expect(withLink.cardViewLink).toBe('https://view')

        const withoutLink = serializeCard(baseCard({ cardViewLink: 'https://view' }))
        expect(withoutLink).not.toHaveProperty('cardViewLink')
    })

    it('keeps perTxnLimit null when unset, distinct from an explicit 0', () => {
        expect(serializeCard(baseCard({ perTxnLimit: null })).perTxnLimit).toBeNull()
        expect(serializeCard(baseCard({ perTxnLimit: undefined })).perTxnLimit).toBeNull()
        expect(serializeCard(baseCard({ perTxnLimit: '500' })).perTxnLimit).toBe(500)
        expect(serializeCard(baseCard({ perTxnLimit: '0' })).perTxnLimit).toBe(0)
    })

    it('projects the joined cardholder into holder / department / cardholder', () => {
        const card = serializeCard(baseCard({
            userId: 99,
            cardholder: { id: 9, name: 'Aarav Sharma', email: 'aarav@peko.in', mobileNo: '9999999999', role: 'User' },
        }))
        expect(card.holderId).toBe(99)
        expect(card.holder).toBe('Aarav Sharma')
        expect(card.department).toBe('User')
        expect(card.cardholder).toEqual({ id: 9, name: 'Aarav Sharma', email: 'aarav@peko.in', mobileNo: '9999999999' })
    })
})

// The column is `referenceNumber`; the field the client receives is `dbUniqueNumber`. The rename is the
// contract, so it is asserted rather than assumed — a client reading card.referenceNumber gets undefined.
describe('serializeCard — dbUniqueNumber', () => {
    it('carries the issuer order reference through to the client', () => {
        expect(serializeCard(baseCard({ referenceNumber: '31157821' })).dbUniqueNumber).toBe('31157821')
    })

    it('exposes it under dbUniqueNumber only, not under the column name', () => {
        const card = serializeCard(baseCard({ referenceNumber: '31157821' }))
        expect(card).not.toHaveProperty('referenceNumber')
    })

    // The column is a BIGINT. Whichever of the two shapes the driver hands back, the client must see one
    // type, or the same value compared across two endpoints silently disagrees.
    it('answers a string whether the driver hands back a number or a string', () => {
        expect(serializeCard(baseCard({ referenceNumber: 31157821 })).dbUniqueNumber).toBe('31157821')
        expect(serializeCard(baseCard({ referenceNumber: '31157821' })).dbUniqueNumber).toBe('31157821')
    })

    // Same underlying column, two endpoints, two field names — so at least assert the VALUES agree.
    it('matches what the tracking table reports for the same card', () => {
        const { serializeCardTracking } = require('../serializeCardTracking')
        const row = { id: 1, status: 'ISSUED', referenceNumber: 31157821, dispatches: [] }
        expect(serializeCard(baseCard({ referenceNumber: 31157821 })).dbUniqueNumber)
            .toBe(serializeCardTracking(row).referenceNumber)
    })

    // A virtual card ordered before the reference landed, or any card the issuer never gave one for.
    it('is null, not the string "null", when the issuer gave none', () => {
        expect(serializeCard(baseCard({ referenceNumber: null })).dbUniqueNumber).toBeNull()
        expect(serializeCard(baseCard({ referenceNumber: undefined })).dbUniqueNumber).toBeNull()
        expect(serializeCard(baseCard()).dbUniqueNumber).toBeNull()
    })

    // 0 is a real reference in a way null is not, so it must not be flattened by a falsy check.
    it('keeps a zero reference rather than reading it as absent', () => {
        expect(serializeCard(baseCard({ referenceNumber: 0 })).dbUniqueNumber).toBe('0')
    })
})
