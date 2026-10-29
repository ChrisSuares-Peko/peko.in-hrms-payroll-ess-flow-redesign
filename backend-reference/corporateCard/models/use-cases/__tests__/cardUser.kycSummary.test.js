jest.mock('../../entities/cardholderKyc', () => ({ findAll: jest.fn() }))
jest.mock('../../entities/cardIssuance', () => ({ findAll: jest.fn() }))
jest.mock('../cardholderKyc', () => ({ findByMobiles: jest.fn() }))
jest.mock('../../../utils/sharedDirectory', () => ({
    listCardUserIdentities: jest.fn(),
    findAndCountCardUsers: jest.fn(),
    findCardholderById: jest.fn(),
    findCardUserScoped: jest.fn(),
}))

const cardholderKyc = require('../../entities/cardholderKyc')
const { findByMobiles } = require('../cardholderKyc')
const sharedDirectory = require('../../../utils/sharedDirectory')
const { getKycSummary } = require('../cardUser')

const member = (id, mobileNo) => ({ id: String(id), mobileNo })

describe('getKycSummary', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        cardholderKyc.findAll.mockResolvedValue([])
        findByMobiles.mockResolvedValue([])
    })

    // The bug this file exists for: cardUser imported actsAsOwner from cardHelpers, which imports
    // findCardholderById back from cardUser. The destructured binding was undefined at load time, so this
    // threw "actsAsOwner is not a function" on its first line — for every corporate, every time — and the
    // dashboard's .catch turned that into a confident 0/0.
    it('does not depend on cardHelpers, so it cannot be broken by a require cycle', () => {
        const source = require('fs').readFileSync(require.resolve('../cardUser'), 'utf8')

        expect(source).not.toMatch(/require\(['"][^'"]*cardHelpers['"]\)/)
    })

    it('runs when cardHelpers is loaded first, which is the production order', async () => {
        require('../../../utils/cardHelpers')
        sharedDirectory.listCardUserIdentities.mockResolvedValue([member(1, '9876543210')])

        await expect(getKycSummary({ corporateId: 42, includeOwner: true })).resolves.toEqual({
            total: 1, verified: 0, pending: 1,
        })
    })

    it('counts nothing when the corporate has no members', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([])

        await expect(getKycSummary({ corporateId: 42 })).resolves.toEqual({ total: 0, verified: 0, pending: 0 })
        expect(findByMobiles).not.toHaveBeenCalled()
    })

    it('passes includeOwner straight through, so the KPI counts the same rows the People table shows', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([])

        await getKycSummary({ corporateId: 42, includeOwner: true, req: { x: 1 } })

        expect(sharedDirectory.listCardUserIdentities).toHaveBeenCalledWith({ includeOwner: true, req: { x: 1 } })
    })

    // KYC is unique on mobileNumber, so this is the key that tells the truth.
    it('counts a member verified from their mobile', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([member(1, '9876543210'), member(2, '9000000002')])
        findByMobiles.mockResolvedValue([{ mobileNumber: '9876543210', kycStatus: 'COMPLETED' }])

        await expect(getKycSummary({ corporateId: 42 })).resolves.toEqual({ total: 2, verified: 1, pending: 1 })
    })

    // The case the old id-only count got wrong: one human, two cardholder identities, one KYC row whose
    // userId belongs to whichever identity polled last. Both must read verified.
    it('counts BOTH identities of one person as verified when they share a mobile', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([member(1, '9876543210'), member(7, '9876543210')])
        cardholderKyc.findAll.mockResolvedValue([{ userId: '7', kycStatus: 'COMPLETED' }])
        findByMobiles.mockResolvedValue([{ mobileNumber: '9876543210', kycStatus: 'COMPLETED' }])

        await expect(getKycSummary({ corporateId: 42 })).resolves.toEqual({ total: 2, verified: 2, pending: 0 })
    })

    it('falls back to the id-keyed status for a member with no mobile recorded', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([member(1, null)])
        cardholderKyc.findAll.mockResolvedValue([{ userId: '1', kycStatus: 'COMPLETED' }])

        await expect(getKycSummary({ corporateId: 42 })).resolves.toEqual({ total: 1, verified: 1, pending: 0 })
        expect(findByMobiles).not.toHaveBeenCalled()
    })

    it('ignores whitespace differences between the directory mobile and the KYC row', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([member(1, ' 9876543210 ')])
        findByMobiles.mockResolvedValue([{ mobileNumber: '9876543210', kycStatus: 'COMPLETED' }])

        await expect(getKycSummary({ corporateId: 42 })).resolves.toEqual({ total: 1, verified: 1, pending: 0 })
    })

    it.each([['PENDING'], ['INITIATED'], ['REJECTED']])('does not count %s as verified', async (kycStatus) => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([member(1, '9876543210')])
        findByMobiles.mockResolvedValue([{ mobileNumber: '9876543210', kycStatus }])

        await expect(getKycSummary({ corporateId: 42 })).resolves.toEqual({ total: 1, verified: 0, pending: 1 })
    })

    it('scopes the mobile lookup to the corporate', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([member(1, '9876543210')])

        await getKycSummary({ corporateId: 42 })

        expect(findByMobiles).toHaveBeenCalledWith(42, ['9876543210'])
    })

    it('always leaves total = verified + pending', async () => {
        sharedDirectory.listCardUserIdentities.mockResolvedValue([
            member(1, '9000000001'), member(2, '9000000002'), member(3, null),
        ])
        findByMobiles.mockResolvedValue([{ mobileNumber: '9000000001', kycStatus: 'COMPLETED' }])

        const summary = await getKycSummary({ corporateId: 42 })

        expect(summary.verified + summary.pending).toBe(summary.total)
    })
})
