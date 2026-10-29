jest.mock('../../models/use-cases/user', () => ({
    createEmployeeIdentity: jest.fn(),
    findUserAccountByEmail: jest.fn(),
    findUserAccountById: jest.fn(),
    resendUserPasswordEmail: jest.fn(),
    updateUserById: jest.fn(),
}))
jest.mock('../../models/use-cases/employeeServiceGrant', () => ({ grantEmployeeService: jest.fn() }))
jest.mock('../../models/use-cases/identityLink', () => ({
    resolveInviteTarget: jest.fn(),
    WANTS: { ESS: 'ess', MEMBER: 'member', CARD_MEMBER: 'cardMember' },
    ACTION: { CREATE: 'CREATE', LINK: 'LINK', REJECT: 'REJECT' },
}))
jest.mock('../../models/use-cases/partnerPermission', () => ({ resolveServicePermissionsForSession: jest.fn() }))
jest.mock('../../models/use-cases/corporateUser', () => ({ findOneCorporate: jest.fn() }))
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../services/authHelper', () => ({ revokeSessionService: jest.fn() }))

const {
    createCardMember,
    resendCardMemberInvite,
    revokeCardMember,
    updateCardMember,
} = require('../cardMember')
const {
    createEmployeeIdentity,
    findUserAccountByEmail,
    findUserAccountById,
    resendUserPasswordEmail,
    updateUserById,
} = require('../../models/use-cases/user')
const { grantEmployeeService } = require('../../models/use-cases/employeeServiceGrant')
const { resolveInviteTarget, ACTION } = require('../../models/use-cases/identityLink')
const { resolveServicePermissionsForSession } = require('../../models/use-cases/partnerPermission')
const { findOneCorporate } = require('../../models/use-cases/corporateUser')
const { revokeSessionService } = require('../../services/authHelper')

const CARDS = 'Corporate Cards'

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
        role: 'Employee',
        baseUrl: 'https://app.peko.in',
        ...overrides,
    },
    params: {},
})

