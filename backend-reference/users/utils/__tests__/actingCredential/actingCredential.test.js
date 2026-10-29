const { actingCredentialId } = require('../../actingCredential')

/**
 * The credential a requirement is applied to, and the credential it is recorded as satisfied for, must be the
 * same one. The privacy-policy gate asked the employee's while the pending-policy lookup asked the employer's,
 * so a newly invited employee was refused on a policy they were never shown — and accepting it, had they been
 * able to, would have been written against their company.
 */
describe('actingCredentialId', () => {
    // A sub-corporate login replaces loginUserDetails with the PARENT's credential, so req.user.id is the
    // parent's and the member's own arrives separately.
    it('resolves a sub-corporate session to the member own credential, not the parent', () => {
        expect(actingCredentialId({ id: 100, subCorporateCredential: 250, subCorporateId: '99' })).toBe(250)
    })

    it('resolves an employee to their own credential', () => {
        expect(actingCredentialId({ id: 250, role: 'USER', employeeProfileId: 900 })).toBe(250)
    })

    it('resolves a corporate owner to their own credential', () => {
        expect(actingCredentialId({ id: 7, role: 'CORPORATE', corporateId: 42 })).toBe(7)
    })

    // An employee carries no subCorporateCredential, and falling back to anything but their own id is what
    // pointed the two sides of the check at different people.
    it('never falls back to the employer for an employee', () => {
        expect(actingCredentialId({ id: 250, role: 'USER', corporateId: 42 })).not.toBe(42)
    })

    it('returns undefined for a missing session rather than throwing', () => {
        expect(actingCredentialId(undefined)).toBeUndefined()
        expect(actingCredentialId({})).toBeUndefined()
    })
})
