const cardReceipt = require('../../entities/cardReceipt')
const { createReceipt, listActiveReceiptsByTransaction, findActiveReceiptById, softDeleteReceipt } = require('../cardReceipt')

jest.mock('../../entities/cardReceipt', () => ({
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
}))

describe('createReceipt', () => {
    beforeEach(() => jest.clearAllMocks())

    it('creates a row defaulted to ACTIVE status', async () => {
        const created = { id: 1 }
        cardReceipt.create.mockResolvedValue(created)

        const result = await createReceipt({ cardTransactionId: 5, fileUrl: 'https://example.com/f.pdf' })

        expect(cardReceipt.create).toHaveBeenCalledWith(expect.objectContaining({
            status: 'ACTIVE',
            cardTransactionId: 5,
            fileUrl: 'https://example.com/f.pdf',
        }))
        expect(result).toBe(created)
    })
})

describe('listActiveReceiptsByTransaction', () => {
    beforeEach(() => jest.clearAllMocks())

    it('only returns ACTIVE receipts for the given transaction', async () => {
        cardReceipt.findAll.mockResolvedValue([{ id: 1 }])

        const result = await listActiveReceiptsByTransaction(5)

        expect(cardReceipt.findAll).toHaveBeenCalledWith(expect.objectContaining({
            where: { cardTransactionId: 5, status: 'ACTIVE' },
        }))
        expect(result).toEqual([{ id: 1 }])
    })
})

describe('findActiveReceiptById', () => {
    beforeEach(() => jest.clearAllMocks())

    it('scopes the lookup to both the receipt id and its parent transaction', async () => {
        cardReceipt.findOne.mockResolvedValue({ id: 1 })

        const result = await findActiveReceiptById(1, 5)

        expect(cardReceipt.findOne).toHaveBeenCalledWith({ where: { id: 1, cardTransactionId: 5, status: 'ACTIVE' } })
        expect(result).toEqual({ id: 1 })
    })
})

describe('softDeleteReceipt', () => {
    beforeEach(() => jest.clearAllMocks())

    it('sets status to DELETED rather than destroying the row', async () => {
        const receipt = { update: jest.fn().mockResolvedValue() }

        await softDeleteReceipt(receipt)

        expect(receipt.update).toHaveBeenCalledWith({ status: 'DELETED' })
    })
})
