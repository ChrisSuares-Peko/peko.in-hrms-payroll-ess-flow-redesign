const crypto = require('crypto')

jest.mock('../../../../utils/idpToken', () => ({ signIdpToken: jest.fn(() => 'signed'), verifyIdpToken: jest.fn() }))
jest.mock('../../../../models/use-cases/credential', () => ({ findOneCredential: jest.fn() }))
jest.mock('../../../../models/use-cases/corporateUser', () => ({ findOneWithCredentialId: jest.fn() }))
jest.mock('../../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../../../models/use-cases/oauth_clients', () => ({ findOauthClientDetails: jest.fn() }))
jest.mock('../../../../utils/cacheDataMethods', () => ({ setValue: jest.fn(), getValue: jest.fn(), deleteKey: jest.fn() }))
jest.mock('../../../../utils/apiValidation', () => ({
    validateOAuthConsentRequest: (req, res, next) => next(),
    validateOAuthTokenRequest: (req, res, next) => next(),
    validateAuthorizeRequest: (req, res, next) => next(),
}))
jest.mock('../../../../models/use-cases/oauth_consents', () => ({
    findOauthConsentDetails: jest.fn(),
    createOrUpdateOauthConsent: jest.fn(),
    findAllOauthConsentsByCredential: jest.fn(),
    deleteOauthConsent: jest.fn(),
}))
jest.mock('../../../../utils/jwtToken', () => ({ verifyToken: jest.fn(), resolveSessionUser: jest.fn() }))
jest.mock('../../../../services/authHelper', () => ({}))
jest.mock('../../../../models/use-cases/systemUser', () => ({}))

const app = require('../idp')
const { verifyIdpToken } = require('../../../../utils/idpToken')
const { findOneCredential } = require('../../../../models/use-cases/credential')
const { findOauthClientDetails } = require('../../../../models/use-cases/oauth_clients')
const { setValue, getValue, deleteKey } = require('../../../../utils/cacheDataMethods')
const { createOrUpdateOauthConsent, findOauthConsentDetails } = require('../../../../models/use-cases/oauth_consents')
const { resolveSessionUser } = require('../../../../utils/jwtToken')

// The route's own handlers, in order, so they can be driven without an HTTP server.
const handlersFor = (method, path) =>
    app._router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route.stack
        .map((layer) => layer.handle)

const run = async (method, path, req) => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    const next = jest.fn()
    const request = { headers: {}, body: {}, query: {}, ...req }
    for (const handler of handlersFor(method, path)) {
        let advanced = false
        await handler(request, res, (err) => {
            if (err) next(err)
            else advanced = true
        })
        if (!advanced) break
    }
    return { res, next }
}

const CLIENT = {
    client_id: 'partner-app',
    client_secret: 'REDACTED',
    redirect_uris: ['https://partner.example/cb'],
    active: true,
}
const BRIDGE = {
    client_id: 'partner-app',
    redirect_uri: 'https://partner.example/cb',
    code_challenge: 'challenge',
    state: 's',
    scope: 'openid profile',
}

beforeEach(() => {
    jest.clearAllMocks()
    findOauthClientDetails.mockResolvedValue(CLIENT)
    verifyIdpToken.mockReturnValue(BRIDGE)
})

// F-USR-01: POST /consent had no session check and stored the auth code for req.body.user.id, so anyone with a
// bridge token could mint a code — and from it a full session — for any credential id.
describe('POST /consent', () => {
    it('refuses without a logged-in session and stores no code', async () => {
        resolveSessionUser.mockResolvedValue(null)

        const { next, res } = await run('post', '/consent', { body: { token: 't', user: { id: 1 } } })

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 401 }))
        expect(res.status).not.toHaveBeenCalled()
        expect(setValue).not.toHaveBeenCalled()
    })

    it('refuses a body user id that differs from the session user', async () => {
        resolveSessionUser.mockResolvedValue({ id: 10 })

        const { next } = await run('post', '/consent', { body: { token: 't', user: { id: 99 } } })

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
        expect(setValue).not.toHaveBeenCalled()
        expect(createOrUpdateOauthConsent).not.toHaveBeenCalled()
    })

    it("issues a 10-minute code bound to the session user's id", async () => {
        resolveSessionUser.mockResolvedValue({ id: 10 })

        const { res } = await run('post', '/consent', { body: { token: 't', user: { id: 10 } } })

        expect(res.status).toHaveBeenCalledWith(200)
        const [key, ttl, payload] = setValue.mock.calls[0]
        expect(key).toMatch(/^oauth_code_/)
        expect(ttl).toBe(600)
        expect(JSON.parse(payload)).toEqual(expect.objectContaining({ user_id: 10, client_id: 'partner-app' }))
        expect(createOrUpdateOauthConsent).toHaveBeenCalledWith(10, 'partner-app', ['openid', 'profile'])
    })
})

describe('GET /consent', () => {
    it('answers for the session user rather than the query user_id', async () => {
        resolveSessionUser.mockResolvedValue({ id: 10 })
        findOauthConsentDetails.mockResolvedValue({ scopes: ['openid'] })

        await run('get', '/consent', { query: { client_id: 'partner-app', user_id: '99', scope: 'openid' } })

        expect(findOauthConsentDetails).toHaveBeenCalledWith(10, 'partner-app', ['scopes'])
    })
})

// F-USR-17
describe('POST /token', () => {
    const verifier = 'v'.repeat(43)
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
    const tokenRequest = (body) => ({
        body: { client_id: 'partner-app', client_secret: 'REDACTED', redirect_uri: 'https://partner.example/cb', ...body },
    })

    it('rejects a wrong client secret', async () => {
        const { next } = await run('post', '/token', tokenRequest({ client_secret: 'REDACTED', code: 'c', code_verifier: verifier }))

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 401 }))
        expect(getValue).not.toHaveBeenCalled()
    })

    it('burns the code after a failed PKCE check', async () => {
        getValue.mockResolvedValue(JSON.stringify({
            client_id: 'partner-app', redirect_uri: 'https://partner.example/cb', code_challenge: challenge, user_id: 10,
        }))

        const { next } = await run('post', '/token', tokenRequest({ code: 'c', code_verifier: 'w'.repeat(43) }))

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
        expect(deleteKey).toHaveBeenCalledWith('oauth_code_c')
    })

    it('records the client on an issued refresh token', async () => {
        getValue.mockResolvedValue(JSON.stringify({
            client_id: 'partner-app', redirect_uri: 'https://partner.example/cb', code_challenge: challenge,
            user_id: 10, scope: 'openid offline_access',
        }))
        findOneCredential.mockResolvedValue({ id: 10, name: 'A', email: 'a@b.c' })

        const { res } = await run('post', '/token', tokenRequest({ code: 'c', code_verifier: verifier }))

        expect(res.status).toHaveBeenCalledWith(200)
        const refreshWrite = setValue.mock.calls.find(([key]) => key.startsWith('oauth_refresh_tkn_'))
        expect(JSON.parse(refreshWrite[2])).toEqual(expect.objectContaining({ client_id: 'partner-app', user_id: 10 }))
    })

    it("rejects a refresh token presented by a client it wasn't issued to", async () => {
        getValue.mockResolvedValue(JSON.stringify({ user_id: 10, scope: 'openid', client_id: 'another-app' }))

        const { next, res } = await run('post', '/token', tokenRequest({ grant_type: 'refresh_token', refresh_token: 'r' }))

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 401 }))
        expect(res.status).not.toHaveBeenCalled()
    })
})
