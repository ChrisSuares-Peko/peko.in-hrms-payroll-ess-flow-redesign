jest.mock('../../utils/cacheDataMethods', () => ({
    setValue: jest.fn(),
    getValue: jest.fn(),
    scanKeys: jest.fn(),
    getTtl: jest.fn(),
}))
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../models/use-cases/corporateUser', () => ({ findOne: jest.fn() }))
jest.mock('../../models/use-cases/user', () => ({ findOneByCredentialId: jest.fn() }))
jest.mock('../../models/entities/corporateUser', () => ({}))
jest.mock('../../models/use-cases/access_codes', () => ({ findByCorporateUserId: jest.fn() }))
jest.mock('../../models/entities/wallet', () => ({}))
jest.mock('../../models/use-cases/subCorporateUser', () => ({ findOneSubCorporateByCredentialId: jest.fn() }))
jest.mock('../../models/use-cases/credential', () => ({ findOneCredential: jest.fn() }))
jest.mock('../../models/use-cases/systemUser', () => ({ findRole: jest.fn() }))

const { setValue, getValue, scanKeys, getTtl } = require('../../utils/cacheDataMethods')
const { revokeSessionService } = require('../authHelper')

const CARDS = 'Corporate Cards'

const blob = (memberships) => JSON.stringify({
    id: 5150,
    role: 'USER',
    employeeProfileId: 77,
    serviceMemberships: memberships,
})

const held = () => ([
    { label: 'Payroll', role: 'Employee', status: 'ACTIVE', hasAccess: true },
    { label: CARDS, role: 'Admin', status: 'ACTIVE', hasAccess: true },
])

const writtenFor = (key) => {
    const call = setValue.mock.calls.find(([k]) => k === key)
    return call ? JSON.parse(call[2]) : null
}

const entryOf = (sessionData, label) =>
    sessionData.serviceMemberships.find((entry) => entry.label === label)

beforeEach(() => {
    jest.clearAllMocks()
    scanKeys.mockResolvedValue(['userData_5150_a', 'userData_5150_b'])
    getValue.mockResolvedValue(blob(held()))
    getTtl.mockResolvedValue(3400)
    setValue.mockResolvedValue(undefined)
})

describe('revokeSessionService', () => {
    it('looks only at the sessions of the credential it was given', async () => {
        await revokeSessionService(5150, CARDS)

        expect(scanKeys).toHaveBeenCalledWith('userData_5150_*')
    })

    it('closes the service gate on every live session and reports how many', async () => {
        const revoked = await revokeSessionService(5150, CARDS)

        expect(revoked).toBe(2)
        for (const key of ['userData_5150_a', 'userData_5150_b']) {
            expect(entryOf(writtenFor(key), CARDS)).toEqual(
                expect.objectContaining({ hasAccess: false, status: 'INACTIVE' })
            )
        }
    })

    it('leaves the other services on the session untouched, so nobody is logged out', async () => {
        await revokeSessionService(5150, CARDS)

        expect(entryOf(writtenFor('userData_5150_a'), 'Payroll')).toEqual(
            expect.objectContaining({ hasAccess: true, status: 'ACTIVE' })
        )
    })

    it('keeps the remaining lifetime rather than extending the session', async () => {
        await revokeSessionService(5150, CARDS)

        expect(setValue).toHaveBeenCalledWith('userData_5150_a', 3400, expect.any(String))
    })

    it('writes a session with no expiry back without one', async () => {
        scanKeys.mockResolvedValue(['userData_5150_a'])
        getTtl.mockResolvedValue(-1)

        await revokeSessionService(5150, CARDS)

        expect(setValue).toHaveBeenCalledWith('userData_5150_a', 0, expect.any(String))
    })

    it('skips a session that expired between the scan and the read', async () => {
        scanKeys.mockResolvedValue(['userData_5150_a'])
        getTtl.mockResolvedValue(-2)

        expect(await revokeSessionService(5150, CARDS)).toBe(0)
        expect(setValue).not.toHaveBeenCalled()
    })

    it('skips a session that no longer holds the service', async () => {
        scanKeys.mockResolvedValue(['userData_5150_a'])
        getValue.mockResolvedValue(blob([{ label: 'Payroll', status: 'ACTIVE', hasAccess: true }]))

        expect(await revokeSessionService(5150, CARDS)).toBe(0)
        expect(setValue).not.toHaveBeenCalled()
    })

    it('skips an unreadable session rather than overwriting it', async () => {
        scanKeys.mockResolvedValue(['userData_5150_a'])
        getValue.mockResolvedValue('not json')

        expect(await revokeSessionService(5150, CARDS)).toBe(0)
        expect(setValue).not.toHaveBeenCalled()
    })

    it('matches the label however it is cased or spaced', async () => {
        scanKeys.mockResolvedValue(['userData_5150_a'])
        getValue.mockResolvedValue(blob([{ label: ' corporate cards ', status: 'ACTIVE', hasAccess: true }]))

        expect(await revokeSessionService(5150, CARDS)).toBe(1)
    })

    it('does nothing without a credential or a label', async () => {
        expect(await revokeSessionService(null, CARDS)).toBe(0)
        expect(await revokeSessionService(5150, null)).toBe(0)
        expect(scanKeys).not.toHaveBeenCalled()
    })
})
