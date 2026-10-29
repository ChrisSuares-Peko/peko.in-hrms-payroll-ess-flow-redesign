// The corporate OWNER holds an employee identity of their own, so they can carry a card and complete KYC
// without being a member of their own company. There is no mode inside a session: the Corporate account IS
// the admin view and the Employee account IS the cardholder view, so this file covers only the provisioning
// of that second identity.
const mockFindOrCreateOwnerProfile = jest.fn()
const mockGetValue = jest.fn()
const mockSetValue = jest.fn()
const mockTtl = jest.fn()

jest.mock('../../models/use-cases/ownerCardholderProfile', () => ({
    findOrCreateOwnerProfile: (...a) => mockFindOrCreateOwnerProfile(...a),
    findOwnerProfile: jest.fn(),
}))
jest.mock('../../utils/cacheDataMethods', () => ({
    getValue: (...a) => mockGetValue(...a),
    setValue: (...a) => mockSetValue(...a),
    client: { ttl: (...a) => mockTtl(...a) },
}))

const { createOwnerCardholderProfile, availableRoles, switchRole } = require('../switchRole')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const ownerUser = (over = {}) => ({
    role: 'CORPORATE',
    id: 7,
    corporateId: 42,
    contactPersonName: 'Asha Owner',
    email: 'asha@peko.in',
    mobileNo: '9999999999',
    ...over,
})

const cardMembership = (role) => [{ label: 'Corporate Cards', hasAccess: true, role, status: 'ACTIVE', ref: null }]

const memberUser = (over = {}) => ({
    role: 'USER',
    id: 7,
    corporateId: 42,
    employeeProfileId: 900,
    serviceMemberships: cardMembership('Admin'),
    ...over,
})

const PERSONAL = { name: 'Asha Verma', mobileNo: '9812345678' }

const run = async (handler, user, { body = {}, sessionId = 'sess-1' } = {}) => {
    const res = buildRes()
    await handler({ user, body, headers: { sessionid: sessionId } }, res, jest.fn())
    return { res, payload: res.json.mock.calls[0]?.[0] }
}

beforeEach(() => {
    jest.clearAllMocks()
    mockFindOrCreateOwnerProfile.mockResolvedValue({ ok: true, profile: { id: '500' } })
    mockGetValue.mockResolvedValue(JSON.stringify({ id: 7, role: 'USER', corporateId: 42 }))
    mockTtl.mockResolvedValue(1800)
})

describe('createOwnerCardholderProfile', () => {
    it('creates the row from the registration details, with no body at all', async () => {
        const { res, payload } = await run(createOwnerCardholderProfile, ownerUser())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(payload.data.role).toBe('Employee')
        expect(mockFindOrCreateOwnerProfile).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Asha Owner',
            mobileNo: '9999999999',
            credentialId: 7,
            corporateUserId: 42,
            serviceLabel: 'Corporate Cards',
        }))
    })

    it('prefers details supplied in the body over the registration defaults', async () => {
        await run(createOwnerCardholderProfile, ownerUser(), { body: PERSONAL })

        expect(mockFindOrCreateOwnerProfile).toHaveBeenCalledWith(expect.objectContaining(PERSONAL))
    })

    // An employee's own row IS their identity; minting one for the account holder is not theirs to do.
    it('refuses an employee Admin', async () => {
        const { res } = await run(createOwnerCardholderProfile, memberUser())

        expect(res.status).toHaveBeenCalledWith(403)
        expect(mockFindOrCreateOwnerProfile).not.toHaveBeenCalled()
    })

    // The People screen calls this on mount, so every non-owner admin who opens it is refused without
    // having asked for anything. '003' keeps the interceptor quiet; '007' would toast at them instead.
    it('refuses silently, so the screen that asked on their behalf shows no toast', async () => {
        const { payload } = await run(createOwnerCardholderProfile, memberUser())

        expect(payload.responseCode).toBe('003')
    })

    it('refuses a sub-corporate the same way', async () => {
        const { res, payload } = await run(createOwnerCardholderProfile, {
            role: 'CORPORATE_SUB_USER',
            id: 7,
            corporateId: 42,
            subCorporateId: 201,
        })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(payload.responseCode).toBe('003')
        expect(mockFindOrCreateOwnerProfile).not.toHaveBeenCalled()
    })

    // A caller that supplied details asked for something, so a refusal is theirs to fix.
    it('surfaces a refusal as a 400 carrying its reason when details were supplied', async () => {
        mockFindOrCreateOwnerProfile.mockResolvedValue({
            ok: false,
            message: 'The mobile number is already associated with another account.',
        })

        const { res, payload } = await run(createOwnerCardholderProfile, ownerUser(), { body: PERSONAL })

        expect(res.status).toHaveBeenCalledWith(400)
        expect(payload.message).toBe('The mobile number is already associated with another account.')
    })

    // The People screen fires this blind on mount. An account whose registration details cannot build a row
    // has simply not set one up yet — the row is collected properly on the first switch, and a
    // validation message on a screen that asked for nothing is noise the account holder cannot act on.
    it('reports "not set up yet" rather than an error when nothing was asked for', async () => {
        mockFindOrCreateOwnerProfile.mockResolvedValue({
            ok: false,
            message: 'Please enter your name as it appears on your ID.',
        })

        const { res, payload } = await run(createOwnerCardholderProfile, ownerUser())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(payload.status).toBe(true)
        expect(payload.data).toEqual({ id: null, created: false, needsDetails: true })
    })

    it('does not report a row as created when there is none', async () => {
        mockFindOrCreateOwnerProfile.mockResolvedValue({ ok: false, message: 'anything' })

        const { payload } = await run(createOwnerCardholderProfile, ownerUser())

        expect(payload.data.created).toBe(false)
    })

    it('treats a mobile-only body as an explicit provision too', async () => {
        mockFindOrCreateOwnerProfile.mockResolvedValue({ ok: false, message: 'Enter a valid mobile number.' })

        const { res } = await run(createOwnerCardholderProfile, ownerUser(), { body: { mobileNo: '9812345678' } })

        expect(res.status).toHaveBeenCalledWith(400)
    })
})

