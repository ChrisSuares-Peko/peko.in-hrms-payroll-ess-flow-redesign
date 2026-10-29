const {
    ROLE_NAMES,
    SUB_CORPORATE_ROLE_NAMES,
    DEFAULT_SUB_CORPORATE_ROLE,
    resolveSubCorporateRole,
} = require('../subCorporateRoleNames')

describe('sub-corporate role vocabulary', () => {
    it('offers exactly the two assignable roles', () => {
        expect(SUB_CORPORATE_ROLE_NAMES).toEqual(['Admin', 'Employee'])
    })

    // Least privilege: an invite that says nothing about the role must not create an admin.
    it('defaults to the lower privilege', () => {
        expect(DEFAULT_SUB_CORPORATE_ROLE).toBe(ROLE_NAMES.EMPLOYEE)
    })
})

describe('resolveSubCorporateRole', () => {
    it('accepts an exact Admin, with surrounding whitespace tolerated', () => {
        expect(resolveSubCorporateRole('Admin')).toBe('Admin')
        expect(resolveSubCorporateRole('  Admin  ')).toBe('Admin')
    })

    // The column held free-text job titles for years. Every one of them must fail CLOSED — resolving any of
    // these to Admin would hand corporate-wide card authority to whoever happens to hold that title.
    it.each([
        ['admin'],
        ['ADMIN'],
        ['Administrator'],
        ['Admin Assistant'],
        ['Accountant'],
        ['Finance Manager'],
        [''],
        ['   '],
    ])('resolves the legacy value %p to Employee', (raw) => {
        expect(resolveSubCorporateRole(raw)).toBe('Employee')
    })

    it.each([[null], [undefined], [0], [{}], [['Admin']], [true]])(
        'resolves the non-string %p to Employee rather than throwing',
        (raw) => {
            expect(resolveSubCorporateRole(raw)).toBe('Employee')
        }
    )

    // Mirrors corporateCard/utils/subCorporateRoles.js#resolveRoleName. The two services must agree, since one
    // decides what may be stored and the other decides what it grants.
    it('never returns a value outside the vocabulary', () => {
        const inputs = ['Admin', 'admin', 'x', '', null]
        inputs.forEach((raw) => {
            expect(SUB_CORPORATE_ROLE_NAMES).toContain(resolveSubCorporateRole(raw))
        })
    })
})
