const axios = require('axios')
const { internalGet, internalPost } = require('../othersClient')

jest.mock('axios')

const envelope = (data) => ({ data: { status: true, message: 'Success', data, responseCode: '000' } })

const buildReq = (overrides = {}) => ({
    originalUrl: '/api/v1/corporate/42/corporate-cards/transactions?page=1',
    headers: { authorization: 'Bearer jwt-token', sessionid: 'sess-1' },
    LogTraceId: 'trace-1',
    ...overrides,
})

describe('othersClient', () => {
    beforeEach(() => jest.clearAllMocks())

    it('routes through the gateway on the caller tree and forwards the session + internal headers', async () => {
        axios.mockResolvedValue(envelope({ ids: ['1'] }))

        const result = await internalGet('/sub-corporates/search-ids', { params: { searchText: 'a' }, req: buildReq() })

        expect(result).toEqual({ ids: ['1'] })
        const config = axios.mock.calls[0][0]
        expect(config.url).toBe('http://localhost:3000/api/v1/corporate/42/others/internal/sub-corporates/search-ids')
        expect(config.headers.authorization).toBe('Bearer jwt-token')
        expect(config.headers.sessionid).toBe('sess-1')
        expect(config.headers['x-peko-forwarded-from']).toBe('corporatecard-ms')
        expect(config.headers['x-request-id']).toBe('trace-1')
        expect(config.params).toEqual({ searchText: 'a' })
    })

    it('uses the system_user tree when the current request is a system-user one', async () => {
        axios.mockResolvedValue(envelope({ count: 1 }))
        const req = buildReq({ originalUrl: '/api/v1/system_user/7/corporate-cards/applications' })

        await internalGet('/corporates/pickable-count', { req })

        expect(axios.mock.calls[0][0].url).toBe('http://localhost:3000/api/v1/system_user/7/others/internal/corporates/pickable-count')
    })

    it('POSTs the body through', async () => {
        axios.mockResolvedValue(envelope({ rows: [] }))

        await internalPost('/sub-corporates/batch', { ids: ['1', '2'] }, { req: buildReq() })

        expect(axios.mock.calls[0][0]).toMatchObject({ method: 'post', data: { ids: ['1', '2'] } })
    })

    it('fails loud (500, no HTTP call) without a usable request context', async () => {
        await expect(internalGet('/corporates/pickable-count')).rejects.toMatchObject({ status_code: 500 })
        await expect(internalGet('/corporates/pickable-count', { req: { originalUrl: '/api/v1/webhook/pinelabs/x', headers: {} } }))
            .rejects.toMatchObject({ status_code: 500 })
        await expect(internalGet('/corporates/pickable-count', { req: buildReq({ headers: { sessionid: 's' } }) }))
            .rejects.toMatchObject({ status_code: 500 })
        expect(axios).not.toHaveBeenCalled()
    })

    it('retries once on a network error, then succeeds', async () => {
        axios.mockRejectedValueOnce(Object.assign(new Error('socket hang up'), {}))
        axios.mockResolvedValueOnce(envelope({ count: 1 }))

        const result = await internalGet('/corporates/pickable-count', { req: buildReq() })

        expect(result).toEqual({ count: 1 })
        expect(axios).toHaveBeenCalledTimes(2)
    })

    it('never retries a TIMEOUT (the upstream query may still be running) and maps it to 503', async () => {
        axios.mockRejectedValue(Object.assign(new Error('timeout of 5000ms exceeded'), { code: 'ECONNABORTED' }))

        await expect(internalGet('/corporates/pickable-count', { req: buildReq() })).rejects.toMatchObject({ status_code: 503 })
        expect(axios).toHaveBeenCalledTimes(1)
    })

    it('maps a persistent network failure to a 503 with a user-safe message', async () => {
        axios.mockRejectedValue(new Error('connect ECONNREFUSED'))

        await expect(internalGet('/corporates/pickable-count', { req: buildReq() })).rejects.toMatchObject({
            status_code: 503,
            message: 'Service temporarily unavailable. Please try again.',
        })
        expect(axios).toHaveBeenCalledTimes(2)
    })

    it('never retries a 4xx (session/key problem or client bug) and maps it to a generic 502', async () => {
        axios.mockRejectedValue({ response: { status: 401, data: { message: 'Unauthorized' } }, message: 'Request failed' })

        await expect(internalGet('/corporates/pickable-count', { req: buildReq() })).rejects.toMatchObject({ status_code: 502 })
        expect(axios).toHaveBeenCalledTimes(1)
    })

    it('retries an upstream 503 once, then maps to 502 (upstream reachable but failing)', async () => {
        axios.mockRejectedValue({ response: { status: 503, data: {} }, message: 'Service Unavailable' })

        await expect(internalGet('/corporates/pickable-count', { req: buildReq() })).rejects.toMatchObject({ status_code: 502 })
        expect(axios).toHaveBeenCalledTimes(2)
    })

    it('treats a non-standard envelope (status !== true) as a 502', async () => {
        axios.mockResolvedValue({ data: { status: false, message: 'nope' } })

        await expect(internalGet('/corporates/pickable-count', { req: buildReq() })).rejects.toMatchObject({ status_code: 502 })
    })
})

