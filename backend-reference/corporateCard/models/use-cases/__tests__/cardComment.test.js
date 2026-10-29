const cardTransaction = require('../../entities/cardTransaction')
const { appendComment, listComments } = require('../cardComment')

jest.mock('../../entities/cardTransaction', () => ({
    findOne: jest.fn(),
}))

jest.mock('../../../configs/database/index', () => ({
    transaction: jest.fn((cb) => cb({ LOCK: { UPDATE: 'UPDATE' } })),
}))

describe('appendComment', () => {
    beforeEach(() => jest.clearAllMocks())

    it('appends the first comment when comments is null', async () => {
        const update = jest.fn().mockResolvedValue()
        cardTransaction.findOne.mockResolvedValue({ id: 1, comments: null, update })
        const entry = { id: 'c_1', message: 'hi' }

        const result = await appendComment(1, entry)

        expect(update).toHaveBeenCalledWith({ comments: [entry] }, expect.objectContaining({ transaction: expect.anything() }))
        expect(result).toEqual([entry])
    })

    it('appends to an existing comments array without dropping earlier entries', async () => {
        const existing = [{ id: 'c_0', message: 'first' }]
        const update = jest.fn().mockResolvedValue()
        cardTransaction.findOne.mockResolvedValue({ id: 1, comments: existing, update })
        const entry = { id: 'c_1', message: 'second' }

        const result = await appendComment(1, entry)

        expect(update).toHaveBeenCalledWith({ comments: [...existing, entry] }, expect.anything())
        expect(result).toEqual([...existing, entry])
    })

    it('locks the row (SELECT ... FOR UPDATE) rather than doing a plain read', async () => {
        const update = jest.fn().mockResolvedValue()
        cardTransaction.findOne.mockResolvedValue({ id: 1, comments: [], update })

        await appendComment(1, { id: 'c_1' })

        expect(cardTransaction.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: 1 },
            lock: 'UPDATE',
        }))
    })

    it('returns null and never writes once maxComments is reached', async () => {
        const update = jest.fn()
        const existing = new Array(200).fill({ id: 'x' })
        cardTransaction.findOne.mockResolvedValue({ id: 1, comments: existing, update })

        const result = await appendComment(1, { id: 'c_new' }, { maxComments: 200 })

        expect(result).toBeNull()
        expect(update).not.toHaveBeenCalled()
    })
})

describe('listComments', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns the comments array for the transaction', async () => {
        cardTransaction.findOne.mockResolvedValue({ comments: [{ id: 'c_1' }] })

        const result = await listComments(1)

        expect(cardTransaction.findOne).toHaveBeenCalledWith({ where: { id: 1 }, attributes: ['comments'] })
        expect(result).toEqual([{ id: 'c_1' }])
    })

    it('returns an empty array when comments is null', async () => {
        cardTransaction.findOne.mockResolvedValue({ comments: null })

        const result = await listComments(1)

        expect(result).toEqual([])
    })

    it('returns an empty array when the transaction row is not found', async () => {
        cardTransaction.findOne.mockResolvedValue(null)

        const result = await listComments(999)

        expect(result).toEqual([])
    })
})
