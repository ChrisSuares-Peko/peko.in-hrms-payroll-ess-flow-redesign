jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
}))

const { findByCorporate } = require('../../models/use-cases/corporateCardAdminApplication')
const { requireActiveAccount, CLOSED_MESSAGE } = require('../requireActiveAccount')

const call = async (user = { corporateId: 42 }) => {
    const next = jest.fn()
    await requireActiveAccount({ user, originalUrl: '/cards' }, {}, next)
    return next
}

beforeEach(() => {
    jest.clearAllMocks()
    findByCorporate.mockResolvedValue({ corporateId: 42, kybStatus: 'COMPLETED' })
})

describe('requireActiveAccount', () => {
    it('lets a corporate with a live application through', async () => {
        const next = await call()

        expect(next).toHaveBeenCalledWith()
    })

    // findByCorporate excludes soft-deleted rows, so a closed account reads as no application at all.
    it('refuses a corporate whose application has been closed', async () => {
        findByCorporate.mockResolvedValue(null)

        const next = await call()

        expect(next).toHaveBeenCalledWith(expect.objectContaining({
            status_code: 403,
            message: CLOSED_MESSAGE,
        }))
    })

    it('400s without a corporate context rather than letting the call through', async () => {
        const next = await call({})

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(findByCorporate).not.toHaveBeenCalled()
    })

    // A lookup failure must not become an open door.
    it('passes a lookup failure to the error handler instead of allowing the request', async () => {
        findByCorporate.mockRejectedValue(new Error('db down'))

        const next = await call()

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'db down' }))
    })
})
