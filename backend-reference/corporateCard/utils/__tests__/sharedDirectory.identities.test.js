jest.mock('../othersClient', () => ({ internalGet: jest.fn(), internalPost: jest.fn() }))
jest.mock('../cacheDataMethods', () => ({ getValue: jest.fn(), setValue: jest.fn() }))
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }))

const { internalGet, internalPost } = require('../othersClient')
const {
    listCardUserIdentities,
    listCardUserIds,
    getSelfCorporate,
    getCardholdersByIdentities,
    findCardholderById,
} = require('../sharedDirectory')

const paramsOf = () => internalGet.mock.calls[0][1].params

describe('listCardUserIdentities', () => {
    beforeEach(() => jest.clearAllMocks())

    it('asks the directory for the Corporate Cards members', async () => {
        internalGet.mockResolvedValue({ members: [] })

        await listCardUserIdentities({ req: {} })

        expect(internalGet).toHaveBeenCalledWith('/card-users/ids', expect.anything())
        expect(paramsOf()).toEqual({ serviceLabel: 'Corporate Cards' })
    })

    it('opts the account holder in only when asked', async () => {
        internalGet.mockResolvedValue({ members: [] })

        await listCardUserIdentities({ includeOwner: true, req: {} })

        expect(paramsOf()).toEqual({ serviceLabel: 'Corporate Cards', includeOwner: 'true' })
    })

    it('returns id and mobile per member, as strings the KYC maps can key on', async () => {
        internalGet.mockResolvedValue({
            members: [{ id: 1, mobileNo: '9876543210' }, { id: 2, mobileNo: null }],
        })

        await expect(listCardUserIdentities({ req: {} })).resolves.toEqual([
            { id: '1', mobileNo: '9876543210' },
            { id: '2', mobileNo: null },
        ])
    })

    // The resilience case: corporateCard deployed ahead of others, so the directory answers with ids only.
    // The count must stay right — it just loses the mobile key and falls back to id-keyed KYC.
    it('falls back to id-only entries when the directory sends no members', async () => {
        internalGet.mockResolvedValue({ ids: ['1', '2'] })

        await expect(listCardUserIdentities({ req: {} })).resolves.toEqual([
            { id: '1', mobileNo: null },
            { id: '2', mobileNo: null },
        ])
    })

    it('returns nothing rather than throwing when the directory sends neither', async () => {
        internalGet.mockResolvedValue({})

        await expect(listCardUserIdentities({ req: {} })).resolves.toEqual([])
    })

    it('prefers members over ids when both arrive', async () => {
        internalGet.mockResolvedValue({ ids: ['9'], members: [{ id: 1, mobileNo: '9876543210' }] })

        await expect(listCardUserIdentities({ req: {} })).resolves.toEqual([
            { id: '1', mobileNo: '9876543210' },
        ])
    })

    // The id spaces overlap, so a member id is only meaningful alongside the table it came from.
    it('carries the id space each member came from', async () => {
        internalGet.mockResolvedValue({
            members: [
                { id: 1, mobileNo: '9876543210' },
                { id: 1, mobileNo: '9812345678' },
            ],
        })

        await expect(listCardUserIdentities({ req: {} })).resolves.toEqual([
            { id: '1', mobileNo: '9876543210' },
            { id: '1', mobileNo: '9812345678' },
        ])
    })

    it('lets a directory failure surface, so the caller reports the KPI unavailable', async () => {
        internalGet.mockRejectedValue(new Error('502'))

        await expect(listCardUserIdentities({ req: {} })).rejects.toThrow('502')
    })
})

describe('listCardUserIds', () => {
    beforeEach(() => jest.clearAllMocks())

    // Kept working unchanged while the endpoint grew a second field.
    it('still returns the bare id list', async () => {
        internalGet.mockResolvedValue({ ids: ['1', '2'] })

        await expect(listCardUserIds({ req: {} })).resolves.toEqual(['1', '2'])
    })

    it('returns nothing when the directory sends no ids', async () => {
        internalGet.mockResolvedValue({})

        await expect(listCardUserIds({ req: {} })).resolves.toEqual([])
    })
})

describe('getSelfCorporate', () => {
    beforeEach(() => jest.clearAllMocks())

    it('resolves the session corporate via the corporate-tree endpoint, not the SYSTEM_USER-only batch one', async () => {
        internalGet.mockResolvedValue({ row: { id: '42', credential: { username: 'corp-admin' } } })
        const req = {}

        await expect(getSelfCorporate(req)).resolves.toEqual({ id: '42', credential: { username: 'corp-admin' } })
        expect(internalGet).toHaveBeenCalledWith('/corporates/self', { req })
    })

    it('returns null when the directory has no row for the session', async () => {
        internalGet.mockResolvedValue({})

        await expect(getSelfCorporate({})).resolves.toBeNull()
    })
})


/**
 * Every /card-users endpoint needs the service label: role and status are per-service, read out of the
 * caller's own membership entry, so the directory cannot project a row without knowing who is asking.
 *
 * The batch omitted it, so it 400'd on every call — and attachCardholders turns a failed hydration into a
 * null cardholder, so the approval queue, the cards list and the transactions list all rendered "-" where a
 * member's name belongs, with nothing on screen to say why.
 */
describe('cardholder hydration', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        require('../cacheDataMethods').getValue.mockResolvedValue(null)
    })

    it('sends the service label on the batch lookup', async () => {
        internalPost.mockResolvedValue({ rows: [] })

        await getCardholdersByIdentities([{ userId: 900 }], {})

        expect(internalPost).toHaveBeenCalledWith(
            '/card-users/batch',
            { ids: ['900'] },
            expect.objectContaining({ params: { serviceLabel: 'Corporate Cards' } })
        )
    })

    it('returns the resolved cardholders keyed by id', async () => {
        internalPost.mockResolvedValue({ rows: [{ id: 900, name: 'Aarav Sharma' }] })

        const map = await getCardholdersByIdentities([{ userId: 900 }], {})

        expect(map.get('900')).toEqual({ id: 900, name: 'Aarav Sharma' })
    })

    it('sends the service label when resolving one cardholder too', async () => {
        internalPost.mockResolvedValue({ rows: [] })

        await findCardholderById(900, {})

        expect(internalPost.mock.calls[0][2]).toEqual(
            expect.objectContaining({ params: { serviceLabel: 'Corporate Cards' } })
        )
    })

    it('asks for nothing when there is no identity to resolve', async () => {
        expect(await getCardholdersByIdentities([], {})).toEqual(new Map())
        expect(await findCardholderById(null, {})).toBeNull()
        expect(internalPost).not.toHaveBeenCalled()
    })
})
