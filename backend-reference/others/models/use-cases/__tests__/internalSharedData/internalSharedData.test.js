const { Op, col, where: sequelizeWhere } = require('sequelize')
const user = require('../../../entities/user')
const corporateUser = require('../../../entities/corporateUser')
const serviceOperator = require('../../../entities/serviceOperator')
const disableServiceUC = require('../../disableService')
const cashbackUC = require('../../cashback')
const subscriptionUC = require('../../subscription')
const {
    isValidServiceLabel,
    findCardUsersByIds,
    searchCardUserIds,
    findAndCountCardUsers,
    listCardUserIds,
    listCardUserIdentities,
    findCardUserScoped,
    findOwnerProfile,
    findCorporatesByIds,
    searchCorporateIdsByCompanyName,
    searchPickableCorporates,
    resolveEntitlement,
} = require('../../internalSharedData')

// Queries backing the /api/v1/internal shared-data API consumed by the corporateCard service (which
// owns its own DB). These assertions pin the SQL shapes that used to live inside corporateCard.
jest.mock('../../../entities/user', () => ({ findAll: jest.fn(), findOne: jest.fn(), findAndCountAll: jest.fn() }))
jest.mock('../../../entities/corporateUser', () => ({ findAll: jest.fn(), count: jest.fn() }))
jest.mock('../../../entities/credential', () => ({}))
jest.mock('../../../entities/serviceOperator', () => ({ findOne: jest.fn() }))
jest.mock('../../../entities/vendor', () => ({}))
jest.mock('../../disableService', () => ({ findOne: jest.fn() }))
jest.mock('../../cashback', () => ({ findOne: jest.fn() }))
jest.mock('../../subscription', () => ({
    findAllActiveSubscriptions: jest.fn(),
    findActiveIndividualBaseForService: jest.fn(),
}))

const CARDS = 'Corporate Cards'

const aliasesOf = (attributes) => attributes.map((a) => (Array.isArray(a) ? a[1] : a))
const sqlOf = (value) => String(value?.val ?? value?.fn ?? JSON.stringify(value))
const whereClauseOf = (mock) => mock.mock.calls[0][0].where

describe('isValidServiceLabel', () => {
    it('accepts normal labels and rejects SQL-literal-hostile input', () => {
        expect(isValidServiceLabel('Corporate Cards')).toBe(true)
        expect(isValidServiceLabel("x'); DROP TABLE --")).toBe(false)
        expect(isValidServiceLabel('')).toBe(false)
        expect(isValidServiceLabel(undefined)).toBe(false)
    })
})

// A service label reaches a JSON_CONTAINS literal and a JSON_SEARCH literal, so every entry point that takes
// one must refuse anything outside the whitelist rather than interpolate it.
describe('a hostile service label never reaches SQL', () => {
    beforeEach(() => jest.clearAllMocks())

    it.each([
        ['findCardUsersByIds', () => findCardUsersByIds(['1'], '42', "x'); DROP TABLE users --")],
        ['findAndCountCardUsers', () => findAndCountCardUsers({ corporateId: '42', serviceLabel: "'", limit: 10, offset: 0 })],
        ['findCardUserScoped', () => findCardUserScoped({ userId: '1', corporateId: '42', serviceLabel: '*' })],
        ['listCardUserIdentities', () => listCardUserIdentities({ corporateId: '42', serviceLabel: ';--' })],
    ])('%s rejects it', async (_name, call) => {
        await expect(call()).rejects.toThrow('Invalid service label.')
        expect(user.findAll).not.toHaveBeenCalled()
        expect(user.findAndCountAll).not.toHaveBeenCalled()
        expect(user.findOne).not.toHaveBeenCalled()
    })
})

