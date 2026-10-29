jest.mock('../../models/use-cases/cardholderKyc', () => ({ findStalePending: jest.fn() }))
jest.mock('../../models/use-cases/cardTransaction', () => ({ getAuthorizedSpendSummary: jest.fn() }))
jest.mock('../../models/use-cases/corporateCardAdminApplication', () => ({
    findAllApplicationCorporateIds: jest.fn(),
    findByCorporate: jest.fn(),
}))
jest.mock('../../utils/sharedDirectory', () => ({
    getCorporatesByIds: jest.fn(),
    getCardUsersByIds: jest.fn(),
}))
jest.mock('../../utils/emailer', () => ({ email: jest.fn() }))
jest.mock('../../utils/cacheDataMethods', () => ({ client: { set: jest.fn(), del: jest.fn() } }))

const { findStalePending } = require('../../models/use-cases/cardholderKyc')
const { getAuthorizedSpendSummary } = require('../../models/use-cases/cardTransaction')
const applicationUC = require('../../models/use-cases/corporateCardAdminApplication')
const { getCorporatesByIds, getCardUsersByIds } = require('../../utils/sharedDirectory')
const emailer = require('../../utils/emailer')
const { client } = require('../../utils/cacheDataMethods')
const { sweepPendingKycNotices, sweepWeeklySpendDigests } = require('../notificationJobs')

const ALL_ON = {
    requireReceipts: true,
    autoDeclineOverLimit: true,
    notifyPendingKyc: true,
    weeklySpendDigest: true,
}

const kyc = (over = {}) => ({ id: 1, corporateId: 42, mobileNumber: '9876543210', kycStatus: 'PENDING', ...over })
const directory = (over = {}) =>
    new Map([['42', { companyName: 'Acme Ltd', email: 'ops@acme.test', ...over }]])

beforeEach(() => {
    jest.clearAllMocks()
    // clearAllMocks keeps implementations, so a throwing emailer from one test would leak into the next.
    emailer.email.mockImplementation(() => undefined)
    client.set.mockResolvedValue('OK')
    client.del.mockResolvedValue(1)
    findStalePending.mockResolvedValue([])
    applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, notificationControls: ALL_ON })
    applicationUC.findAllApplicationCorporateIds.mockResolvedValue(['42'])
    getCorporatesByIds.mockResolvedValue(directory())
    getCardUsersByIds.mockResolvedValue(new Map())
    getAuthorizedSpendSummary.mockResolvedValue({ total: 125000, count: 12 })
})

