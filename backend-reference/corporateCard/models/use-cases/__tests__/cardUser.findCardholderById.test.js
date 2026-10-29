const sharedDirectory = require('../../../utils/sharedDirectory')
const { findCardholderById } = require('../cardUser')

jest.mock('../../../utils/sharedDirectory', () => ({ findCardholderById: jest.fn() }))

describe('findCardholderById', () => {
    beforeEach(() => jest.clearAllMocks())

    it('delegates the single-cardholder identity lookup to the shared directory', async () => {
        const row = { id: '99', name: 'Aarav Sharma', email: 'aarav@peko.in', role: 'User' }
        sharedDirectory.findCardholderById.mockResolvedValue(row)

        const req = { LogTraceId: 'trace-1' }
        const result = await findCardholderById(99, req)

        expect(sharedDirectory.findCardholderById).toHaveBeenCalledWith(99, req)
        expect(result).toBe(row)
    })

    it('returns null when no cardholder matches', async () => {
        sharedDirectory.findCardholderById.mockResolvedValue(null)

        const result = await findCardholderById(999, {})

        expect(result).toBeNull()
    })
})