describe('findCardUsersByIds', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns [] without querying for an empty id list', async () => {
        expect(await findCardUsersByIds([], '42', CARDS)).toEqual([])
        expect(user.findAll).not.toHaveBeenCalled()
    })

    // Deleted rows are included deliberately: a departed employee's cards must stay resolvable.
    it('scopes the batch to the calling corporate and projects the identity attributes', async () => {
        user.findAll.mockResolvedValue([{ id: 1 }])

        await findCardUsersByIds(['1', '2'], '42', CARDS)

        const call = user.findAll.mock.calls[0][0]
        expect(call.where).toEqual({ id: { [Op.in]: ['1', '2'] }, corporateUserId: '42' })
        expect(aliasesOf(call.attributes)).toEqual(['id', 'name', 'email', 'mobileNo', 'createdAt', 'role', 'status', 'hasSetPassword'])
    })

    // "Has set a password" is a fact about the LOGIN, not the membership: nothing moves a stored invite flag
    // when someone completes the reset, so it is derived from the credential every time it is read.
    it('derives hasSetPassword from the credential, without selecting the hash', async () => {
        user.findAll.mockResolvedValue([])

        await findCardUsersByIds(['1'], '42', CARDS)

        const call = user.findAll.mock.calls[0][0]
        expect(aliasesOf(call.attributes)).toContain('hasSetPassword')
        const [expr] = call.attributes.find((a) => Array.isArray(a) && a[1] === 'hasSetPassword')
        expect(sqlOf(expr)).toContain('password')
        // attributes: [] — the join is there for the expression, and no credential column is returned.
        expect(call.include).toEqual([expect.objectContaining({ attributes: [], required: false })])
    })

    // Role and status are per-service, so they are read out of the caller's own membership entry rather than
    // from a column. A second service granted later must not shift or shadow them.
    it('reads role and status from the requested service entry, not from a column', async () => {
        user.findAll.mockResolvedValue([])

        await findCardUsersByIds(['1'], '42', CARDS)

        const projected = user.findAll.mock.calls[0][0].attributes
            .filter(Array.isArray)
            .filter(([, alias]) => alias === 'role' || alias === 'status')
        expect(projected.every(([expr]) => sqlOf(expr).includes(CARDS))).toBe(true)
        expect(projected.map(([, alias]) => alias)).toEqual(['role', 'status'])
    })
})

describe('searchCardUserIds', () => {
    beforeEach(() => jest.clearAllMocks())

    // Deleted members are deliberately INCLUDED (a departed employee's cards and requests must stay findable
    // by name), and so is the account owner — they can hold a card and raise requests.
    it('scopes to the corporate, matches on the whitelisted fields, and orders id DESC', async () => {
        user.findAll.mockResolvedValue([{ id: 9 }])

        const result = await searchCardUserIds({ corporateId: '42', searchText: ' as%h ', fields: ['name', 'email'], limit: 2 })

        const call = user.findAll.mock.calls[0][0]
        expect(call.where.corporateUserId).toBe('42')
        expect(call.where[Op.or]).toEqual([
            { name: { [Op.like]: '%as\\%h%' } },
            { email: { [Op.like]: '%as\\%h%' } },
        ])
        expect(call.where.isDeleted).toBeUndefined()
        expect(call.order).toEqual([['id', 'DESC']])
        expect(result).toEqual({ ids: ['9'], capped: false })
    })

    it('drops non-whitelisted fields and flags capping via the limit+1 probe row', async () => {
        user.findAll.mockResolvedValue([{ id: 3 }, { id: 2 }, { id: 1 }])

        const result = await searchCardUserIds({ corporateId: '42', searchText: 'a', fields: ['name', 'mobileNo'], limit: 2 })

        expect(user.findAll.mock.calls[0][0].where[Op.or]).toEqual([{ name: { [Op.like]: '%a%' } }])
        expect(user.findAll.mock.calls[0][0].limit).toBe(3)
        expect(result).toEqual({ ids: ['3', '2'], capped: true })
    })
})

