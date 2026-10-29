const cardholderKyc = require('../../entities/cardholderKyc')
const { upsertByMobile, upsertByMobileIfNewer, isEventNewer, findByCardholderUserId } = require('../cardholderKyc')

jest.mock('../../entities/cardholderKyc', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
}))

describe('isEventNewer', () => {
    it('treats a missing existing timestamp as newer (first event)', () => {
        expect(isEventNewer('2026-07-01T10:00:00Z', null)).toBe(true)
    })

    it('treats a missing candidate timestamp as newer (cannot compare, so accept)', () => {
        expect(isEventNewer(undefined, '2026-07-01T10:00:00Z')).toBe(true)
    })

    it('treats unparseable timestamps as newer (cannot compare, so accept)', () => {
        expect(isEventNewer('not-a-date', '2026-07-01T10:00:00Z')).toBe(true)
    })

    it('returns true when candidate is strictly after existing', () => {
        expect(isEventNewer('2026-07-02T10:00:00Z', '2026-07-01T10:00:00Z')).toBe(true)
    })

    it('returns true when candidate equals existing (idempotent redelivery)', () => {
        expect(isEventNewer('2026-07-01T10:00:00Z', '2026-07-01T10:00:00Z')).toBe(true)
    })

    it('returns false when candidate is strictly before existing (stale/out-of-order)', () => {
        expect(isEventNewer('2026-06-30T10:00:00Z', '2026-07-01T10:00:00Z')).toBe(false)
    })
})

describe('upsertByMobile', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('updates the existing row when found', async () => {
        const existing = { update: jest.fn().mockResolvedValue() }
        cardholderKyc.findOne.mockResolvedValue(existing)

        const result = await upsertByMobile('9999999999', { kycStatus: 'COMPLETED' })

        expect(existing.update).toHaveBeenCalledWith({ kycStatus: 'COMPLETED' })
        expect(result).toBe(existing)
    })

    it('creates a new row when none exists', async () => {
        cardholderKyc.findOne.mockResolvedValue(null)
        const created = { id: 1 }
        cardholderKyc.create.mockResolvedValue(created)

        const result = await upsertByMobile('9999999999', { kycStatus: 'COMPLETED' })

        expect(cardholderKyc.create).toHaveBeenCalledWith({ mobileNumber: '9999999999', kycStatus: 'COMPLETED' })
        expect(result).toBe(created)
    })

    it('falls back to updating the concurrently-created row on a unique constraint race', async () => {
        cardholderKyc.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ update: jest.fn().mockResolvedValue() })
        cardholderKyc.create.mockRejectedValue({ name: 'SequelizeUniqueConstraintError' })

        const result = await upsertByMobile('9999999999', { kycStatus: 'COMPLETED' })

        expect(result.update).toHaveBeenCalledWith({ kycStatus: 'COMPLETED' })
    })
})

describe('upsertByMobileIfNewer', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('applies the update when there is no existing record', async () => {
        cardholderKyc.findOne.mockResolvedValue(null)
        cardholderKyc.create.mockResolvedValue({ id: 1 })

        const result = await upsertByMobileIfNewer('9999999999', { kycStatus: 'COMPLETED', lastEventAt: '2026-07-01T10:00:00Z' })

        expect(result.applied).toBe(true)
    })

    it('applies the update when the incoming event is newer', async () => {
        const existing = { lastEventAt: '2026-07-01T10:00:00Z', update: jest.fn().mockResolvedValue() }
        cardholderKyc.findOne.mockResolvedValue(existing)

        const result = await upsertByMobileIfNewer('9999999999', { kycStatus: 'REJECTED', lastEventAt: '2026-07-02T10:00:00Z' })

        expect(existing.update).toHaveBeenCalled()
        expect(result.applied).toBe(true)
    })

    it('skips the update when the incoming event is older than the stored one', async () => {
        const existing = { lastEventAt: '2026-07-02T10:00:00Z', update: jest.fn() }
        cardholderKyc.findOne.mockResolvedValue(existing)

        const result = await upsertByMobileIfNewer('9999999999', { kycStatus: 'REJECTED', lastEventAt: '2026-07-01T10:00:00Z' })

        expect(existing.update).not.toHaveBeenCalled()
        expect(result.applied).toBe(false)
        expect(result.record).toBe(existing)
    })
})

