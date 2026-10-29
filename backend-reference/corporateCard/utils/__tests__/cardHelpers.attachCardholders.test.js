jest.mock('../sharedDirectory', () => ({
    getCardholdersByIdentities: jest.fn(),
    getCorporateCardUsersByIds: jest.fn(),
    findOwnerCardholder: jest.fn(),
}))
jest.mock('../cardCrypto', () => ({ decrypt: jest.fn((v) => v), encrypt: jest.fn() }))
jest.mock('../../models/use-cases/cardAuditLog', () => ({ writeAudit: jest.fn() }))
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }))

const { getCardholdersByIdentities, getCorporateCardUsersByIds } = require('../sharedDirectory')
const { attachCardholders } = require('../cardHelpers')

const corporateReq = () => ({ user: { role: 'CORPORATE', corporateId: 42 }, LogTraceId: 't' })
const adminReq = () => ({ user: { role: 'SYSTEM_USER', id: 1 }, LogTraceId: 't' })

const row = (userId, corporateId) => ({ id: `tx-${userId}`, userId, corporateId })

beforeEach(() => {
    jest.clearAllMocks()
    getCardholdersByIdentities.mockResolvedValue(new Map())
    getCorporateCardUsersByIds.mockResolvedValue(new Map())
})

describe('attachCardholders — a corporate session', () => {
    it('resolves through the session-scoped batch, as it always has', async () => {
        getCardholdersByIdentities.mockResolvedValue(new Map([['900', { id: 900, name: 'Aarav' }]]))
        const rows = [row(900, 42)]

        await attachCardholders(rows, corporateReq())

        expect(getCardholdersByIdentities).toHaveBeenCalled()
        expect(getCorporateCardUsersByIds).not.toHaveBeenCalled()
        expect(rows[0].cardholder).toEqual({ id: 900, name: 'Aarav' })
    })
})

describe('attachCardholders — a cross-corporate admin session', () => {
    it('names the cardholder, which the session-scoped batch could never do without a corporate', async () => {
        getCorporateCardUsersByIds.mockResolvedValue(new Map([['900', { id: 900, name: 'Leena Antony' }]]))
        const rows = [row(900, 1377)]

        await attachCardholders(rows, adminReq())

        expect(getCardholdersByIdentities).not.toHaveBeenCalled()
        expect(rows[0].cardholder).toEqual({ id: 900, name: 'Leena Antony' })
    })

    it('passes the row\'s own corporate, because the admin session carries none', async () => {
        await attachCardholders([row(900, 1377)], adminReq())

        expect(getCorporateCardUsersByIds).toHaveBeenCalledWith([900], '1377', expect.anything())
    })

    it('asks once per corporate, not once per row', async () => {
        const rows = [row(900, 1377), row(901, 1377), row(902, 642)]

        await attachCardholders(rows, adminReq())

        expect(getCorporateCardUsersByIds).toHaveBeenCalledTimes(2)
        expect(getCorporateCardUsersByIds).toHaveBeenCalledWith([900, 901], '1377', expect.anything())
        expect(getCorporateCardUsersByIds).toHaveBeenCalledWith([902], '642', expect.anything())
    })

    it('resolves each row against its own corporate, never another corporate\'s member', async () => {
        getCorporateCardUsersByIds.mockImplementation(async (ids, corporateId) =>
            (corporateId === '1377'
                ? new Map([['900', { id: 900, name: 'Leena Antony' }]])
                : new Map([['902', { id: 902, name: 'Rahul Gupta' }]])))
        const rows = [row(900, 1377), row(902, 642)]

        await attachCardholders(rows, adminReq())

        expect(rows[0].cardholder).toEqual({ id: 900, name: 'Leena Antony' })
        expect(rows[1].cardholder).toEqual({ id: 902, name: 'Rahul Gupta' })
    })

    it('leaves a row with no cardholder alone rather than asking for it', async () => {
        const rows = [{ id: 'tx-none', userId: null, corporateId: 1377 }]

        await attachCardholders(rows, adminReq())

        expect(getCorporateCardUsersByIds).not.toHaveBeenCalled()
        expect(rows[0].cardholder).toBeNull()
    })

    it('renders the rows without identity rather than failing when the directory is down', async () => {
        getCorporateCardUsersByIds.mockRejectedValue(new Error('others down'))
        const rows = [row(900, 1377)]

        await expect(attachCardholders(rows, adminReq())).resolves.toBe(rows)
        expect(rows[0].cardholder).toBeNull()
    })
})
