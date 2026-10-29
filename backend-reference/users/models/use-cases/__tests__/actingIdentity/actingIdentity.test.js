jest.mock('../../corporateUser', () => ({ findOne: jest.fn() }))
jest.mock('../../user', () => ({ findOneByCredentialId: jest.fn() }))
jest.mock('../../subCorporateUser', () => ({ findOneSubCorporateByCredentialId: jest.fn() }))

const { findOne: findOneCorporateUser } = require('../../corporateUser')
const { findOneByCredentialId } = require('../../user')
const { findOneSubCorporateByCredentialId } = require('../../subCorporateUser')
const { actingCredentialId, getAvailableRoles } = require('../../actingIdentity')

const OWNER_CREDENTIAL = 100
const MEMBER_CREDENTIAL = 250

const subUserSession = {
    id: OWNER_CREDENTIAL,
    role: 'CORPORATE_SUB_USER',
    subCorporateId: '99',
    subCorporateCredential: MEMBER_CREDENTIAL,
}

const ownerSession = { id: OWNER_CREDENTIAL, role: 'CORPORATE' }

describe('actingCredentialId', () => {
    it('resolves a sub-corporate session to the member own credential, not the parent', () => {
        expect(actingCredentialId(subUserSession)).toBe(MEMBER_CREDENTIAL)
    })

    it('resolves an owner session to their own credential', () => {
        expect(actingCredentialId(ownerSession)).toBe(OWNER_CREDENTIAL)
    })

    it('resolves an ESS session to its own credential', () => {
        expect(actingCredentialId({ id: 7, role: 'USER' })).toBe(7)
    })

    it('returns undefined for a missing user rather than throwing', () => {
        expect(actingCredentialId(undefined)).toBeUndefined()
    })
})

describe('getAvailableRoles', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findOneCorporateUser.mockResolvedValue(null)
        findOneByCredentialId.mockResolvedValue(null)
        findOneSubCorporateByCredentialId.mockResolvedValue(null)
    })

    it('does not offer the corporate identity to a member who owns no corporateUsers row', async () => {
        const roles = await getAvailableRoles(actingCredentialId(subUserSession))

        expect(findOneCorporateUser).toHaveBeenCalledWith({ id: MEMBER_CREDENTIAL }, ['id'])
        expect(roles).toEqual([])
    })

    it('offers the corporate identity to a real owner', async () => {
        findOneCorporateUser.mockResolvedValue({ id: 42 })

        const roles = await getAvailableRoles(actingCredentialId(ownerSession))

        expect(roles).toEqual([{ role: 'corporate', roleName: 'Corporate', id: 42 }])
    })

    it('offers the employee identity when an active ESS row exists', async () => {
        findOneByCredentialId.mockResolvedValue({ id: 9, isActive: true, employeeId: '65f0c1a2b3' })

        const roles = await getAvailableRoles(MEMBER_CREDENTIAL)

        expect(roles).toEqual([{ role: 'user', roleName: 'Employee', id: 9 }])
    })

    it('withholds a revoked ESS identity', async () => {
        findOneByCredentialId.mockResolvedValue({ id: 9, isActive: false, employeeId: '65f0c1a2b3' })

        const roles = await getAvailableRoles(MEMBER_CREDENTIAL)

        expect(roles).toEqual([])
    })

    it('offers both identities to a credential holding a corporate and an ESS row', async () => {
        findOneCorporateUser.mockResolvedValue({ id: 42 })
        findOneByCredentialId.mockResolvedValue({ id: 9, isActive: true, employeeId: '65f0c1a2b3' })

        const roles = await getAvailableRoles(OWNER_CREDENTIAL)

        expect(roles.map((r) => r.role)).toEqual(['corporate', 'user'])
    })
})


describe('getAvailableRoles — an employee invited by one service only', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findOneCorporateUser.mockResolvedValue(null)
        findOneSubCorporateByCredentialId.mockResolvedValue(null)
    })

    // The employee portal is not payroll's: it renders whatever services the employee holds. Someone invited
    // only by Corporate Cards belongs there exactly as much as a payroll employee does.
    it('is offered the employee identity whichever service granted it', async () => {
        findOneByCredentialId.mockResolvedValue({
            id: 900,
            isActive: true,
            employeeId: null,
            userAccessService: { permission: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee' }] },
        })

        expect(await getAvailableRoles(MEMBER_CREDENTIAL)).toEqual([{ role: 'user', roleName: 'Employee', id: 900 }])
    })

    it('withholds a deleted employee identity', async () => {
        findOneByCredentialId.mockResolvedValue({ id: 900, isActive: true, isDeleted: true })

        expect(await getAvailableRoles(MEMBER_CREDENTIAL)).toEqual([])
    })
})