describe('createCardMember', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        resolveServicePermissionsForSession.mockResolvedValue({
            permissions: [{ label: CARDS, hasAccess: true, subServices: [] }],
        })
        resolveInviteTarget.mockResolvedValue({ action: ACTION.CREATE })
        findOneCorporate.mockResolvedValue({ id: 42, credentialId: 7 })
        findUserAccountByEmail.mockResolvedValue(null)
        createEmployeeIdentity.mockResolvedValue({ id: 900 })
        grantEmployeeService.mockResolvedValue({ ok: true, userId: 900, created: true })
    })

    // The whole point of the split: a card member is an employee identity, never a sub-corporate row.
    it('creates an employee identity carrying the card role', async () => {
        await createCardMember(invite({ role: 'Admin' }), buildRes(), jest.fn())

        expect(createEmployeeIdentity).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'aarav@peko.in', username: 'aarav@peko.in' }),
            expect.objectContaining({
                corporateUserId: 42,
                userAccessService: {
                    permission: [expect.objectContaining({ label: CARDS, role: 'Admin', status: 'PENDING', hasAccess: true })],
                },
            })
        )
    })

    it('refuses a role outside the card vocabulary, without writing anything', async () => {
        const res = buildRes()

        await createCardMember(invite({ role: 'Accountant' }), res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(400)
        expect(createEmployeeIdentity).not.toHaveBeenCalled()
    })

    // The stored grant is trusted downstream with no re-clamp, so a corporate must not be able to grant a
    // service its partner never licensed.
    it('refuses when the partner does not license Corporate Cards', async () => {
        resolveServicePermissionsForSession.mockResolvedValue({ permissions: [{ label: 'Payroll', hasAccess: true }] })
        const next = jest.fn()

        await createCardMember(invite(), buildRes(), next)

        expect(createEmployeeIdentity).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('stores the membership as a service entry, not a column', async () => {
        await createCardMember(invite(), buildRes(), jest.fn())

        const { userAccessService } = createEmployeeIdentity.mock.calls[0][1]
        expect(userAccessService.permission.map((entry) => entry.label)).toEqual([CARDS])
    })

    it('grants the role on an existing login rather than creating a second one', async () => {
        resolveInviteTarget.mockResolvedValue({ action: ACTION.LINK, credentialId: 77, existingRow: { id: 900 }, adopt: true })

        await createCardMember(invite(), buildRes(), jest.fn())

        expect(createEmployeeIdentity).not.toHaveBeenCalled()
        expect(grantEmployeeService).toHaveBeenCalledWith(expect.objectContaining({
            credentialId: 77,
            existingUserId: 900,
        }))
    })

    it('creates the employee row against a credential that has none yet', async () => {
        resolveInviteTarget.mockResolvedValue({ action: ACTION.LINK, credentialId: 77, existingRow: null })

        await createCardMember(invite(), buildRes(), jest.fn())

        expect(grantEmployeeService).toHaveBeenCalledWith(expect.objectContaining({
            credentialId: 77,
            existingUserId: null,
        }))
    })

    it('refuses an address the resolver rejects, without writing anything', async () => {
        resolveInviteTarget.mockResolvedValue({ action: ACTION.REJECT, message: 'taken' })
        const next = jest.fn()

        await createCardMember(invite(), buildRes(), next)

        expect(createEmployeeIdentity).not.toHaveBeenCalled()
        expect(grantEmployeeService).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    // A second invite must not mint a second identity or a second password token.
    it('resends the invite for a member who was invited and has not set a password', async () => {
        findUserAccountByEmail.mockResolvedValue({
            userAccessService: { permission: [{ label: CARDS, hasAccess: true, role: 'Employee', status: 'PENDING' }] },
            credential: { password: null },
        })
        const res = buildRes()

        await createCardMember(invite(), res, jest.fn())

        expect(resendUserPasswordEmail).toHaveBeenCalled()
        expect(createEmployeeIdentity).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { resent: true } }))
    })

    it('does not treat a payroll-only employee as an already-invited member', async () => {
        findUserAccountByEmail.mockResolvedValue({
            userAccessService: { permission: [{ label: 'Payroll', hasAccess: true }] },
            credential: { password: null },
        })

        await createCardMember(invite(), buildRes(), jest.fn())

        expect(resendUserPasswordEmail).not.toHaveBeenCalled()
    })
})


const cardMembership = (over = {}) => ({
    permission: [{ label: CARDS, hasAccess: true, role: 'Employee', status: 'ACTIVE', ...over }],
})

const scopedReq = (overrides = {}) => ({
    user: { id: 7, corporateId: 42, email: 'owner@peko.in', role: 'CORPORATE' },
    params: { userId: '900' },
    body: { baseUrl: 'https://app.peko.in' },
    ...overrides,
})

const member = (over = {}) => ({
    id: 900,
    corporateUserId: 42,
    credentialId: 5150,
    email: 'aarav@peko.in',
    name: 'Aarav Sharma',
    isDeleted: false,
    userAccessService: cardMembership(),
    credential: { password: null },
    ...over,
})

