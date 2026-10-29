jest.mock('../../../entities/credential', () => ({ findOne: jest.fn() }))
jest.mock('../../../entities/corporateUser', () => ({ findOne: jest.fn() }))
jest.mock('../../../entities/subCorporateUsers', () => ({ findOne: jest.fn() }))
jest.mock('../../../entities/user', () => ({ findOne: jest.fn() }))
jest.mock('../../subCorporateUser', () => ({ findUserExist: jest.fn() }))

const credential = require('../../../entities/credential')
const corporateUser = require('../../../entities/corporateUser')
const SubCorporateUsers = require('../../../entities/subCorporateUsers')
const User = require('../../../entities/user')
const { findUserExist } = require('../../subCorporateUser')
const { resolveInviteTarget, WANTS, ACTION } = require('../../identityLink')

const INVITER_CREDENTIAL = 10
const INVITER_CORPORATE = 42
const PARTNER = 'peko'

const OTHER_CREDENTIAL = 77
// subCorporateUsers names its employer by the corporate's CREDENTIAL id, not by corporateUsers.id. The two
// are different numbers, and fixtures that gave these rows a `corporateUserId` were describing a column the
// table does not have — which is why a guard reading it passed its tests while rejecting everyone in production.
const INVITER_CORPORATE_CREDENTIAL = 900

const TAKEN = 'The email address is already associated with another account.'

const invite = (overrides = {}) => resolveInviteTarget({
    email: 'aarav@peko.in',
    mobileNo: '9876543210',
    inviterCorporateUserId: INVITER_CORPORATE,
    inviterCredentialId: INVITER_CREDENTIAL,
    inviterRegisteredBy: PARTNER,
    wants: WANTS.ESS,
    ...overrides,
})

const theirCredential = (overrides = {}) => ({
    id: OTHER_CREDENTIAL,
    role: 'CORPORATE_SUB_USER',
    registeredBy: PARTNER,
    ...overrides,
})

