jest.mock('../../../entities/subCorporateUsers', () => ({ findOne: jest.fn(), create: jest.fn() }))
jest.mock('../../../entities/credential', () => ({ findOne: jest.fn(), create: jest.fn(), update: jest.fn() }))

const SubCorporateUsers = require('../../../entities/subCorporateUsers')
const credential = require('../../../entities/credential')
const { linkMemberIdentity } = require('../../subCorporateUser')

const INVITER_CREDENTIAL = 10
const INVITER_CORPORATE = 42
const EMPLOYEE_CREDENTIAL = 77

const link = (overrides = {}) => linkMemberIdentity({
    credentialId: EMPLOYEE_CREDENTIAL,
    corporateUserId: INVITER_CORPORATE,
    corporateCredentialID: INVITER_CREDENTIAL,
    name: 'Aarav Sharma',
    email: 'aarav@peko.in',
    mobileNo: '9876543210',
    role: 'Employee',
    services: [{ label: 'Corporate Cards', hasAccess: true }],
    ...overrides,
})

describe('linkMemberIdentity', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        SubCorporateUsers.findOne.mockResolvedValue(null)
        SubCorporateUsers.create.mockImplementation(async (row) => ({ id: 5, ...row }))
        credential.findOne.mockResolvedValue({ id: EMPLOYEE_CREDENTIAL, password: 'REDACTED' })
    })

    it('creates the membership row against the employee existing credential', async () => {
        const result = await link()

        expect(result.ok).toBe(true)
        expect(result.created).toBe(true)
        expect(SubCorporateUsers.create).toHaveBeenCalledWith(expect.objectContaining({
            credentialId: EMPLOYEE_CREDENTIAL,
            corporateCredentialID: String(INVITER_CREDENTIAL),
            corporateUserId: INVITER_CORPORATE,
            role: 'Employee',
        }))
    })

    it('never creates or mutates a credential, so no password is wiped and no reset token is issued', async () => {
        await link()

        expect(credential.create).not.toHaveBeenCalled()
        expect(credential.update).not.toHaveBeenCalled()
    })

    it('keeps the owner rule intact — credentialId and corporateCredentialID never match', async () => {
        await link()

        const row = SubCorporateUsers.create.mock.calls[0][0]
        expect(String(row.credentialId)).not.toBe(String(row.corporateCredentialID))
    })

    it('marks an employee who already has a password ACTIVE', async () => {
        await link()

        expect(SubCorporateUsers.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'ACTIVE' }))
    })

    it('leaves an employee who has not set a password PENDING', async () => {
        credential.findOne.mockResolvedValue({ id: EMPLOYEE_CREDENTIAL, password: null })

        await link()

        expect(SubCorporateUsers.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING' }))
    })

    it('is idempotent — an existing membership is returned rather than duplicated', async () => {
        const existing = { id: 5, credentialId: EMPLOYEE_CREDENTIAL }
        SubCorporateUsers.findOne.mockResolvedValue(existing)

        const result = await link()

        expect(result).toEqual({ ok: true, profile: existing, created: false })
        expect(SubCorporateUsers.create).not.toHaveBeenCalled()
    })

    it('resolves a create race by re-reading the row that won', async () => {
        const raced = { id: 6, credentialId: EMPLOYEE_CREDENTIAL }
        SubCorporateUsers.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(raced)
        SubCorporateUsers.create.mockRejectedValue(new Error('duplicate'))

        const result = await link()

        expect(result).toEqual({ ok: true, profile: raced, created: false })
    })

    it('refuses when the session context is incomplete', async () => {
        const result = await link({ corporateUserId: undefined })

        expect(result.ok).toBe(false)
        expect(SubCorporateUsers.create).not.toHaveBeenCalled()
    })
})