describe('findByCardholderUserId', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    const completedRow = { mobileNumber: '9876543210', kycStatus: 'COMPLETED', userId: 99 }
    const staleRow = { mobileNumber: '9000000000', kycStatus: 'INITIATED', userId: 99 }

    it('asks for a COMPLETED row first, newest first', async () => {
        cardholderKyc.findOne.mockResolvedValueOnce(completedRow)

        const row = await findByCardholderUserId({ corporateId: 42, userId: 99 })

        expect(row).toBe(completedRow)
        expect(cardholderKyc.findOne).toHaveBeenCalledTimes(1)
        expect(cardholderKyc.findOne).toHaveBeenCalledWith(expect.objectContaining({
            where: { corporateId: 42, userId: 99, kycStatus: 'COMPLETED' },
            order: [['id', 'DESC']],
        }))
    })

    /**
     * The unique index is on mobileNumber alone, so one cardholder can own several rows — a mobile change
     * or a re-KYC leaves an older INITIATED row behind. Returning that one made a verified cardholder look
     * unverified and refused a card that had already been paid for.
     */
    it('does not settle for a stale row while a completed one exists', async () => {
        cardholderKyc.findOne.mockResolvedValueOnce(completedRow)

        const row = await findByCardholderUserId({ corporateId: 42, userId: 99 })

        expect(row.kycStatus).toBe('COMPLETED')
        expect(row.mobileNumber).toBe('9876543210')
    })

    it('falls back to the newest row so the caller can report the real KYC state', async () => {
        cardholderKyc.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(staleRow)

        const row = await findByCardholderUserId({ corporateId: 42, userId: 99 })

        expect(row).toBe(staleRow)
        expect(cardholderKyc.findOne).toHaveBeenLastCalledWith(expect.objectContaining({
            where: { corporateId: 42, userId: 99 },
        }))
    })

    it.each([
        ['no corporate', { corporateId: null, userId: 99 }],
        ['no cardholder', { corporateId: 42, userId: null }],
    ])('never queries unscoped when there is %s', async (_label, args) => {
        await expect(findByCardholderUserId(args)).resolves.toBeNull()

        expect(cardholderKyc.findOne).not.toHaveBeenCalled()
    })
})

// KYC verifies a person against a handset, not an employment: mobileNumber is the table's only UNIQUE, so
// one human has one row however many times they are invited. Re-inviting someone already verified must
// therefore resolve that row rather than start a second verification the vendor would refuse.
describe('findByCardholderUserId — an already-verified person, newly invited', () => {
    const COMPLETED = { mobileNumber: '9876543210', kycStatus: 'COMPLETED', userId: 900 }

    beforeEach(() => jest.clearAllMocks())

    it('resolves by identity first, without touching the handset', async () => {
        cardholderKyc.findOne.mockResolvedValueOnce(COMPLETED)

        const result = await findByCardholderUserId({ corporateId: 42, userId: 900, mobileNumber: '9876543210' })

        expect(result).toEqual(COMPLETED)
        expect(cardholderKyc.findOne).toHaveBeenCalledTimes(1)
    })

    it('finds a completed row filed under a previous identity, by handset', async () => {
        const row = { ...COMPLETED, userId: 500, corporateId: 7, update: jest.fn() }
        cardholderKyc.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(row)

        const result = await findByCardholderUserId({ corporateId: 42, userId: 901, mobileNumber: '9876543210' })

        expect(result).toEqual({ mobileNumber: '9876543210', kycStatus: 'COMPLETED', userId: 901 })
    })

    // Claiming is what makes every later id-keyed read — the People list, the physical-card preflight —
    // find it without re-resolving.
    it('claims the row for the new cardholder', async () => {
        const row = { ...COMPLETED, userId: 500, corporateId: 7, update: jest.fn() }
        cardholderKyc.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(row)

        await findByCardholderUserId({ corporateId: 42, userId: 901, mobileNumber: '9876543210' })

        expect(row.update).toHaveBeenCalledWith({ userId: 901, corporateId: 42 })
    })

    it('does not rewrite a row that already belongs to this cardholder and corporate', async () => {
        const row = { ...COMPLETED, userId: 901, corporateId: 42, update: jest.fn() }
        cardholderKyc.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(row)

        await findByCardholderUserId({ corporateId: 42, userId: 901, mobileNumber: '9876543210' })

        expect(row.update).not.toHaveBeenCalled()
    })

    // A failed claim costs a repeated lookup next time, never the caller's request.
    it('still reports the cardholder verified when the claim write fails', async () => {
        const row = { ...COMPLETED, userId: 500, corporateId: 7, update: jest.fn().mockRejectedValue(new Error('deadlock')) }
        cardholderKyc.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(row)

        const result = await findByCardholderUserId({ corporateId: 42, userId: 901, mobileNumber: '9876543210' })

        expect(result.kycStatus).toBe('COMPLETED')
    })

    it('does not claim a handset whose KYC is not complete', async () => {
        const row = { mobileNumber: '9876543210', kycStatus: 'PENDING', userId: 500, update: jest.fn() }
        cardholderKyc.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(row).mockResolvedValueOnce(null)

        const result = await findByCardholderUserId({ corporateId: 42, userId: 901, mobileNumber: '9876543210' })

        expect(row.update).not.toHaveBeenCalled()
        expect(result).toBeNull()
    })

    it('falls back to this cardholder own incomplete row when no handset is supplied', async () => {
        const pending = { mobileNumber: '9876543210', kycStatus: 'PENDING', userId: 901 }
        cardholderKyc.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(pending)

        expect(await findByCardholderUserId({ corporateId: 42, userId: 901 })).toEqual(pending)
    })

    it('refuses to resolve anything without a corporate and a cardholder', async () => {
        expect(await findByCardholderUserId({ corporateId: null, userId: 901, mobileNumber: '9876543210' })).toBeNull()
        expect(cardholderKyc.findOne).not.toHaveBeenCalled()
    })
})
