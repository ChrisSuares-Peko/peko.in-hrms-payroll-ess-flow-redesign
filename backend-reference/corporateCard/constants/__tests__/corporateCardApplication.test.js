const { KYB_STATUS, KYB_STATUS_OPTIONS } = require('../corporateCardApplication')

describe('KYB_STATUS / KYB_STATUS_OPTIONS', () => {
    it('exposes exactly the six statuses the KYB pipeline uses', () => {
        expect(KYB_STATUS).toEqual({
            PENDING: 'PENDING',
            SUBMITTED: 'SUBMITTED',
            UNDER_REVIEW: 'UNDER_REVIEW',
            VERIFIED: 'VERIFIED',
            REJECTED: 'REJECTED',
            COMPLETED: 'COMPLETED',
        })
    })

    it('does not include the retired IN_PROGRESS status', () => {
        expect(KYB_STATUS.IN_PROGRESS).toBeUndefined()
        expect(KYB_STATUS_OPTIONS).not.toContain('IN_PROGRESS')
    })

    it('keeps KYB_STATUS_OPTIONS in sync with the KYB_STATUS values', () => {
        expect(KYB_STATUS_OPTIONS.sort()).toEqual(Object.values(KYB_STATUS).sort())
    })
})
