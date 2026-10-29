jest.mock('../../../entities/user', () => ({ findOne: jest.fn(), create: jest.fn(), update: jest.fn() }))

const User = require('../../../entities/user')
const { findOrCreateOwnerProfile } = require('../../ownerCardholderProfile')

const CARDS = 'Corporate Cards'

const owner = (permission) => ({ id: 500, credentialId: 7, userAccessService: { permission } })

const input = (over = {}) => ({
    credentialId: 7,
    corporateUserId: 42,
    name: 'Asha Owner',
    email: 'asha@peko.in',
    mobileNo: '9812345678',
    serviceLabel: CARDS,
    role: 'Employee',
    ...over,
})

const membershipWritten = () => User.update.mock.calls[0][0].userAccessService.permission

beforeEach(() => {
    jest.clearAllMocks()
    User.update.mockResolvedValue([1])
})

describe('findOrCreateOwnerProfile', () => {
    it('creates the row from the registration details when there is none', async () => {
        User.findOne.mockResolvedValueOnce(null)
        User.create.mockResolvedValue({ id: 500 })

        const result = await findOrCreateOwnerProfile(input())

        expect(result).toEqual(expect.objectContaining({ ok: true, created: true }))
        expect(User.create).toHaveBeenCalledWith(expect.objectContaining({
            credentialId: 7,
            corporateUserId: 42,
            employeeId: null,
            userAccessService: {
                permission: [expect.objectContaining({ label: CARDS, role: 'Employee', hasAccess: true })],
            },
        }))
    })

    it('reuses an existing row that is already correct, without writing', async () => {
        User.findOne.mockResolvedValue(owner([{ label: CARDS, hasAccess: true, role: 'Employee', status: 'ACTIVE' }]))

        const result = await findOrCreateOwnerProfile(input())

        expect(result).toEqual(expect.objectContaining({ ok: true, created: false }))
        expect(User.update).not.toHaveBeenCalled()
    })

    it('grants the service to an owner row that does not hold it yet', async () => {
        User.findOne.mockResolvedValue(owner([{ label: 'Payroll', hasAccess: true, status: 'ACTIVE' }]))

        await findOrCreateOwnerProfile(input())

        expect(membershipWritten().map((e) => e.label)).toEqual(['Payroll', CARDS])
    })

    /**
     * The owner's employee identity is a CARDHOLDER identity, always — their admin authority comes from
     * `credentials.role` on the other identity. A row provisioned as Admin showed them the admin dashboard on
     * the account whose whole purpose is to carry their own card, and nothing would ever have moved it.
     */
    it('corrects an owner row provisioned with the wrong card role', async () => {
        User.findOne.mockResolvedValue(owner([{ label: CARDS, hasAccess: true, role: 'Admin', status: 'ACTIVE' }]))

        await findOrCreateOwnerProfile(input())

        expect(membershipWritten()).toEqual([
            expect.objectContaining({ label: CARDS, role: 'Employee', hasAccess: true }),
        ])
    })

    it('leaves another service alone while correcting this one', async () => {
        User.findOne.mockResolvedValue(owner([
            { label: 'Payroll', hasAccess: true, role: 'Manager', status: 'ACTIVE' },
            { label: CARDS, hasAccess: true, role: 'Admin', status: 'ACTIVE' },
        ]))

        await findOrCreateOwnerProfile(input())

        const written = membershipWritten()
        expect(written.find((e) => e.label === 'Payroll')).toEqual(
            expect.objectContaining({ role: 'Manager', hasAccess: true })
        )
        expect(written.find((e) => e.label === CARDS)).toEqual(
            expect.objectContaining({ role: 'Employee' })
        )
    })

    it('refuses without a session context rather than creating an unattached row', async () => {
        expect(await findOrCreateOwnerProfile(input({ corporateUserId: null }))).toEqual(
            expect.objectContaining({ ok: false })
        )
        expect(User.create).not.toHaveBeenCalled()
    })

    // A blank name reaches Pine Labs video KYC and fails there, far from where it came from.
    it('refuses to build a row from registration details it cannot use', async () => {
        User.findOne.mockResolvedValue(null)

        expect(await findOrCreateOwnerProfile(input({ name: '   ' }))).toEqual(
            expect.objectContaining({ ok: false })
        )
        expect(await findOrCreateOwnerProfile(input({ mobileNo: '12345' }))).toEqual(
            expect.objectContaining({ ok: false })
        )
        expect(User.create).not.toHaveBeenCalled()
    })
})