describe('resolveInviteTarget', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        credential.findOne.mockResolvedValue(null)
        corporateUser.findOne.mockImplementation(async (options) => (
            options?.where?.id === INVITER_CORPORATE
                ? { credentialId: INVITER_CORPORATE_CREDENTIAL }
                : null
        ))
        SubCorporateUsers.findOne.mockResolvedValue(null)
        User.findOne.mockResolvedValue(null)
        findUserExist.mockResolvedValue({ exist: false, message: '' })
    })

    describe('no credential yet', () => {
        it('creates when the address is free everywhere', async () => {
            expect(await invite()).toEqual({ action: ACTION.CREATE })
        })

        it('still defers to findUserExist for a sub-corporate row with no credential', async () => {
            findUserExist.mockResolvedValue({ exist: true, message: TAKEN })

            expect(await invite()).toEqual({ action: ACTION.REJECT, message: TAKEN })
        })
    })

    describe('guards that apply to both directions', () => {
        it('never links a SYSTEM_USER credential', async () => {
            credential.findOne.mockResolvedValue(theirCredential({ role: 'SYSTEM_USER' }))

            expect((await invite()).action).toBe(ACTION.REJECT)
        })

        it('never links across partners', async () => {
            credential.findOne.mockResolvedValue(theirCredential({ registeredBy: 'other-partner' }))
            SubCorporateUsers.findOne.mockResolvedValue({ id: 5, corporateCredentialID: INVITER_CORPORATE_CREDENTIAL })

            expect((await invite()).action).toBe(ACTION.REJECT)
        })

        it('never links a credential that owns another corporate', async () => {
            credential.findOne.mockResolvedValue(theirCredential())
            corporateUser.findOne.mockResolvedValue({ id: 99 })
            SubCorporateUsers.findOne.mockResolvedValue({ id: 5, corporateCredentialID: INVITER_CORPORATE_CREDENTIAL })

            expect((await invite()).action).toBe(ACTION.REJECT)
        })

        it('rejects an unknown intent', async () => {
            expect((await invite({ wants: 'anything' })).action).toBe(ACTION.REJECT)
        })

        it('gives the same message whatever the reason, so the endpoint cannot be used to enumerate', async () => {
            credential.findOne.mockResolvedValue(theirCredential({ role: 'SYSTEM_USER' }))
            const systemUser = await invite()

            jest.clearAllMocks()
            credential.findOne.mockResolvedValue(theirCredential({ registeredBy: 'other-partner' }))
            corporateUser.findOne.mockResolvedValue(null)
            SubCorporateUsers.findOne.mockResolvedValue(null)
            User.findOne.mockResolvedValue(null)
            const otherPartner = await invite()

            expect(systemUser.message).toBe(TAKEN)
            expect(otherPartner.message).toBe(TAKEN)
        })
    })

    describe('ESS invite to an existing card member', () => {
        it('links onto the member existing credential', async () => {
            const memberRow = { id: 5, corporateCredentialID: INVITER_CORPORATE_CREDENTIAL }
            credential.findOne.mockResolvedValue(theirCredential())
            SubCorporateUsers.findOne.mockResolvedValue(memberRow)

            expect(await invite()).toEqual({
                action: ACTION.LINK,
                credentialId: OTHER_CREDENTIAL,
                existingRow: memberRow,
            })
        })

        it('refuses a member of a different corporate', async () => {
            credential.findOne.mockResolvedValue(theirCredential())
            SubCorporateUsers.findOne.mockResolvedValue({ id: 5, corporateCredentialID: 999 })

            expect((await invite()).action).toBe(ACTION.REJECT)
        })

        it('refuses when an ESS identity already exists', async () => {
            credential.findOne.mockResolvedValue(theirCredential())
            SubCorporateUsers.findOne.mockResolvedValue({ id: 5, corporateCredentialID: INVITER_CORPORATE_CREDENTIAL })
            User.findOne.mockResolvedValue({ id: 3 })

            expect((await invite()).action).toBe(ACTION.REJECT)
        })

        it('refuses a credential that is neither a member nor an employee here', async () => {
            credential.findOne.mockResolvedValue(theirCredential())

            expect((await invite()).action).toBe(ACTION.REJECT)
        })
    })

    describe('card invite to an existing ESS employee', () => {
        const asMember = (overrides = {}) => invite({ wants: WANTS.MEMBER, ...overrides })

        it('links onto the employee existing credential', async () => {
            const essRow = { id: 3, corporateUserId: INVITER_CORPORATE, isActive: true }
            credential.findOne.mockResolvedValue(theirCredential({ role: 'USER' }))
            User.findOne.mockResolvedValue(essRow)

            expect(await asMember()).toEqual({
                action: ACTION.LINK,
                credentialId: OTHER_CREDENTIAL,
                existingRow: essRow,
            })
        })

        it('refuses the inviter own credential, which would forge an owner row', async () => {
            credential.findOne.mockResolvedValue(theirCredential({ id: INVITER_CREDENTIAL, role: 'CORPORATE' }))
            User.findOne.mockResolvedValue({ id: 3, corporateUserId: INVITER_CORPORATE, isActive: true })

            expect((await asMember()).action).toBe(ACTION.REJECT)
        })

        it('refuses an employee of a different corporate', async () => {
            credential.findOne.mockResolvedValue(theirCredential({ role: 'USER' }))
            User.findOne.mockResolvedValue({ id: 3, corporateUserId: 999, isActive: true })

            expect((await asMember()).action).toBe(ACTION.REJECT)
        })

        it('refuses a revoked employee', async () => {
            credential.findOne.mockResolvedValue(theirCredential({ role: 'USER' }))
            User.findOne.mockResolvedValue({ id: 3, corporateUserId: INVITER_CORPORATE, isActive: false })

            expect((await asMember()).action).toBe(ACTION.REJECT)
        })

        it('refuses when a card membership already exists', async () => {
            credential.findOne.mockResolvedValue(theirCredential({ role: 'USER' }))
            User.findOne.mockResolvedValue({ id: 3, corporateUserId: INVITER_CORPORATE, isActive: true })
            SubCorporateUsers.findOne.mockResolvedValue({ id: 5, corporateCredentialID: INVITER_CORPORATE_CREDENTIAL })

            expect((await asMember()).action).toBe(ACTION.REJECT)
        })
    })
})