/**
 * `others` mounts the shared-data surface under /corporate and /system_user only. An employee addresses this
 * service as /user/:id, and that segment was rejected outright — so every shared-data lookup from an employee
 * session failed before it was sent, and the People list came back empty for them.
 */
describe('othersClient — an employee session', () => {
    const employeeReq = (overrides = {}) => ({
        originalUrl: '/api/v1/user/1828/corporate-cards/cardholders?page=1&itemsPerPage=10',
        headers: { authorization: 'Bearer jwt-token', sessionid: 'sess-1' },
        user: { role: 'USER', id: 1828, corporateId: 42, employeeProfileId: 900 },
        LogTraceId: 'trace-1',
        ...overrides,
    })

    beforeEach(() => jest.clearAllMocks())

    it('routes onto the corporate tree, addressed by the session corporate', async () => {
        axios.mockResolvedValue(envelope({ count: 0, rows: [] }))

        await internalGet('/card-users', { params: { serviceLabel: 'Corporate Cards' }, req: employeeReq() })

        expect(axios.mock.calls[0][0].url).toBe(
            'http://localhost:3000/api/v1/corporate/42/others/internal/card-users'
        )
    })

    // The employee's own id would address a corporate that is not theirs if a handler ever read the param.
    it('never addresses the tree by the employee own id', async () => {
        axios.mockResolvedValue(envelope({ rows: [] }))

        await internalPost('/card-users/batch', { ids: ['1'] }, { req: employeeReq() })

        expect(axios.mock.calls[0][0].url).not.toContain('/1828/')
    })

    it('still forwards the caller own session, so others scopes to them', async () => {
        axios.mockResolvedValue(envelope({ rows: [] }))

        await internalGet('/card-users', { req: employeeReq() })

        const { headers } = axios.mock.calls[0][0]
        expect(headers.authorization).toBe('Bearer jwt-token')
        expect(headers.sessionid).toBe('sess-1')
    })

    it('refuses a session carrying no corporate rather than guessing one', async () => {
        await expect(
            internalGet('/card-users', { req: employeeReq({ user: { role: 'USER', id: 1828 } }) })
        ).rejects.toThrow()
        expect(axios).not.toHaveBeenCalled()
    })

    it('leaves a system_user caller on its own cross-corporate tree', async () => {
        axios.mockResolvedValue(envelope({ rows: [] }))

        await internalGet('/corporates/batch', {
            req: {
                originalUrl: '/api/v1/system_user/9/corporate-cards/applications',
                headers: { authorization: 'Bearer jwt-token', sessionid: 'sess-1' },
                user: { role: 'SYSTEM_USER', id: 9 },
            },
        })

        expect(axios.mock.calls[0][0].url).toBe(
            'http://localhost:3000/api/v1/system_user/9/others/internal/corporates/batch'
        )
    })
})
