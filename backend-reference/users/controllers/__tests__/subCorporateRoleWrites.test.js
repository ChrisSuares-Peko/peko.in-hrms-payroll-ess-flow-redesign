// `subCorporateUsers.role` is a job title again: corporate-cards roles moved to the employee row and are
// managed from the cards People screen. What still matters on these write paths is who may change it — the
// self-promotion and account-holder guards below — not what it says.
jest.mock('../../models/use-cases/subCorporateUser', () => ({
    findAndCountAllSubCorporateUsers: jest.fn(),
    createSubCorporate: jest.fn(),
    updateSubCorporate: jest.fn(),
    updateStatus: jest.fn(),
    deleteSubCorporate: jest.fn(),
    findUserExist: jest.fn().mockResolvedValue({ exist: false }),
    findOneSubCorporate: jest.fn(),
    updateSubCorporateServices: jest.fn(),
    restoreSubCorporate: jest.fn().mockResolvedValue(null),
    checkDeletedUserExits: jest.fn(),
    isOwnerRow: jest.fn(),
    linkMemberIdentity: jest.fn(),
}))
jest.mock('../../models/use-cases/partnerPermission', () => ({ resolveServicePermissionsForSession: jest.fn() }))
jest.mock('../../models/use-cases/identityLink', () => ({
    resolveInviteTarget: jest.fn(),
    WANTS: { ESS: 'ess', MEMBER: 'member' },
    ACTION: { CREATE: 'CREATE', LINK: 'LINK', REJECT: 'REJECT' },
}))
jest.mock('../../models/use-cases/credential', () => ({ findOneCredential: jest.fn() }))
jest.mock('../../models/entities/credential', () => ({}))
jest.mock('../../models/use-cases/notification', () => ({ createNotification: jest.fn() }))
jest.mock('../../models/use-cases/systemUser', () => ({ fetchPartnerDetails: jest.fn() }))
jest.mock('../../utils/emailTemplates', () => ({}))
jest.mock('../../utils/emailer', () => ({ email: jest.fn() }))
jest.mock('../../utils/partnerLogos', () => ({ partnerLogos: {} }))
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const { createSubCorporate: createSubCorporateController, updateSubCorporate: updateSubCorporateController } =
    require('../userManagement')
const { createSubCorporate, updateSubCorporate, isOwnerRow, linkMemberIdentity } = require('../../models/use-cases/subCorporateUser')
const { resolveServicePermissionsForSession } = require('../../models/use-cases/partnerPermission')
const { resolveInviteTarget, ACTION } = require('../../models/use-cases/identityLink')

const GRANTED_SERVICE = 'Corporate Cards'
const SECOND_SERVICE = 'Corporate Travel'
const PARTNER_PERMISSIONS = [
    { label: GRANTED_SERVICE, hasAccess: true, subServices: [] },
    { label: SECOND_SERVICE, hasAccess: true, subServices: [] },
]

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const ownerReq = (body, params = {}) => ({
    user: { id: 7, corporateId: 42, email: 'owner@peko.in', registeredBy: null, role: 'CORPORATE' },
    body,
    params,
})

const invite = (role) => ownerReq({
    name: 'Aarav',
    email: 'aarav@peko.in',
    mobileNo: '9999999999',
    role,
    services: [{ label: GRANTED_SERVICE, hasAccess: true }],
})

beforeEach(() => {
    jest.clearAllMocks()
    // Default: the target is an ordinary member, not the account holder's row.
    isOwnerRow.mockResolvedValue(false)
    resolveServicePermissionsForSession.mockResolvedValue({ permissions: PARTNER_PERMISSIONS })
    resolveInviteTarget.mockResolvedValue({ action: ACTION.CREATE })
})

describe('createSubCorporate — role is a job title', () => {
    it.each([['Accountant'], ['Finance Manager'], ['Operations Executive'], ['Admin'], ['Employee']])(
        'accepts %p',
        async (role) => {
            await createSubCorporateController(invite(role), buildRes(), jest.fn())

            expect(createSubCorporate).toHaveBeenCalledWith(
                expect.objectContaining({ role }),
                expect.objectContaining({ role })
            )
        }
    )

    // Whitespace is tolerated on the way in but never stored — the server matches 'Admin' exactly, so a
    // padded value would silently resolve to Employee and the listing would disagree with the grant.
    it('stores the trimmed role', async () => {
        await createSubCorporateController(invite('  Admin  '), buildRes(), jest.fn())

        expect(createSubCorporate).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'Admin' }),
            expect.objectContaining({ role: 'Admin' })
        )
    })
})

describe('createSubCorporate — inviting someone who already has a login', () => {
    it('grants membership on the existing credential instead of creating a second login', async () => {
        resolveInviteTarget.mockResolvedValue({ action: ACTION.LINK, credentialId: 77 })
        linkMemberIdentity.mockResolvedValue({ ok: true, profile: { id: 5 }, created: true })

        await createSubCorporateController(invite('Employee'), buildRes(), jest.fn())

        expect(createSubCorporate).not.toHaveBeenCalled()
        expect(linkMemberIdentity).toHaveBeenCalledWith(expect.objectContaining({
            credentialId: 77,
            corporateUserId: 42,
            corporateCredentialID: 7,
            role: 'Employee',
        }))
    })

    it('carries the clamped services onto the linked membership, never the raw request', async () => {
        resolveInviteTarget.mockResolvedValue({ action: ACTION.LINK, credentialId: 77 })
        linkMemberIdentity.mockResolvedValue({ ok: true, profile: { id: 5 }, created: true })
        const req = invite('Employee')
        req.body.services = [
            { label: GRANTED_SERVICE, hasAccess: true },
            { label: 'Payroll', hasAccess: true },
        ]

        await createSubCorporateController(req, buildRes(), jest.fn())

        const { services } = linkMemberIdentity.mock.calls[0][0]
        expect(services.map((service) => service.label)).toEqual([GRANTED_SERVICE])
    })

    it('refuses without writing anything when the address cannot be linked', async () => {
        resolveInviteTarget.mockResolvedValue({ action: ACTION.REJECT, message: 'nope' })

        await createSubCorporateController(invite('Employee'), buildRes(), jest.fn())

        expect(createSubCorporate).not.toHaveBeenCalled()
        expect(linkMemberIdentity).not.toHaveBeenCalled()
    })
})

