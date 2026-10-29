jest.mock('../../../entities/user', () => ({ findOne: jest.fn(), update: jest.fn() }))

const user = require('../../../entities/user')
const { grantCardMembership } = require('../../cardMembershipGrant')

const employee = (overrides = {}) => ({
    id: 77,
    corporateUserId: 42,
    userAccessService: { permission: [{ label: 'Payroll', hasAccess: true, status: 'ACTIVE' }] },
    ...overrides,
})

const grantedEntry = () => {
    const [[fields]] = user.update.mock.calls
    return fields.userAccessService.permission.find((entry) => entry.label === 'Corporate Cards')
}

beforeEach(() => {
    jest.clearAllMocks()
    user.update.mockResolvedValue([1])
})

describe('grantCardMembership', () => {
    it('grants Corporate Cards to an employee of the approving corporate', async () => {
        user.findOne.mockResolvedValue(employee())

        const result = await grantCardMembership({ userId: '77', corporateUserId: '42' })

        expect(result).toEqual({ ok: true, userId: '77', alreadyHeld: false })
        expect(grantedEntry()).toEqual(expect.objectContaining({
            label: 'Corporate Cards',
            hasAccess: true,
            role: 'Employee',
            status: 'ACTIVE',
        }))
    })

    it('never grants Admin, whatever the approval carried', async () => {
        user.findOne.mockResolvedValue(employee())

        await grantCardMembership({ userId: '77', corporateUserId: '42', role: 'Admin' })

        expect(grantedEntry().role).toBe('Employee')
    })

    it('leaves the employee\'s other services untouched', async () => {
        user.findOne.mockResolvedValue(employee())

        await grantCardMembership({ userId: '77', corporateUserId: '42' })

        const [[fields]] = user.update.mock.calls
        expect(fields.userAccessService.permission).toEqual(
            expect.arrayContaining([expect.objectContaining({ label: 'Payroll', hasAccess: true })])
        )
    })

    it('refuses an employee belonging to another corporate', async () => {
        user.findOne.mockResolvedValue(employee({ corporateUserId: 99 }))

        expect(await grantCardMembership({ userId: '77', corporateUserId: '42' }))
            .toEqual({ ok: false, reason: 'FOREIGN_CORPORATE' })
        expect(user.update).not.toHaveBeenCalled()
    })

    it('refuses an unknown employee', async () => {
        user.findOne.mockResolvedValue(null)

        expect(await grantCardMembership({ userId: '77', corporateUserId: '42' }))
            .toEqual({ ok: false, reason: 'NOT_FOUND' })
        expect(user.update).not.toHaveBeenCalled()
    })

    it('is a no-op for someone who already holds the service', async () => {
        user.findOne.mockResolvedValue(employee({
            userAccessService: {
                permission: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }],
            },
        }))

        expect(await grantCardMembership({ userId: '77', corporateUserId: '42' }))
            .toEqual({ ok: true, userId: '77', alreadyHeld: true })
        expect(user.update).not.toHaveBeenCalled()
    })

    it('grants to someone whose membership was revoked', async () => {
        user.findOne.mockResolvedValue(employee({
            userAccessService: {
                permission: [{ label: 'Corporate Cards', hasAccess: false, status: 'INACTIVE' }],
            },
        }))

        await grantCardMembership({ userId: '77', corporateUserId: '42' })

        expect(grantedEntry()).toEqual(expect.objectContaining({ hasAccess: true, status: 'ACTIVE' }))
    })
})