describe('sweepPendingKycNotices', () => {
    it('does nothing when no KYC is stale', async () => {
        const counters = await sweepPendingKycNotices({})

        expect(counters.stale).toBe(0)
        expect(emailer.email).not.toHaveBeenCalled()
    })

    it('only looks at KYC older than 48 hours, and only unfinished ones', async () => {
        await sweepPendingKycNotices({})

        const args = findStalePending.mock.calls[0][0]
        expect(args.statuses).toEqual(['INITIATED', 'PENDING'])
        const hoursAgo = (Date.now() - args.olderThan.getTime()) / 3600000
        expect(hoursAgo).toBeGreaterThan(47.9)
        expect(hoursAgo).toBeLessThan(48.1)
    })

    it('emails the corporate once for all of its stale cardholders', async () => {
        findStalePending.mockResolvedValue([kyc({ id: 1 }), kyc({ id: 2, mobileNumber: '9000000000' })])

        const counters = await sweepPendingKycNotices({})

        expect(emailer.email).toHaveBeenCalledTimes(1)
        expect(counters.emailed).toBe(1)
        const [, to, subject, body] = emailer.email.mock.calls[0]
        expect(to).toBe('ops@acme.test')
        expect(subject).toContain('2 cardholders')
        expect(body).toContain('9000000000')
    })

    // The flag is the whole point of the feature.
    it('sends nothing when the corporate turned the notice off', async () => {
        findStalePending.mockResolvedValue([kyc()])
        applicationUC.findByCorporate.mockResolvedValue({
            notificationControls: { ...ALL_ON, notifyPendingKyc: false },
        })

        const counters = await sweepPendingKycNotices({})

        expect(emailer.email).not.toHaveBeenCalled()
        expect(counters.skippedDisabled).toBe(1)
    })

    it('treats a closed corporate as opted out rather than emailing it', async () => {
        findStalePending.mockResolvedValue([kyc()])
        applicationUC.findByCorporate.mockResolvedValue(null)

        await sweepPendingKycNotices({})

        expect(emailer.email).not.toHaveBeenCalled()
    })

    // Running the sweep twice must not nag the same corporate again.
    it('does not re-notify a cardholder already nudged', async () => {
        findStalePending.mockResolvedValue([kyc()])
        client.set.mockResolvedValue(null)

        const counters = await sweepPendingKycNotices({})

        expect(emailer.email).not.toHaveBeenCalled()
        expect(counters.alreadySent).toBe(1)
    })

    // Otherwise a missing email address would silently burn the one-shot claim forever.
    it('releases the claim when there is no address to send to', async () => {
        findStalePending.mockResolvedValue([kyc({ id: 7 })])
        getCorporatesByIds.mockResolvedValue(new Map())

        const counters = await sweepPendingKycNotices({})

        expect(counters.failed).toBe(1)
        expect(client.del).toHaveBeenCalledWith('cc:job:kycnudge:7')
    })

    it('releases the claim when sending throws', async () => {
        findStalePending.mockResolvedValue([kyc({ id: 7 })])
        emailer.email.mockImplementation(() => { throw new Error('smtp down') })

        const counters = await sweepPendingKycNotices({})

        expect(counters.failed).toBe(1)
        expect(client.del).toHaveBeenCalledWith('cc:job:kycnudge:7')
    })

    describe('cardholder identity in the notice', () => {
        it('names each cardholder instead of listing a bare mobile number', async () => {
            findStalePending.mockResolvedValue([kyc({ id: 1, userId: '99' })])
            getCardUsersByIds.mockResolvedValue(new Map([['99', { id: '99', name: 'Aarav Sharma' }]]))

            await sweepPendingKycNotices({})

            const [, , , body] = emailer.email.mock.calls[0]
            expect(body).toContain('Aarav Sharma')
            expect(body).toContain('9876543210')
        })

        it('asks the directory only once for all of the corporate\'s cardholders', async () => {
            findStalePending.mockResolvedValue([
                kyc({ id: 1, userId: '99' }),
                kyc({ id: 2, userId: '100', mobileNumber: '9000000000' }),
            ])

            await sweepPendingKycNotices({})

            expect(getCardUsersByIds).toHaveBeenCalledTimes(1)
            expect(getCardUsersByIds.mock.calls[0][0]).toEqual(['99', '100'])
        })

        it('skips the lookup when no row has a cardholder id', async () => {
            findStalePending.mockResolvedValue([kyc({ id: 1, userId: null })])

            await sweepPendingKycNotices({})

            expect(getCardUsersByIds).not.toHaveBeenCalled()
            expect(emailer.email).toHaveBeenCalledTimes(1)
        })

        // A directory outage must not cost the corporate the reminder itself.
        it('still sends the notice when the name lookup fails', async () => {
            findStalePending.mockResolvedValue([kyc({ id: 1, userId: '99' })])
            getCardUsersByIds.mockRejectedValue(new Error('directory down'))

            const counters = await sweepPendingKycNotices({})

            expect(counters.emailed).toBe(1)
            const [, , , body] = emailer.email.mock.calls[0]
            expect(body).toContain('9876543210')
            expect(body).toContain('Name not on file')
        })
    })
})

describe('sweepWeeklySpendDigests', () => {
    it('emails a corporate that spent in the period', async () => {
        const counters = await sweepWeeklySpendDigests({})

        expect(counters.emailed).toBe(1)
        const [, to, subject, body] = emailer.email.mock.calls[0]
        expect(to).toBe('ops@acme.test')
        expect(subject).toContain('weekly')
        expect(body).toContain('1,25,000.00')
        expect(body).toContain('12 authorised transactions')
    })

    it('asks only for the last seven days of authorised spend', async () => {
        await sweepWeeklySpendDigests({})

        const { from, to } = getAuthorizedSpendSummary.mock.calls[0][0]
        const days = (to.getTime() - from.getTime()) / 86400000
        expect(days).toBeGreaterThan(6.9)
        expect(days).toBeLessThan(7.1)
    })

    it('sends nothing when the corporate turned the digest off', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            notificationControls: { ...ALL_ON, weeklySpendDigest: false },
        })

        const counters = await sweepWeeklySpendDigests({})

        expect(emailer.email).not.toHaveBeenCalled()
        expect(counters.skippedDisabled).toBe(1)
    })

    // An empty digest is worse than no digest.
    it('skips a corporate with no spend in the period', async () => {
        getAuthorizedSpendSummary.mockResolvedValue({ total: 0, count: 0 })

        const counters = await sweepWeeklySpendDigests({})

        expect(emailer.email).not.toHaveBeenCalled()
        expect(counters.skippedNoSpend).toBe(1)
    })

    it('sends only once per corporate per period', async () => {
        client.set.mockResolvedValue(null)

        const counters = await sweepWeeklySpendDigests({})

        expect(emailer.email).not.toHaveBeenCalled()
        expect(counters.alreadySent).toBe(1)
    })

    it('releases the period claim when sending throws, so a retry can send', async () => {
        emailer.email.mockImplementation(() => { throw new Error('smtp down') })

        const counters = await sweepWeeklySpendDigests({})

        expect(counters.failed).toBe(1)
        expect(client.del).toHaveBeenCalledWith(expect.stringContaining('cc:job:digest:42:'))
    })
})