describe('createSubCorporate — services are clamped to the partner grant before they are stored', () => {
    it('persists only the partner-granted services, not everything the form asked for', async () => {
        const req = invite('Employee')
        req.body.services = [
            { label: GRANTED_SERVICE, hasAccess: true },
            { label: SECOND_SERVICE, hasAccess: true },
            { label: 'Payroll', hasAccess: true },
        ]

        await createSubCorporateController(req, buildRes(), jest.fn())

        const [, persistedRow] = createSubCorporate.mock.calls[0]
        expect(persistedRow.services.map((service) => service.label)).toEqual([GRANTED_SERVICE, SECOND_SERVICE])
    })
})

describe('updateSubCorporate — the same rule on the edit path', () => {
    it('accepts a job title', async () => {
        await updateSubCorporateController(
            ownerReq({ role: 'Accountant', services: [{ label: GRANTED_SERVICE, hasAccess: true }] }, { subCorporateId: '99' }),
            buildRes(),
            jest.fn()
        )

        expect(updateSubCorporate).toHaveBeenCalledWith(
            expect.objectContaining({ role: 'Accountant' }),
            expect.anything()
        )
    })

    // A member cannot promote themselves; only someone above them changes their role.
    it('refuses a self-role-change with 007, so the UI says it is a permission problem', async () => {
        const res = buildRes()
        const req = ownerReq({ role: 'Admin' }, { subCorporateId: '99' })
        req.user.subCorporateId = '99'

        await updateSubCorporateController(req, res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: '007' }))
        expect(updateSubCorporate).not.toHaveBeenCalled()
    })

    it('leaves an update that does not touch role alone', async () => {
        await updateSubCorporateController(
            ownerReq({ name: 'New Name' }, { subCorporateId: '99' }),
            buildRes(),
            jest.fn()
        )

        expect(updateSubCorporate).toHaveBeenCalled()
    })
})

// The account holder's row is reachable by EVERY corporate admin: its corporateCredentialID is the acting
// corporate's credential id, which is exactly what the tenant scope matches. An invited Admin could therefore
// PUT { name, mobileNo } at it — renaming the account holder and moving the number the issuer files their KYC
// under — because the only owner-row check lived inside the role branch and a body with no `role` skipped it.
describe('updateSubCorporate — an invited Admin cannot edit the corporate account', () => {
    const adminMemberReq = (body, params = {}) => ({
        user: {
            // req.user.id for a sub-user session IS the parent corporate's credential id, which is why the
            // tenant scope alone never excludes the owner row.
            id: 7,
            corporateId: 42,
            email: 'admin.member@peko.in',
            role: 'CORPORATE_SUB_USER',
            subCorporateRole: 'Admin',
            subCorporateId: '99',
        },
        body,
        params,
    })

    it.each([
        ['name only', { name: 'Renamed Owner' }],
        ['mobile only', { mobileNo: '9812345678' }],
        ['name and mobile', { name: 'Renamed Owner', mobileNo: '9812345678' }],
        ['a role change', { role: 'Employee' }],
    ])('refuses a sub-corporate Admin editing the owner row with %s', async (_label, body) => {
        isOwnerRow.mockResolvedValue(true)
        const res = buildRes()

        await updateSubCorporateController(adminMemberReq(body, { subCorporateId: '500' }), res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(403)
        expect(updateSubCorporate).not.toHaveBeenCalled()
    })

    // Their own details stay theirs to edit — the lock is about who is acting, not about the row alone.
    it('still lets the account owner edit their own name and mobile', async () => {
        isOwnerRow.mockResolvedValue(true)
        updateSubCorporate.mockResolvedValue(true)

        await updateSubCorporateController(
            ownerReq({ name: 'Asha Verma', mobileNo: '9812345678' }, { subCorporateId: '500' }),
            buildRes(),
            jest.fn()
        )

        expect(updateSubCorporate).toHaveBeenCalled()
    })

    // Even the owner cannot change their own role — their authority comes from the credential, not the column.
    it('refuses the owner changing the role on their own row', async () => {
        isOwnerRow.mockResolvedValue(true)
        const res = buildRes()

        await updateSubCorporateController(
            ownerReq({ role: 'Employee' }, { subCorporateId: '500' }),
            res,
            jest.fn()
        )

        expect(res.status).toHaveBeenCalledWith(403)
        expect(updateSubCorporate).not.toHaveBeenCalled()
    })

    it('leaves an ordinary member editable by a sub-corporate Admin', async () => {
        isOwnerRow.mockResolvedValue(false)
        updateSubCorporate.mockResolvedValue(true)

        await updateSubCorporateController(
            adminMemberReq({ name: 'Ravi Member' }, { subCorporateId: '101' }),
            buildRes(),
            jest.fn()
        )

        expect(updateSubCorporate).toHaveBeenCalled()
    })
})


