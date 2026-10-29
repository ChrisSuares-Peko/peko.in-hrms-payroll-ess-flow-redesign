jest.mock('../../models/use-cases/user', () => ({
    createUser: jest.fn(),
    findUserAccountByEmail: jest.fn(),
    resendUserPasswordEmail: jest.fn(),
    listUsersByCorporate: jest.fn(),
    deactivateUserByEmployeeId: jest.fn(),
    linkSelfAsEmployee: jest.fn(),
    linkEmployeeIdentity: jest.fn(),
    updateEssEmail: jest.fn(),
    updateUserById: jest.fn(),
}))
jest.mock('../../models/use-cases/identityLink', () => ({
    resolveInviteTarget: jest.fn(),
    WANTS: { ESS: 'ess' },
    ACTION: { CREATE: 'CREATE', LINK: 'LINK', REJECT: 'REJECT' },
}))
jest.mock('../../models/use-cases/credential', () => ({ findOneCredential: jest.fn() }))
jest.mock('../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }))
jest.mock('../../models/entities/corporateUser', () => ({}))
jest.mock('../../models/use-cases/employeeServiceGrant', () => ({ grantEmployeeService: jest.fn() }))
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const { createEssUser } = require('../essEmployee')
const { findUserAccountByEmail, resendUserPasswordEmail, updateUserById } = require('../../models/use-cases/user')
const { resolveInviteTarget } = require('../../models/use-cases/identityLink')

const PAYROLL_ACCESS = { permission: [{ label: 'Payroll', hasAccess: true }] }

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const invite = (overrides = {}) => ({
    user: { id: 7, corporateId: 42, email: 'owner@peko.in', registeredBy: null, role: 'CORPORATE' },
    body: {
        name: 'Aarav Sharma',
        email: 'aarav@peko.in',
        mobileNo: '9876543210',
        employeeId: 'new-employee',
        baseUrl: 'https://app.peko.in',
        ...overrides,
    },
})

const essAccount = (overrides = {}) => ({
    id: 11,
    email: 'aarav@peko.in',
    employeeId: 'old-employee',
    corporateUserId: 42,
    userAccessService: PAYROLL_ACCESS,
    isActive: true,
    credential: { id: 99, password: 'REDACTED' },
    ...overrides,
})

describe('createEssUser for a rehired employee', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('moves the existing login to the new employee record and keeps the password', async () => {
        findUserAccountByEmail.mockResolvedValue(essAccount())
        const res = buildRes()
        const next = jest.fn()

        await createEssUser(invite(), res, next)

        expect(updateUserById).toHaveBeenCalledWith(11, {
            employeeId: 'new-employee',
            name: 'Aarav Sharma',
            mobileNo: '9876543210',
            isActive: true,
        })
        expect(resendUserPasswordEmail).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true, data: { rehired: true } }))
        expect(next).not.toHaveBeenCalled()
    })

    it('reactivates a login whose ESS access was removed, and resends the invite when no password was set', async () => {
        findUserAccountByEmail.mockResolvedValue(essAccount({ isActive: false, credential: { id: 99, password: null } }))
        const res = buildRes()

        await createEssUser(invite(), res, jest.fn())

        expect(updateUserById).toHaveBeenCalledWith(11, expect.objectContaining({ employeeId: 'new-employee', isActive: true }))
        expect(resendUserPasswordEmail).toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: true, data: { rehired: true } }))
    })

    it('still rejects a second invite for the same employee record', async () => {
        findUserAccountByEmail.mockResolvedValue(essAccount({ employeeId: 'new-employee' }))
        const next = jest.fn()

        await createEssUser(invite(), buildRes(), next)

        expect(updateUserById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'An ESS account already exists for this email address.' }))
    })

    it('does not take over a login that belongs to another company', async () => {
        findUserAccountByEmail.mockResolvedValue(essAccount({ corporateUserId: 77 }))
        const next = jest.fn()

        await createEssUser(invite(), buildRes(), next)

        expect(updateUserById).not.toHaveBeenCalled()
        expect(resolveInviteTarget).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'An ESS account already exists for this email address.' }))
    })
})
