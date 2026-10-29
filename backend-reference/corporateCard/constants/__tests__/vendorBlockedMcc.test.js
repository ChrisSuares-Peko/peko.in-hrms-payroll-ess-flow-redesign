const { VENDOR_BLOCKED_MCCS, isVendorBlockedMcc } = require('../vendorBlockedMcc')

describe('isVendorBlockedMcc', () => {
    it('is true for every MCC in the vendor-blocked list, coerced to string', () => {
        VENDOR_BLOCKED_MCCS.forEach((mcc) => {
            expect(isVendorBlockedMcc(mcc)).toBe(true)
            expect(isVendorBlockedMcc(Number(mcc))).toBe(true)
        })
    })

    it('is false for an mcc not on the list', () => {
        expect(isVendorBlockedMcc('5411')).toBe(false)
    })

    it('is false for null/undefined', () => {
        expect(isVendorBlockedMcc(null)).toBe(false)
        expect(isVendorBlockedMcc(undefined)).toBe(false)
    })

    it('has no duplicate entries', () => {
        expect(new Set(VENDOR_BLOCKED_MCCS).size).toBe(VENDOR_BLOCKED_MCCS.length)
    })
})
