const { internalGet, internalPost } = require('../othersClient')
const { getValue, setValue, deleteValue } = require('../cacheDataMethods')
const ErrorResponse = require('../error-response')
const { findServiceOperatorByAccessKey, fetchServiceDetails } = require('../checkAndFetchServiceDetails')

jest.mock('../othersClient', () => ({ internalGet: jest.fn(), internalPost: jest.fn() }))

describe('findServiceOperatorByAccessKey', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getValue.mockReset()
        getValue.mockResolvedValue(null)
    })

    it('resolves the operator (no entitlement check) via the internal API and caches it', async () => {
        const serviceOperator = { id: 7, accessKey: 'corporate_cards', vendor: { apiUrl: 'https://pl' } }
        internalGet.mockResolvedValue({ serviceOperator })
        const req = { LogTraceId: 'trace-1' }

        const result = await findServiceOperatorByAccessKey('corporate_cards', req)

        expect(internalGet).toHaveBeenCalledWith('/service-operators/by-access-key/corporate_cards', { req })
        expect(result).toEqual(serviceOperator)
        expect(setValue).toHaveBeenCalledWith('cc:internal:so:corporate_cards', 300, JSON.stringify(serviceOperator))
        expect(setValue).toHaveBeenCalledWith('cc:internal:so:corporate_cards:stale', 3600, JSON.stringify(serviceOperator))
    })

    it('serves the fresh cache without calling others', async () => {
        const cached = { id: 7, accessKey: 'corporate_cards' }
        getValue.mockImplementation(async (key) => (key === 'cc:internal:so:corporate_cards' ? JSON.stringify(cached) : null))

        const result = await findServiceOperatorByAccessKey('corporate_cards')

        expect(result).toEqual(cached)
        expect(internalGet).not.toHaveBeenCalled()
    })

    it('returns an { error } when the operator is not found — cached fresh-only, and any stale copy is purged', async () => {
        internalGet.mockResolvedValue({ serviceOperator: null })

        const result = await findServiceOperatorByAccessKey('unknown')

        expect(result).toEqual({ error: 'Service not available' })
        expect(setValue).not.toHaveBeenCalledWith('cc:internal:so:unknown:stale', expect.anything(), expect.anything())
        expect(deleteValue).toHaveBeenCalledWith('cc:internal:so:unknown:stale')
    })

    it('serves the stale copy when others is unreachable, re-priming the fresh key briefly', async () => {
        const stale = { id: 7, accessKey: 'corporate_cards' }
        getValue.mockImplementation(async (key) => (key === 'cc:internal:so:corporate_cards:stale' ? JSON.stringify(stale) : null))
        internalGet.mockRejectedValue(new ErrorResponse('Service temporarily unavailable. Please try again.', 503))

        const result = await findServiceOperatorByAccessKey('corporate_cards')

        expect(result).toEqual(stale)
        expect(setValue).toHaveBeenCalledWith('cc:internal:so:corporate_cards', 20, JSON.stringify(stale))
        expect(setValue).not.toHaveBeenCalledWith('cc:internal:so:corporate_cards:stale', expect.anything(), expect.anything())
    })

    it('rethrows when others is unreachable and no stale copy exists (fail closed)', async () => {
        internalGet.mockRejectedValue(new ErrorResponse('Service temporarily unavailable. Please try again.', 503))

        await expect(findServiceOperatorByAccessKey('corporate_cards')).rejects.toMatchObject({ status_code: 503 })
    })
})

describe('fetchServiceDetails', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        getValue.mockReset()
        getValue.mockResolvedValue(null)
    })

    const req = { LogTraceId: 'trace-1' }
    const details = { credentialId: 11, corporateUserId: 42, accessKey: 'corporate_cards', packageId: 3, req }

    it('resolves the entitlement via the internal API (identity stays session-side) and caches the result', async () => {
        const resolved = { id: 7, cashbackRate: 5, vendor: { apiUrl: 'https://pl' } }
        internalPost.mockResolvedValue({ details: resolved })

        const result = await fetchServiceDetails(details)

        expect(internalPost).toHaveBeenCalledWith('/entitlements/resolve', { accessKey: 'corporate_cards' }, { req })
        expect(result).toEqual(resolved)
        expect(setValue).toHaveBeenCalledWith('cc:internal:ent:11:corporate_cards', 90, JSON.stringify(resolved))
        expect(setValue).toHaveBeenCalledWith('cc:internal:ent:11:corporate_cards:stale', 3600, JSON.stringify(resolved))
    })

    it('passes { error } results through unchanged, caches them fresh-only, and PURGES the stale grant', async () => {
        internalPost.mockResolvedValue({ details: { error: 'Service is disabled' } })

        const result = await fetchServiceDetails(details)

        expect(result).toEqual({ error: 'Service is disabled' })
        expect(setValue).toHaveBeenCalledWith('cc:internal:ent:11:corporate_cards', 90, JSON.stringify({ error: 'Service is disabled' }))
        expect(setValue).not.toHaveBeenCalledWith('cc:internal:ent:11:corporate_cards:stale', expect.anything(), expect.anything())
        expect(deleteValue).toHaveBeenCalledWith('cc:internal:ent:11:corporate_cards:stale')
    })

    it('serves the fresh cache without calling others', async () => {
        const cached = { id: 7, cashbackRate: 5 }
        getValue.mockImplementation(async (key) => (key === 'cc:internal:ent:11:corporate_cards' ? JSON.stringify(cached) : null))

        const result = await fetchServiceDetails(details)

        expect(result).toEqual(cached)
        expect(internalPost).not.toHaveBeenCalled()
    })

    it('serves the stale copy when others is unreachable', async () => {
        const stale = { id: 7, cashbackRate: 5 }
        getValue.mockImplementation(async (key) => (key === 'cc:internal:ent:11:corporate_cards:stale' ? JSON.stringify(stale) : null))
        internalPost.mockRejectedValue(new ErrorResponse('Service temporarily unavailable. Please try again.', 503))

        const result = await fetchServiceDetails(details)

        expect(result).toEqual(stale)
    })

    it('rethrows when others is unreachable and no stale copy exists (fail closed — never act unverified)', async () => {
        internalPost.mockRejectedValue(new ErrorResponse('Service temporarily unavailable. Please try again.', 503))

        await expect(fetchServiceDetails(details)).rejects.toMatchObject({ status_code: 503 })
    })

    it('errors without calling others when the caller context is incomplete', async () => {
        const result = await fetchServiceDetails({ accessKey: 'corporate_cards' })

        expect(result).toEqual({ error: 'Unable to process your request' })
        expect(internalPost).not.toHaveBeenCalled()
    })
})