describe('findAndCountCardUsers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        user.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
    })

    const page = (overrides = {}) =>
        findAndCountCardUsers({ corporateId: '42', serviceLabel: CARDS, limit: 10, offset: 0, ...overrides })

    it('pages employees holding the service, scoped and not deleted, SQL-side', async () => {
        await page()

        const call = user.findAndCountAll.mock.calls[0][0]
        expect(aliasesOf(call.attributes)).toContain('hasSetPassword')
        expect(call.include).toEqual([expect.objectContaining({ attributes: [], required: false })])
        expect(call.where.corporateUserId).toBe('42')
        expect(call.where.isDeleted).toBe(false)
        expect(call.limit).toBe(10)
        expect(call.offset).toBe(0)
    })

    // The default excludes the account holder; the People screen opts in. The "Issue a card" picker keeps the
    // default, because the owner is not a valid target for a sub-admin.
    it('excludes the account owner by default and includes them on request', async () => {
        await page()
        const excluded = whereClauseOf(user.findAndCountAll)[Op.and]
        expect(excluded).toHaveLength(2)
        expect(sqlOf(excluded[1])).toContain('NOT (')

        jest.clearAllMocks()
        user.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await page({ includeOwner: true })
        expect(whereClauseOf(user.findAndCountAll)[Op.and]).toHaveLength(1)
    })

    it('floats the account owner first when they are included', async () => {
        await page({ includeOwner: true })

        expect(sqlOf(user.findAndCountAll.mock.calls[0][0].order[0][0])).toContain('credentialId')
    })

    it('filters status inside the membership entry rather than on a column', async () => {
        await page({ status: 'PENDING' })

        const call = user.findAndCountAll.mock.calls[0][0]
        expect(call.where.status).toBeUndefined()
        expect(sqlOf(call.where[Op.and][0])).toContain('PENDING')
    })

    it('selects isAccountOwner alongside the identity attributes', async () => {
        await page()

        expect(aliasesOf(user.findAndCountAll.mock.calls[0][0].attributes)).toContain('isAccountOwner')
    })

    it('pins the caller own row and selects isSelf when pinUserId is given', async () => {
        await page({ pinUserId: '7' })

        const call = user.findAndCountAll.mock.calls[0][0]
        expect(aliasesOf(call.attributes)).toContain('isSelf')
        expect(sqlOf(call.order[0][0])).toContain('`id` = 7')
    })

    // parseInt would truncate '1; DROP TABLE x' to 1 and silently pin a real but unintended row, so the pin
    // is regex-tested and dropped entirely when it is not a bare positive integer.
    it.each(['abc', '1; DROP TABLE users', '0', '-3', '', null, undefined])(
        'ignores a non-id pin (%s) instead of building SQL from it',
        async (pin) => {
            await page({ pinUserId: pin })

            const call = user.findAndCountAll.mock.calls[0][0]
            expect(aliasesOf(call.attributes)).not.toContain('isSelf')
            expect(call.order).toEqual([['createdAt', 'DESC'], ['id', 'DESC']])
        }
    )

    it('narrows the page to given ids, or away from excludeIds, for the kycStatus filter', async () => {
        await page({ ids: ['1', '2'] })
        expect(whereClauseOf(user.findAndCountAll).id).toEqual({ [Op.in]: ['1', '2'] })

        jest.clearAllMocks()
        user.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        await page({ excludeIds: ['3'] })
        expect(whereClauseOf(user.findAndCountAll).id).toEqual({ [Op.notIn]: ['3'] })
    })

    it('searches name, email and mobile', async () => {
        await page({ searchText: 'as_h' })

        expect(whereClauseOf(user.findAndCountAll)[Op.or]).toEqual([
            { name: { [Op.like]: '%as\\_h%' } },
            { email: { [Op.like]: '%as\\_h%' } },
            { mobileNo: { [Op.like]: '%as\\_h%' } },
        ])
    })
})

describe('listCardUserIdentities / listCardUserIds', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        user.findAll.mockResolvedValue([{ id: 5, mobileNo: '9876543210' }])
    })

    // cardholderKyc is unique on mobileNumber, not on the member id: one human holding two cardholder
    // identities shares ONE KYC row, and counting by id alone reports them unverified.
    it('lists identities with the mobile each KYC row is filed under', async () => {
        expect(await listCardUserIdentities({ corporateId: '42', serviceLabel: CARDS }))
            .toEqual([{ id: 5, mobileNo: '9876543210' }])

        expect(user.findAll.mock.calls[0][0].attributes).toEqual(['id', 'mobileNo'])
    })

    it('applies the same scope and owner rule as the member page', async () => {
        await listCardUserIdentities({ corporateId: '42', serviceLabel: CARDS })

        const call = user.findAll.mock.calls[0][0]
        expect(call.where.corporateUserId).toBe('42')
        expect(call.where.isDeleted).toBe(false)
        expect(call.where[Op.and]).toHaveLength(2)
    })

    // The KYC-summary KPI and the members table sit on the same dashboard, so counting the account holder in
    // one and not the other would show a visible off-by-one.
    it('follows the People screen when counting: includeOwner drops the exclusion here too', async () => {
        await listCardUserIdentities({ corporateId: '42', serviceLabel: CARDS, includeOwner: true })

        expect(user.findAll.mock.calls[0][0].where[Op.and]).toHaveLength(1)
    })

    it('reduces to bare ids for callers that only count', async () => {
        expect(await listCardUserIds({ corporateId: '42', serviceLabel: CARDS })).toEqual(['5'])
    })
})

