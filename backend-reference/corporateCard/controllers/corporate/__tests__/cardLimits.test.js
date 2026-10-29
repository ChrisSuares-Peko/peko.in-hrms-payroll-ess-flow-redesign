const { setCardControls, setCardSettings, getMerchantCategories, exportCardAudit, getCardAudit } = require('../cardLimits')
const { findByIdScoped, applyLimit } = require('../../../models/use-cases/cardIssuance')
const { getSpendByCard } = require('../../../models/use-cases/cardTransaction')
const { findByCard, findAllByCard } = require('../../../models/use-cases/cardAuditLog')
const { safeAudit, MAX_ITEMS_PER_PAGE } = require('../../../utils/cardHelpers')
const { findMerchantCategory } = require('../../../constants/merchantCategories')

jest.mock('../../../models/use-cases/cardIssuance', () => ({
    findByIdScoped: jest.fn(),
    applyLimit: jest.fn(),
}))
jest.mock('../../../models/use-cases/cardAuditLog', () => ({ findByCard: jest.fn(), findAllByCard: jest.fn() }))
jest.mock('../../../models/use-cases/cardTransaction', () => ({ getSpendByCard: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => {
    const actual = jest.requireActual('../../../utils/cardHelpers')
    return { ...actual, safeAudit: jest.fn() }
})

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.setHeader = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    return res
}

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42, id: 1, contactPersonName: 'Shyam Admin' },
    params: { cardIssuanceId: '7' },
    body: {},
    ...overrides,
})

const activeCard = { id: 7, corporateId: 42, userId: 99, status: 'ISSUED', restrictedCategories: [] }

describe('exports.setCardControls — restricted category resolution', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findByIdScoped.mockResolvedValue(activeCard)
        applyLimit.mockResolvedValue(activeCard)
        getSpendByCard.mockResolvedValue(new Map())
        safeAudit.mockResolvedValue(undefined)
    })

    it('rejects a category name that is not in the canonical list', async () => {
        const req = adminReq({ body: { restrictedCategories: ['Not A Real Category'] } })
        const next = jest.fn()

        await setCardControls(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'One or more restricted categories are invalid.' }))
        expect(applyLimit).not.toHaveBeenCalled()
    })

    it('resolves a valid category name to its canonical { category, mccs } record before persisting', async () => {
        const req = adminReq({ body: { restrictedCategories: ['Food & Beverage'] } })
        const res = buildRes()
        const next = jest.fn()

        await setCardControls(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(applyLimit).toHaveBeenCalledWith(
            '7',
            expect.objectContaining({ restrictedCategories: [findMerchantCategory('Food & Beverage')] }),
            1
        )
    })

    it('rejects a non-array restrictedCategories body', async () => {
        const req = adminReq({ body: { restrictedCategories: 'Food & Beverage' } })
        const next = jest.fn()

        await setCardControls(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'restrictedCategories must be an array.' }))
    })
})

