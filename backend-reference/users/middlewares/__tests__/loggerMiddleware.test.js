jest.mock('../../utils/logger', () => ({ info: jest.fn(), error: jest.fn() }))

const logger = require('../../utils/logger')
const createLog = require('../loggerMiddleware')

const request = (body, query = {}) => ({
    method: 'POST',
    originalUrl: '/login',
    body,
    params: {},
    query,
    headers: {},
    connection: {},
})

const loggedRequest = () => logger.info.mock.calls[0][0].request

// F-USR-05: every non-GET body was spread into an info log shipped to Elasticsearch / Loki / Logtail, so login
// passwords, OTPs, reset tokens, client secrets and PAN/GST numbers all landed in third-party log stores.
describe('request logger', () => {
    beforeEach(() => jest.clearAllMocks())

    it('masks credentials, OTPs, tokens and tax ids in the body', () => {
        createLog(request({
            username: 'alice',
            password: 'REDACTED',
            newPassword: 'N3w!',
            emailOtp: '123456',
            phoneOtp: '654321',
            refreshToken: 'jwt',
            client_secret: 'shh',
            code_verifier: 'v',
            pan: 'ABCDE1234F',
            gstNumber: '22AAAAA0000A1Z5',
            user: { id: 7, token: 'nested' },
        }), { statusCode: 200 })

        const { reqBody } = loggedRequest()
        expect(reqBody).toEqual({
            username: 'alice',
            password: '***',
            newPassword: '***',
            emailOtp: '***',
            phoneOtp: '***',
            refreshToken: '***',
            client_secret: '***',
            code_verifier: '***',
            pan: '***',
            gstNumber: '***',
            user: { id: 7, token: '***' },
        })
    })

    it('masks sensitive query parameters too', () => {
        createLog(request({}, { token: 'abc', page: '2' }), { statusCode: 200 })

        expect(loggedRequest().queryParams).toEqual({ token: '***', page: '2' })
    })

    it('does not modify the live request body', () => {
        const body = { password: 'secret' }
        createLog(request(body), { statusCode: 200 })

        expect(body.password).toBe('secret')
    })
})