describe('findCardUserScoped / findOwnerProfile', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        user.findOne.mockResolvedValue(null)
    })

    // Authorization-sensitive: the scope stops a corporate admin acting on an id outside their corporate or
    // without the service.
    it('scopes the single-member lookup to corporate + not deleted + service access', async () => {
        await findCardUserScoped({ userId: '9', corporateId: '42', serviceLabel: CARDS })

        const call = user.findOne.mock.calls[0][0]
        expect(call.where.id).toBe('9')
        expect(call.where.corporateUserId).toBe('42')
        expect(call.where.isDeleted).toBe(false)
        expect(call.where[Op.and]).toHaveLength(1)
    })

    it('returns null rather than an unscoped row when the member is not the caller own', async () => {
        expect(await findCardUserScoped({ userId: '9', corporateId: '42', serviceLabel: CARDS })).toBeNull()
    })

    // The owner is excluded from every member listing, so this is the single place their row is reachable —
    // that is what lets them hold a card without appearing as a member or counting toward seats.
    it('resolves the owner by the structural credential rule, not a stored flag', async () => {
        await findOwnerProfile({ corporateId: '42', serviceLabel: CARDS })

        const call = user.findOne.mock.calls[0][0]
        expect(call.where.corporateUserId).toBe('42')
        expect(sqlOf(call.where[Op.and][0])).toContain('credentialId')
        expect(sqlOf(call.where[Op.and][0])).not.toContain('NOT (')
    })
})

describe('corporates', () => {
    beforeEach(() => jest.clearAllMocks())

    it('batch-selects the corporate identity attributes plus the credential name and username and display name', async () => {
        corporateUser.findAll.mockResolvedValue([])

        await findCorporatesByIds(['7'])

        const options = corporateUser.findAll.mock.calls[0][0]
        expect(options.where).toEqual({ id: { [Op.in]: ['7'] } })
        expect(options.attributes).toEqual(['id', 'companyName', 'contactPersonName', 'email', 'mobileNo'])
        expect(options.include[0]).toEqual(expect.objectContaining({ attributes: ['name', 'username'], required: false }))
        expect(options.raw).toBe(true)
        expect(options.nest).toBe(true)
    })

    it('projects the credential name, because a corporate with no companyName has no other display name', async () => {
        corporateUser.findAll.mockResolvedValue([])

        await findCorporatesByIds(['7'])

        expect(corporateUser.findAll.mock.calls[0][0].include[0].attributes).toContain('name')
    })

    it('searches companyName, contactPersonName and the credential username with an escaped LIKE and the limit+1 cap probe', async () => {
        corporateUser.findAll.mockResolvedValue([{ id: 9 }])

        const result = await searchCorporateIdsByCompanyName({ searchText: 'a_c', limit: 5 })

        const options = corporateUser.findAll.mock.calls[0][0]
        expect(options.where[Op.or]).toEqual([
            { companyName: { [Op.like]: '%a\\_c%' } },
            { contactPersonName: { [Op.like]: '%a\\_c%' } },
            sequelizeWhere(col('credential.username'), { [Op.like]: '%a\\_c%' }),
        ])
        expect(options.include[0]).toEqual(expect.objectContaining({ attributes: [], required: false }))
        expect(options.subQuery).toBe(false)
        expect(options.limit).toBe(6)
        expect(result).toEqual({ ids: ['9'], capped: false })
    })

    it('pickable search excludes the given ids and requires a named CORPORATE credential', async () => {
        corporateUser.findAll.mockResolvedValue([])

        await searchPickableCorporates({ searchText: 'acme', excludeIds: ['1', '2'], limit: 20 })

        const options = corporateUser.findAll.mock.calls[0][0]
        expect(options.where).toEqual({ id: { [Op.notIn]: ['1', '2'] } })
        const include = options.include[0]
        expect(include.required).toBe(true)
        expect(include.where).toEqual(expect.objectContaining({ role: 'CORPORATE', name: { [Op.ne]: null } }))
        expect(include.where[Op.or]).toHaveLength(3)
        expect(options.limit).toBe(20)
    })

    it('pickable search omits the notIn clause when there is nothing to exclude, and pages via offset', async () => {
        corporateUser.findAll.mockResolvedValue([])

        await searchPickableCorporates({ excludeIds: [], limit: 20, offset: 40 })

        const options = corporateUser.findAll.mock.calls[0][0]
        expect(options.where).toEqual({})
        expect(options.offset).toBe(40)
    })
})

