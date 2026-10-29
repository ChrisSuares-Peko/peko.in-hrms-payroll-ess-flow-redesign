jest.mock('../../../models/use-cases/corporateCardAdminApplication', () => ({
    findByCorporate: jest.fn(),
    upsertByCorporate: jest.fn(),
}))
jest.mock('../../../utils/cardHelpers', () => ({
    actorCredentialId: jest.fn(() => 7),
    adminActor: jest.fn(() => 'Aarav (Admin)'),
    safeAudit: jest.fn(),
}))

const applicationUC = require('../../../models/use-cases/corporateCardAdminApplication')
const { safeAudit } = require('../../../utils/cardHelpers')
const { getNotificationControls, updateNotificationControls } = require('../corporateSettings')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data
const req = (body = {}) => ({ user: { corporateId: 42 }, body })

const ALL_ON = {
    requireReceipts: true,
    autoDeclineOverLimit: true,
    notifyPendingKyc: true,
    weeklySpendDigest: true,
    dailyBalanceReminder: true,
    walletTopupGuide: true,
}

beforeEach(() => {
    jest.clearAllMocks()
    applicationUC.findByCorporate.mockResolvedValue({ corporateId: 42, notificationControls: null })
    applicationUC.upsertByCorporate.mockResolvedValue({})
})

describe('getNotificationControls', () => {
    it('400s without a corporate context', async () => {
        const next = jest.fn()
        await getNotificationControls({ user: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    // A corporate that never touched the toggles must still get a full, on-by-default set.
    it('falls back to defaults when nothing is stored', async () => {
        const res = buildRes()
        await getNotificationControls(req(), res, jest.fn())

        expect(payload(res).notificationControls).toEqual(ALL_ON)
    })

    it('returns what is stored', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            notificationControls: { ...ALL_ON, weeklySpendDigest: false },
        })
        const res = buildRes()

        await getNotificationControls(req(), res, jest.fn())

        expect(payload(res).notificationControls.weeklySpendDigest).toBe(false)
    })

    // A partially-written blob must not leave the UI with undefined switches.
    it('fills in any key missing from a partial blob', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            notificationControls: { requireReceipts: false },
        })
        const res = buildRes()

        await getNotificationControls(req(), res, jest.fn())

        expect(payload(res).notificationControls).toEqual({ ...ALL_ON, requireReceipts: false })
    })

    it('does not fail for a corporate with no application row yet', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const res = buildRes()

        await getNotificationControls(req(), res, jest.fn())

        expect(payload(res).notificationControls).toEqual(ALL_ON)
    })
})

describe('updateNotificationControls', () => {
    it('persists one toggle without disturbing the others', async () => {
        applicationUC.findByCorporate.mockResolvedValue({
            notificationControls: { ...ALL_ON, requireReceipts: false },
        })

        await updateNotificationControls(req({ weeklySpendDigest: false }), buildRes(), jest.fn())

        expect(applicationUC.upsertByCorporate).toHaveBeenCalledWith(42, {
            notificationControls: { ...ALL_ON, requireReceipts: false, weeklySpendDigest: false },
        })
    })

    it('writes the full set so the column is never partial', async () => {
        await updateNotificationControls(req({ requireReceipts: false }), buildRes(), jest.fn())

        const [, fields] = applicationUC.upsertByCorporate.mock.calls[0]
        expect(Object.keys(fields.notificationControls).sort()).toEqual(
            Object.keys(ALL_ON).sort()
        )
    })

    it('refuses a key that is not a known setting', async () => {
        const next = jest.fn()
        await updateNotificationControls(req({ deleteEverything: true }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    // Without this, a typo'd key rides along beside a valid one and is silently dropped.
    it('refuses the whole payload when a valid key is mixed with an unknown one', async () => {
        const next = jest.fn()
        await updateNotificationControls(
            req({ requireReceipts: false, deleteEverything: true }),
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('Unknown setting') })
        )
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('refuses a non-boolean value', async () => {
        const next = jest.fn()
        await updateNotificationControls(req({ requireReceipts: 'yes' }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('refuses an empty body rather than writing nothing', async () => {
        const next = jest.fn()
        await updateNotificationControls(req({}), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    // findByCorporate hides a closed account, so this also blocks a closed corporate.
    it('refuses when there is no live application', async () => {
        applicationUC.findByCorporate.mockResolvedValue(null)
        const next = jest.fn()

        await updateNotificationControls(req({ requireReceipts: false }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
        expect(applicationUC.upsertByCorporate).not.toHaveBeenCalled()
    })

    it('audits what changed', async () => {
        await updateNotificationControls(req({ notifyPendingKyc: false }), buildRes(), jest.fn())

        expect(safeAudit).toHaveBeenCalledWith(undefined, expect.objectContaining({
            corporateId: 42,
            action: 'SETTINGS_UPDATED',
            metadata: { changed: { notifyPendingKyc: false } },
        }))
    })

    it('returns the merged set so the UI does not need a refetch', async () => {
        const res = buildRes()
        await updateNotificationControls(req({ requireReceipts: false }), res, jest.fn())

        expect(payload(res).notificationControls).toEqual({ ...ALL_ON, requireReceipts: false })
    })
})
