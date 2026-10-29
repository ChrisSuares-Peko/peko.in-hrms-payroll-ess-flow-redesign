const { verifyUserPermission } = require('../verifyPartnerWisePermission')

describe('verifyUserPermission', () => {
    it('returns the top-level service hasAccess flag on an exact match', () => {
        const services = [{ label: 'Corporate Cards', hasAccess: true }]
        expect(verifyUserPermission(services, 'Corporate Cards')).toBe(true)
    })

    it('returns false when a matched top-level service is not granted', () => {
        const services = [{ label: 'Corporate Cards', hasAccess: false }]
        expect(verifyUserPermission(services, 'Corporate Cards')).toBe(false)
    })

    it('finds a granted service nested in subServices', () => {
        const services = [
            { label: 'Office', hasAccess: false, subServices: [{ label: 'Corporate Cards', hasAccess: true }] },
        ]
        expect(verifyUserPermission(services, 'Corporate Cards')).toBe(true)
    })

    it('returns false when the label is absent from both top-level and sub-services', () => {
        const services = [{ label: 'Office', hasAccess: true, subServices: [{ label: 'Payroll', hasAccess: true }] }]
        expect(verifyUserPermission(services, 'Corporate Cards')).toBe(false)
    })
})
