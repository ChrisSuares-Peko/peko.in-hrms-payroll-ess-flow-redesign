// Shared across jest.isolateModules sandboxes, which re-run mock factories.
const mockFindAll = jest.fn()
const mockFetchPartnerBaseUrl = jest.fn()
jest.mock('../../models/entities/systemUser', () => ({ findAll: (...args) => mockFindAll(...args) }))
jest.mock('../../models/use-cases/systemUser', () => ({
    fetchPartnerBaseUrl: (...args) => mockFetchPartnerBaseUrl(...args),
}))
jest.mock('../loggerHelper', () => ({ customLog: jest.fn() }))
jest.mock('../../public/partnerLogos', () => [{ baseUrl: 'https://in.peko.one' }])

const systemUser = { findAll: mockFindAll }
const fetchPartnerBaseUrl = mockFetchPartnerBaseUrl

const ENV_KEYS = ['NODE_ENV', 'FRONTEND_PRODUCTION_URL', 'FRONTEND_STAGING_URL', 'IDP_FRONTEND_URL', 'TRUSTED_FRONTEND_ORIGINS']
const savedEnv = {}

// The module caches partner origins, so each test loads a fresh copy.
const load = () => {
    let mod
    jest.isolateModules(() => { mod = require('../trustedFrontendUrl') })
    return mod
}

// F-USR-06 / F-USR-10: the emailed reset / set-password link used to take its host straight from the request,
// so a caller could deliver a victim's live reset token to a lookalike host.
describe('resolveFrontendBaseUrl', () => {
    beforeEach(() => {
        ENV_KEYS.forEach((key) => { savedEnv[key] = process.env[key] })
        process.env.NODE_ENV = 'production'
        process.env.FRONTEND_PRODUCTION_URL = 'https://in.peko.one'
        process.env.FRONTEND_STAGING_URL = 'https://uatin.pekoapp.com'
        delete process.env.IDP_FRONTEND_URL
        delete process.env.TRUSTED_FRONTEND_ORIGINS
        systemUser.findAll.mockResolvedValue([
            { assets: { baseUrl: 'https://portal.partner.com' }, portalUrl: null },
            { assets: JSON.stringify({ baseUrl: 'https://json.partner.com/' }), portalUrl: 'https://other.partner.com' },
        ])
        fetchPartnerBaseUrl.mockResolvedValue(null)
    })

    afterEach(() => {
        ENV_KEYS.forEach((key) => {
            if (savedEnv[key] === undefined) delete process.env[key]
            else process.env[key] = savedEnv[key]
        })
        jest.clearAllMocks()
    })

    it('keeps a platform frontend URL as sent (minus a trailing slash)', async () => {
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://in.peko.one/')).resolves.toBe('https://in.peko.one')
        await expect(resolveFrontendBaseUrl('https://uatin.pekoapp.com')).resolves.toBe('https://uatin.pekoapp.com')
    })

    it('keeps a registered partner portal URL', async () => {
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://portal.partner.com')).resolves.toBe('https://portal.partner.com')
        await expect(resolveFrontendBaseUrl('https://json.partner.com')).resolves.toBe('https://json.partner.com')
        await expect(resolveFrontendBaseUrl('https://other.partner.com')).resolves.toBe('https://other.partner.com')
    })

    it('replaces an unrelated host with the platform frontend', async () => {
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://evil.example')).resolves.toBe('https://in.peko.one')
        await expect(resolveFrontendBaseUrl('https://in.peko.one.evil.example')).resolves.toBe('https://in.peko.one')
    })

    it("replaces an unrelated host with the account's partner portal when it has one", async () => {
        fetchPartnerBaseUrl.mockResolvedValue('https://portal.partner.com/')
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://evil.example', 55)).resolves.toBe('https://portal.partner.com')
        expect(fetchPartnerBaseUrl).toHaveBeenCalledWith(55)
    })

    it('falls back when no URL, or a non-http URL, is sent', async () => {
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl(undefined)).resolves.toBe('https://in.peko.one')
        await expect(resolveFrontendBaseUrl('javascript:alert(1)')).resolves.toBe('https://in.peko.one')
        await expect(resolveFrontendBaseUrl('not a url')).resolves.toBe('https://in.peko.one')
    })

    it("admits https sibling subdomains of the platform's own domains", async () => {
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://uatin.peko.one')).resolves.toBe('https://uatin.peko.one')
        await expect(resolveFrontendBaseUrl('https://partner.pekoapp.com')).resolves.toBe('https://partner.pekoapp.com')
        await expect(resolveFrontendBaseUrl('http://uatin.peko.one')).resolves.toBe('https://in.peko.one')
        await expect(resolveFrontendBaseUrl('https://peko.one.evil.example')).resolves.toBe('https://in.peko.one')
        await expect(resolveFrontendBaseUrl('https://evilpeko.one')).resolves.toBe('https://in.peko.one')
    })

    it('does not trust every sibling on a shared hosting domain', async () => {
        process.env.FRONTEND_STAGING_URL = 'https://peko-uat.vercel.app'
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://peko-uat.vercel.app')).resolves.toBe('https://peko-uat.vercel.app')
        await expect(resolveFrontendBaseUrl('https://attacker.vercel.app')).resolves.toBe('https://in.peko.one')
    })

    it('admits extra origins from TRUSTED_FRONTEND_ORIGINS', async () => {
        process.env.TRUSTED_FRONTEND_ORIGINS = 'https://a.example, https://b.example'
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://b.example')).resolves.toBe('https://b.example')
    })

    it('admits localhost only outside production', async () => {
        let { resolveFrontendBaseUrl } = load()
        await expect(resolveFrontendBaseUrl('http://localhost:3000')).resolves.toBe('https://in.peko.one')

        process.env.NODE_ENV = 'staging'
        ;({ resolveFrontendBaseUrl } = load())
        await expect(resolveFrontendBaseUrl('http://localhost:3000')).resolves.toBe('http://localhost:3000')
    })

    it('still answers when the partner lookup fails', async () => {
        systemUser.findAll.mockRejectedValue(new Error('db down'))
        const { resolveFrontendBaseUrl } = load()

        await expect(resolveFrontendBaseUrl('https://portal.partner.com')).resolves.toBe('https://in.peko.one')
        await expect(resolveFrontendBaseUrl('https://in.peko.one')).resolves.toBe('https://in.peko.one')
    })
})

describe('sanitizeBodyBaseUrl', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'production'
        process.env.FRONTEND_PRODUCTION_URL = 'https://in.peko.one'
        systemUser.findAll.mockResolvedValue([])
        fetchPartnerBaseUrl.mockResolvedValue(null)
    })

    it('rewrites an untrusted body.baseUrl before the controller runs', async () => {
        const { sanitizeBodyBaseUrl } = load()
        const req = { body: { baseUrl: 'https://evil.example', email: 'a@b.c' }, user: { registeredBy: null } }
        const next = jest.fn()

        await sanitizeBodyBaseUrl(req, {}, next)

        expect(req.body.baseUrl).toBe('https://in.peko.one')
        expect(req.body.email).toBe('a@b.c')
        expect(next).toHaveBeenCalledWith()
    })
})