/**
 * Employee and sub-corporate are separate invites against one credential, and each may be granted without
 * the other. The pair switches in both directions; neither ever reaches the corporate identity that way.
 */
describe('getAvailableRoles — the employee / sub-corporate pair', () => {
    const EMPLOYER_CREDENTIAL = 100
    const EMPLOYER_ID = 42

    const member = (over = {}) => ({
        id: 77,
        corporateCredentialID: EMPLOYER_CREDENTIAL,
        status: 'ACTIVE',
        isDeleted: false,
        services: [{ label: 'Travel' }],
        ...over,
    })

    const employee = (over = {}) => ({ id: 9, isActive: true, corporateUserId: EMPLOYER_ID, ...over })

    const employerLookup = () => {
        findOneCorporateUser.mockImplementation(async (params) =>
            (String(params.id) === String(EMPLOYER_CREDENTIAL) ? { id: EMPLOYER_ID } : null))
    }

    beforeEach(() => {
        jest.clearAllMocks()
        findOneCorporateUser.mockResolvedValue(null)
        findOneByCredentialId.mockResolvedValue(null)
        findOneSubCorporateByCredentialId.mockResolvedValue(null)
    })

    it('offers both to someone invited as an employee and as a member of the same corporate', async () => {
        employerLookup()
        findOneByCredentialId.mockResolvedValue(employee())
        findOneSubCorporateByCredentialId.mockResolvedValue(member())

        const roles = await getAvailableRoles(MEMBER_CREDENTIAL)

        expect(roles).toEqual([
            { role: 'user', roleName: 'Employee', id: 9 },
            { role: 'sub_corporate', roleName: 'Sub Corporate', id: 77 },
        ])
    })

    it('offers the sub-corporate identity alone when no employee invite was sent', async () => {
        employerLookup()
        findOneSubCorporateByCredentialId.mockResolvedValue(member())

        const roles = await getAvailableRoles(MEMBER_CREDENTIAL)

        expect(roles).toEqual([{ role: 'sub_corporate', roleName: 'Sub Corporate', id: 77 }])
    })

    it('offers the employee identity alone when no member invite was sent', async () => {
        findOneByCredentialId.mockResolvedValue(employee())

        const roles = await getAvailableRoles(MEMBER_CREDENTIAL)

        expect(roles.map((r) => r.role)).toEqual(['user'])
    })

    // The employer is read off the member row's corporateCredentialID and off the employee row's
    // corporateUserId — two different columns naming the same company. A session that could cross between
    // two corporates is the one failure this guard exists for.
    it('refuses the cross-switch when the two identities name different corporates', async () => {
        findOneCorporateUser.mockImplementation(async (params) =>
            (String(params.id) === String(EMPLOYER_CREDENTIAL) ? { id: 999 } : null))
        findOneByCredentialId.mockResolvedValue(employee())
        findOneSubCorporateByCredentialId.mockResolvedValue(member())

        const roles = await getAvailableRoles(MEMBER_CREDENTIAL)

        expect(roles.map((r) => r.role)).toEqual(['user'])
    })

    it('refuses the cross-switch when the member row names no employer at all', async () => {
        findOneByCredentialId.mockResolvedValue(employee())
        findOneSubCorporateByCredentialId.mockResolvedValue(member({ corporateCredentialID: null }))

        const roles = await getAvailableRoles(MEMBER_CREDENTIAL)

        expect(roles.map((r) => r.role)).toEqual(['user'])
    })

    // Each of these is a state login itself refuses, so offering the identity would route them to a dead end.
    it('withholds a deleted, inactive or service-less membership', async () => {
        employerLookup()
        for (const over of [{ isDeleted: true }, { status: 'INACTIVE' }, { services: [] }]) {
            findOneSubCorporateByCredentialId.mockResolvedValue(member(over))
            expect(await getAvailableRoles(MEMBER_CREDENTIAL)).toEqual([])
        }
    })

    // The owner cardholder profile DOES create a member row naming the owner's own credential as the
    // employer, so this cannot rest on the row being absent — the owner is excluded outright.
    it('never offers the sub-corporate identity to a corporate owner', async () => {
        findOneCorporateUser.mockResolvedValue({ id: EMPLOYER_ID })
        findOneByCredentialId.mockResolvedValue(employee())

        const roles = await getAvailableRoles(OWNER_CREDENTIAL)

        expect(roles.map((r) => r.role)).toEqual(['corporate', 'user'])
        expect(findOneSubCorporateByCredentialId).not.toHaveBeenCalled()
    })
})