// Both endpoints exist so nothing in Corporate Cards reaches a sub-corporate API. The scope check is the
// authorization boundary: without it an admin could resend to, or revoke, another company's employee by
// guessing an id.
describe('resendCardMemberInvite', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findUserAccountById.mockResolvedValue(member())
        resendUserPasswordEmail.mockResolvedValue(true)
    })

    it('resends the set-password invite', async () => {
        const res = buildRes()

        await resendCardMemberInvite(scopedReq(), res, jest.fn())

        expect(resendUserPasswordEmail).toHaveBeenCalledWith(expect.objectContaining({ id: 900 }), 'https://app.peko.in')
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { resent: true } }))
    })

    it('404s a member of another corporate rather than resending', async () => {
        findUserAccountById.mockResolvedValue(member({ corporateUserId: 99 }))
        const next = jest.fn()

        await resendCardMemberInvite(scopedReq(), buildRes(), next)

        expect(resendUserPasswordEmail).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it('404s someone who holds no card membership', async () => {
        findUserAccountById.mockResolvedValue(member({ userAccessService: { permission: [{ label: 'Payroll', hasAccess: true }] } }))
        const next = jest.fn()

        await resendCardMemberInvite(scopedReq(), buildRes(), next)

        expect(resendUserPasswordEmail).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it('404s a deleted member', async () => {
        findUserAccountById.mockResolvedValue(member({ isDeleted: true }))
        const next = jest.fn()

        await resendCardMemberInvite(scopedReq(), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it('404s a non-numeric id without looking anything up', async () => {
        const next = jest.fn()

        await resendCardMemberInvite(scopedReq({ params: { userId: '1 OR 1=1' } }), buildRes(), next)

        expect(findUserAccountById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    // Resending regenerates the token, which would invalidate a password they are already using.
    it('refuses once the member has set a password', async () => {
        findUserAccountById.mockResolvedValue(member({ credential: { password: 'REDACTED' } }))
        const next = jest.fn()

        await resendCardMemberInvite(scopedReq(), buildRes(), next)

        expect(resendUserPasswordEmail).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })
})

describe('revokeCardMember', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findUserAccountById.mockResolvedValue(member())
        updateUserById.mockResolvedValue(true)
        revokeSessionService.mockResolvedValue(1)
    })

    // The same identity may hold Payroll. Deleting the row would take that with it, so only the membership
    // is revoked — and the entry is kept so records keyed on it still resolve.
    it('revokes the card membership without touching the login or another service', async () => {
        findUserAccountById.mockResolvedValue(member({
            userAccessService: {
                permission: [
                    { label: 'Payroll', hasAccess: true, status: 'ACTIVE' },
                    { label: CARDS, hasAccess: true, role: 'Employee', status: 'ACTIVE' },
                ],
            },
        }))

        await revokeCardMember(scopedReq(), buildRes(), jest.fn())

        const { userAccessService } = updateUserById.mock.calls[0][1]
        expect(userAccessService.permission).toHaveLength(2)
        expect(userAccessService.permission.find((e) => e.label === CARDS)).toEqual(
            expect.objectContaining({ hasAccess: false, status: 'INACTIVE' })
        )
        expect(userAccessService.permission.find((e) => e.label === 'Payroll')).toEqual(
            expect.objectContaining({ hasAccess: true, status: 'ACTIVE' })
        )
    })

    it('404s a member of another corporate rather than revoking', async () => {
        findUserAccountById.mockResolvedValue(member({ corporateUserId: 99 }))
        const next = jest.fn()

        await revokeCardMember(scopedReq(), buildRes(), next)

        expect(updateUserById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    describe('the sessions the removed member is already logged into', () => {
        it('revokes the service on them, so access stops before their token expires', async () => {
            await revokeCardMember(scopedReq(), buildRes(), jest.fn())

            expect(revokeSessionService).toHaveBeenCalledWith(5150, CARDS)
        })

        it('leaves the sessions alone when the member was refused', async () => {
            findUserAccountById.mockResolvedValue(member({ corporateUserId: 99 }))

            await revokeCardMember(scopedReq(), buildRes(), jest.fn())

            expect(revokeSessionService).not.toHaveBeenCalled()
        })

        it('still reports the removal when the sessions could not be reached', async () => {
            revokeSessionService.mockRejectedValue(new Error('redis down'))
            const res = buildRes()
            const next = jest.fn()

            await revokeCardMember(scopedReq(), res, next)

            expect(updateUserById).toHaveBeenCalled()
            expect(next).not.toHaveBeenCalled()
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Card access removed.' }))
        })
    })
})

// The People screen's edit form used to PUT at the sub-corporate endpoint, which requires a services array on
// every write and answered "Select at least one service" for a form that never offers one.
describe('updateCardMember', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        findUserAccountById.mockResolvedValue(member({ credentialId: 500 }))
        findOneCorporate.mockResolvedValue({ id: 42, credentialId: 7 })
        updateUserById.mockResolvedValue(true)
    })

    it('writes the name and mobile without requiring any services', async () => {
        const res = buildRes()

        await updateCardMember(
            scopedReq({ body: { name: 'Aarav S Sharma', mobileNo: '9812345670' } }),
            res,
            jest.fn()
        )

        expect(updateUserById).toHaveBeenCalledWith(900, { name: 'Aarav S Sharma', mobileNo: '9812345670' })
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('moves the card role on the membership entry, leaving another service untouched', async () => {
        findUserAccountById.mockResolvedValue(member({
            credentialId: 500,
            userAccessService: {
                permission: [
                    { label: 'Payroll', hasAccess: true, status: 'ACTIVE' },
                    { label: CARDS, hasAccess: true, role: 'Employee', status: 'ACTIVE' },
                ],
            },
        }))

        await updateCardMember(scopedReq({ body: { role: 'Admin' } }), buildRes(), jest.fn())

        const { userAccessService } = updateUserById.mock.calls[0][1]
        expect(userAccessService.permission.find((e) => e.label === CARDS)).toEqual(
            expect.objectContaining({ role: 'Admin', hasAccess: true })
        )
        expect(userAccessService.permission.find((e) => e.label === 'Payroll')).toEqual(
            expect.objectContaining({ hasAccess: true, status: 'ACTIVE' })
        )
    })

    it('refuses a role outside the card vocabulary, without writing anything', async () => {
        const next = jest.fn()

        await updateCardMember(scopedReq({ body: { role: 'Accountant' } }), buildRes(), next)

        expect(updateUserById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('refuses an invalid mobile number rather than storing it', async () => {
        const next = jest.fn()

        await updateCardMember(scopedReq({ body: { mobileNo: '12345' } }), buildRes(), next)

        expect(updateUserById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('404s a member of another corporate rather than updating', async () => {
        findUserAccountById.mockResolvedValue(member({ corporateUserId: 99, credentialId: 500 }))
        const next = jest.fn()

        await updateCardMember(scopedReq({ body: { name: 'Mallory' } }), buildRes(), next)

        expect(updateUserById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    // The account holder's row is theirs alone, and the check is on the whole write — a body carrying only
    // { name, mobileNo } would otherwise rename the person the issuer files their KYC against.
    it('refuses an admin editing the account owner row at all', async () => {
        findUserAccountById.mockResolvedValue(member({ credentialId: 7 }))
        const next = jest.fn()

        await updateCardMember(
            {
                user: { id: 501, corporateId: 42, role: 'USER', employeeProfileId: 901 },
                params: { userId: '900' },
                body: { name: 'Not their name' },
            },
            buildRes(),
            next
        )

        expect(updateUserById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('lets the account holder edit their own details but not their card role', async () => {
        findUserAccountById.mockResolvedValue(member({ credentialId: 7 }))
        const next = jest.fn()

        await updateCardMember(scopedReq({ body: { name: 'Owner Name' } }), buildRes(), jest.fn())
        expect(updateUserById).toHaveBeenCalledWith(900, { name: 'Owner Name' })

        await updateCardMember(scopedReq({ body: { role: 'Employee' } }), buildRes(), next)
        expect(updateUserById).toHaveBeenCalledTimes(1)
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    // Otherwise the route is a self-promotion path the moment a caller slips past the guard, and an admin can
    // demote themselves out of the screen they are standing on.
    it('refuses an employee admin changing their own role', async () => {
        const next = jest.fn()

        await updateCardMember(
            {
                user: { id: 501, corporateId: 42, role: 'USER', employeeProfileId: 900 },
                params: { userId: '900' },
                body: { role: 'Employee' },
            },
            buildRes(),
            next
        )

        expect(updateUserById).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('does not resolve the owner row from the caller credential, which an employee admin does not share', async () => {
        findUserAccountById.mockResolvedValue(member({ credentialId: 501 }))

        await updateCardMember(
            {
                user: { id: 501, corporateId: 42, role: 'USER', employeeProfileId: 901 },
                params: { userId: '900' },
                body: { name: 'Renamed' },
            },
            buildRes(),
            jest.fn()
        )

        expect(updateUserById).toHaveBeenCalledWith(900, { name: 'Renamed' })
    })

    it('reports nothing to update rather than writing an empty row', async () => {
        const res = buildRes()

        await updateCardMember(scopedReq({ body: {} }), res, jest.fn())

        expect(updateUserById).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
    })
})