// The People screen provisions on arrival and refetches only when a row was genuinely created, so an
// existing row must not report itself as new — otherwise every visit fetches the member page twice.
describe('createOwnerCardholderProfile — created flag', () => {
    it('reports created:true for a first-time provision', async () => {
        mockFindOrCreateOwnerProfile.mockResolvedValue({ ok: true, profile: { id: '500' }, created: true })

        const { payload } = await run(createOwnerCardholderProfile, ownerUser())

        expect(payload.data.created).toBe(true)
    })

    it.each([
        ['the row already existed', { ok: true, profile: { id: '500' }, created: false }],
        ['the use-case reported nothing', { ok: true, profile: { id: '500' } }],
    ])('reports created:false when %s', async (_label, result) => {
        mockFindOrCreateOwnerProfile.mockResolvedValue(result)

        const { payload } = await run(createOwnerCardholderProfile, ownerUser())

        expect(payload.data.created).toBe(false)
    })
})


const employee = (role, over = {}) => ({
    role: 'USER',
    id: 7,
    corporateId: 42,
    employeeProfileId: 900,
    serviceMemberships: cardMembership(role),
    ...over,
})

/**
 * An employee whose card role is Admin holds one identity doing two jobs — running the programme, and
 * carrying their own card. The mode is confined to them: the account holder has a second IDENTITY for it.
 */
describe('availableRoles', () => {
    it('offers both modes to an employee Admin', async () => {
        const { payload } = await run(availableRoles, employee('Admin'))

        expect(payload.data.modes).toEqual(['Admin', 'Employee'])
        expect(payload.data.assignedRole).toBe('Admin')
        expect(payload.data.activeRole).toBe('Admin')
    })

    it('reports the mode they are currently acting in', async () => {
        const { payload } = await run(availableRoles, employee('Admin', { activeSubRole: 'Employee' }))

        expect(payload.data.activeRole).toBe('Employee')
        expect(payload.data.assignedRole).toBe('Admin')
    })

    it('offers nothing to an employee whose card role is Employee', async () => {
        const { payload } = await run(availableRoles, employee('Employee'))

        expect(payload.data.modes).toEqual([])
    })

    it('offers nothing to an employee holding no card membership', async () => {
        const { payload } = await run(availableRoles, employee('Admin', { serviceMemberships: [] }))

        expect(payload.data.modes).toEqual([])
    })

    // Their Corporate account IS the admin view, and their cardholder view is a separate identity. A mode
    // here as well would put the same person in two places at once.
    it('offers nothing to the account holder', async () => {
        const { payload } = await run(availableRoles, ownerUser())

        expect(payload.data.modes).toEqual([])
    })
})

describe('switchRole', () => {
    it('writes the chosen mode onto the session blob, keeping the same session', async () => {
        const { res } = await run(switchRole, employee('Admin'), { body: { role: 'Employee' } })

        expect(res.status).toHaveBeenCalledWith(200)
        const written = JSON.parse(mockSetValue.mock.calls[0][2])
        expect(written.activeSubRole).toBe('Employee')
    })

    // A mode switch must not silently renew the session.
    it('reuses the blob remaining lifetime rather than extending it', async () => {
        await run(switchRole, employee('Admin'), { body: { role: 'Employee' } })

        expect(mockSetValue.mock.calls[0][1]).toBe(1800)
    })

    // The authorization boundary: the mode may only ever REDUCE authority.
    it('refuses an Employee trying to claim Admin, and writes nothing', async () => {
        const { res } = await run(switchRole, employee('Employee'), { body: { role: 'Admin' } })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(mockSetValue).not.toHaveBeenCalled()
    })

    it('refuses the account holder, who has no mode', async () => {
        const { res } = await run(switchRole, ownerUser(), { body: { role: 'Employee' } })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(mockSetValue).not.toHaveBeenCalled()
    })

    it('rejects a role outside the vocabulary', async () => {
        const { res } = await run(switchRole, employee('Admin'), { body: { role: 'Superuser' } })

        expect(res.status).toHaveBeenCalledWith(400)
        expect(mockSetValue).not.toHaveBeenCalled()
    })

    it('401s when the session blob has already expired', async () => {
        mockGetValue.mockResolvedValue(null)

        const { res } = await run(switchRole, employee('Admin'), { body: { role: 'Employee' } })

        expect(res.status).toHaveBeenCalledWith(401)
    })

    // subCorporateId means "this caller is a sub-user" to hundreds of call sites in other services. A
    // Corporate Cards toggle must not re-scope the rest of the platform.
    it('writes ONLY the mode — never a subCorporateId', async () => {
        await run(switchRole, employee('Admin'), { body: { role: 'Employee' } })

        const written = JSON.parse(mockSetValue.mock.calls[0][2])
        expect(written.subCorporateId).toBeUndefined()
    })
})