describe('resolveEntitlement', () => {
    beforeEach(() => jest.clearAllMocks())

    const args = { credentialId: '11', accessKey: 'corporate_cards', corporateUserId: '42' }

    it('errors when the operator is unknown', async () => {
        serviceOperator.findOne.mockResolvedValue(null)

        expect(await resolveEntitlement(args)).toEqual({ error: 'Service not available' })
    })

    it('errors when the service is disabled for the credential', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue({ Id: 1 })

        expect(await resolveEntitlement(args)).toEqual({ error: 'Service is disabled' })
        expect(disableServiceUC.findOne).toHaveBeenCalledWith({ credentialId: '11', serviceOperatorId: 7 })
    })

    it('errors when no cashback row links the operator to an ACTIVE package', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([{ packageId: 3 }])
        cashbackUC.findOne.mockResolvedValue(null)

        expect(await resolveEntitlement(args)).toEqual({ error: 'Unable to process your request' })
        expect(cashbackUC.findOne).toHaveBeenCalledWith({ packageIds: [3], serviceOperatorId: 7 })
    })

    it('throws (5xx, not a definitive denial) when the subscriptions read swallowed a DB error', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue(false)

        await expect(resolveEntitlement(args)).rejects.toThrow('Failed to read active subscriptions')
    })

    it('throws (5xx, not a definitive denial) when the cashback read swallowed a DB error', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([{ packageId: 3 }])
        cashbackUC.findOne.mockResolvedValue(undefined)

        await expect(resolveEntitlement(args)).rejects.toThrow('Failed to read cashback')
    })

    it('an ACTIVE INDIVIDUAL subscription for the service replaces the group/free allowance', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([{ packageId: 1 }, { packageId: 120 }])
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue({ packageId: 120 })
        cashbackUC.findOne.mockResolvedValue({ id: 99, baseLimit: '5.00', unitPrice: '290.00' })

        const result = await resolveEntitlement(args)

        expect(subscriptionUC.findActiveIndividualBaseForService).toHaveBeenCalledWith({
            corporateUserId: '42',
            serviceOperatorId: 7,
        })
        expect(cashbackUC.findOne).toHaveBeenCalledTimes(1)
        expect(cashbackUC.findOne).toHaveBeenCalledWith({ packageIds: [120], serviceOperatorId: 7 })
        expect(result).toEqual({ id: 7, baseLimit: '5.00', unitPrice: '290.00' })
    })

    it('serves the live baseLimit, so editing the package allowance reaches existing subscribers', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([{ packageId: 120 }])
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue({ packageId: 120 })
        cashbackUC.findOne.mockResolvedValue({ id: 99, baseLimit: '5.00', unitPrice: '290.00' })

        expect(await resolveEntitlement(args)).toEqual({ id: 7, baseLimit: '5.00', unitPrice: '290.00' })
    })

    it('falls back to the group row when the individual package has no listable cashback row', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([{ packageId: 1 }, { packageId: 120 }])
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue({ packageId: 120 })
        cashbackUC.findOne
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ id: 99, baseLimit: '0.00', unitPrice: '290.00' })

        expect(await resolveEntitlement(args)).toEqual({ id: 7, baseLimit: '0.00', unitPrice: '290.00' })
        expect(cashbackUC.findOne).toHaveBeenLastCalledWith({ packageIds: [1, 120], serviceOperatorId: 7 })
    })

    it('throws rather than billing at group rates when the individual cashback read swallowed a DB error', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7 })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([{ packageId: 1 }, { packageId: 120 }])
        subscriptionUC.findActiveIndividualBaseForService.mockResolvedValue({ packageId: 120 })
        cashbackUC.findOne.mockResolvedValue(undefined)

        await expect(resolveEntitlement(args)).rejects.toThrow('Failed to read cashback')
        expect(cashbackUC.findOne).toHaveBeenCalledTimes(1)
    })

    it('merges operator (with full vendor attrs) + cashback, dropping cashback.id', async () => {
        serviceOperator.findOne.mockResolvedValue({ id: 7, vendor: { apiUrl: 'https://pl', vendorEmail: ['ops@pl'] } })
        disableServiceUC.findOne.mockResolvedValue(null)
        subscriptionUC.findAllActiveSubscriptions.mockResolvedValue([{ packageId: 3 }, { packageId: 8 }])
        cashbackUC.findOne.mockResolvedValue({ id: 99, cashback: 5 })

        const result = await resolveEntitlement(args)

        expect(result).toEqual({ id: 7, vendor: { apiUrl: 'https://pl', vendorEmail: ['ops@pl'] }, cashback: 5 })
        // the full-vendor lookup must select the extended attribute set corporateCard depends on
        const options = serviceOperator.findOne.mock.calls[0][0]
        expect(options.include[0].attributes).toEqual(expect.arrayContaining(['healthUrl', 'optionals', 'vendorEmail']))
    })
})