describe('exports.setCardSettings — restricted category resolution', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findByIdScoped.mockResolvedValue(activeCard)
        applyLimit.mockResolvedValue(activeCard)
        getSpendByCard.mockResolvedValue(new Map())
        safeAudit.mockResolvedValue(undefined)
    })

    it('resolves category names the same way setCardControls does', async () => {
        const req = adminReq({ body: { cardLimit: 10000, restrictedCategories: ['Lodging & Hotels'] } })
        const res = buildRes()
        const next = jest.fn()

        await setCardSettings(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(applyLimit).toHaveBeenCalledWith(
            '7',
            expect.objectContaining({ restrictedCategories: [findMerchantCategory('Lodging & Hotels')] }),
            1
        )
    })

    it('rejects an invalid category name', async () => {
        const req = adminReq({ body: { cardLimit: 10000, restrictedCategories: ['Nonexistent'] } })
        const next = jest.fn()

        await setCardSettings(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'One or more restricted categories are invalid.' }))
        expect(applyLimit).not.toHaveBeenCalled()
    })

    it('audits the actually-changed field — per-transaction limit only, not the untouched card limit (the reported bug)', async () => {
        const card = { ...activeCard, cardLimit: 60000, perTxnLimit: 5000, limitFrequency: 'monthly', atmEnabled: false }
        findByIdScoped.mockResolvedValue(card)
        const req = adminReq({ body: { cardLimit: 60000, perTxnLimit: 8000 } })

        await setCardSettings(req, buildRes(), jest.fn())

        expect(safeAudit).toHaveBeenCalledTimes(1)
        expect(safeAudit).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                category: 'Limits',
                description: 'Limits & controls updated — Per-transaction limit ₹5,000 → ₹8,000',
            })
        )
        const { description } = safeAudit.mock.calls[0][1]
        expect(description).not.toMatch(/card limit ₹60,000 → ₹60,000/i)
    })

    it('splits a combined limits+controls change into one Limits-tagged and one Controls-tagged audit row', async () => {
        const card = { ...activeCard, cardLimit: 60000, perTxnLimit: 5000, limitFrequency: 'monthly', atmEnabled: false, restrictedCategories: [] }
        findByIdScoped.mockResolvedValue(card)
        const req = adminReq({ body: { cardLimit: 80000, perTxnLimit: 5000, restrictedCategories: ['Food & Beverage'] } })

        await setCardSettings(req, buildRes(), jest.fn())

        expect(safeAudit).toHaveBeenCalledTimes(2)
        expect(safeAudit).toHaveBeenNthCalledWith(
            1,
            undefined,
            expect.objectContaining({
                category: 'Limits',
                description: expect.stringContaining('Card limit ₹60,000 → ₹80,000'),
            })
        )
        expect(safeAudit).toHaveBeenNthCalledWith(
            2,
            undefined,
            expect.objectContaining({
                category: 'Controls',
                description: expect.stringContaining('Restricted categories added: Food & Beverage'),
            })
        )
    })

    it('only writes a Controls-tagged row when just a merchant restriction changed, not Limits', async () => {
        const card = { ...activeCard, cardLimit: 60000, perTxnLimit: 5000, limitFrequency: 'monthly', atmEnabled: false, restrictedCategories: [] }
        findByIdScoped.mockResolvedValue(card)
        const req = adminReq({ body: { cardLimit: 60000, perTxnLimit: 5000, atmEnabled: false, restrictedCategories: ['Food & Beverage'] } })

        await setCardSettings(req, buildRes(), jest.fn())

        expect(safeAudit).toHaveBeenCalledTimes(1)
        expect(safeAudit).toHaveBeenCalledWith(
            undefined,
            expect.objectContaining({
                category: 'Controls',
                description: expect.stringContaining('Restricted categories added: Food & Beverage'),
            })
        )
    })
})

describe('exports.exportCardAudit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findByIdScoped.mockResolvedValue(activeCard)
    })

    it('returns a header-only CSV (200), not an error, when the card has no audit rows', async () => {
        findAllByCard.mockResolvedValue([])
        const res = buildRes()
        const next = jest.fn()

        await exportCardAudit(adminReq({ query: {} }), res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
        const csv = res.send.mock.calls[0][0]
        expect(csv).toBe(`${String.fromCharCode(0xfeff)}Date,Action,Description,Actor,Category`)
    })
})

describe('exports.getCardAudit', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findByIdScoped.mockResolvedValue(activeCard)
        findByCard.mockResolvedValue({ count: 0, rows: [] })
    })

    it('requests up to MAX_ITEMS_PER_PAGE rows by default, not the generic 10-row page size', async () => {
        const res = buildRes()

        await getCardAudit(adminReq({ query: {} }), res, jest.fn())

        expect(findByCard).toHaveBeenCalledWith(expect.objectContaining({ limit: MAX_ITEMS_PER_PAGE, offset: 0 }))
    })

    it('still honors an explicit itemsPerPage if the caller sends one', async () => {
        const res = buildRes()

        await getCardAudit(adminReq({ query: { itemsPerPage: '5', page: '2' } }), res, jest.fn())

        expect(findByCard).toHaveBeenCalledWith(expect.objectContaining({ limit: 5, offset: 5 }))
    })
})

describe('exports.getMerchantCategories', () => {
    it('returns the full canonical category list unmodified', async () => {
        const res = buildRes()

        await getMerchantCategories({}, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            data: { categories: expect.arrayContaining([findMerchantCategory('Food & Beverage')]) },
        }))
    })
})
