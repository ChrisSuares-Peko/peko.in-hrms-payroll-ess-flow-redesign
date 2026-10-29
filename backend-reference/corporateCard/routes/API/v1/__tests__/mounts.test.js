// Each sub-tree is replaced by a bare router carrying a name, so the mounts can be asserted without loading
// the real trees (and with them the database and vendor clients).
const mockStub = (name) => {
    const r = require('express').Router()
    r.__stubName = name
    return r
}

jest.mock('../corporate', () => mockStub('corporate'))
jest.mock('../systemUser', () => mockStub('systemUser'))
jest.mock('../webhook', () => mockStub('webhook'))

const router = require('../index')

// An express() app keeps its mounts on _router; the fallbacks cover the shape changing across versions.
const stack = (router._router || router.router || router).stack || []

const layersFor = (name) => stack.filter(
    (layer) => layer.handle && layer.handle.__stubName === name
)

const mountMatches = (layer, path) => layer.regexp.test(path)

describe('corporate-cards route mounts', () => {
    // A cardholder can hold either identity, and the client builds the URL from its own role: a corporate or
    // sub-corporate session sends /corporate/:id/..., an employee sends /user/:id/.... A missing mount does
    // not fail loudly — every call just 404s with "resource not found", which reads like a broken deploy.
    it('serves the corporate tree to both corporate and employee sessions', () => {
        const mounts = layersFor('corporate')

        expect(mounts).toHaveLength(2)
        expect(mounts.some((layer) => mountMatches(layer, '/corporate/42/corporate-cards'))).toBe(true)
        expect(mounts.some((layer) => mountMatches(layer, '/user/55/corporate-cards'))).toBe(true)
    })

    it('serves the same tree to both, so neither identity can drift behind the other', () => {
        const [first, second] = layersFor('corporate')

        expect(first.handle).toBe(second.handle)
    })

    // The admin surface stays corporate-scoped: an employee must not reach it by changing the userType
    // segment in the URL.
    it('does not expose the system-user tree to a corporate or employee session', () => {
        const [systemUser] = layersFor('systemUser')

        expect(mountMatches(systemUser, '/system_user/9/corporate-cards')).toBe(true)
        expect(mountMatches(systemUser, '/user/55/corporate-cards')).toBe(false)
        expect(mountMatches(systemUser, '/corporate/42/corporate-cards')).toBe(false)
    })

    it('keeps the webhook tree on its own userType', () => {
        const [webhook] = layersFor('webhook')

        expect(mountMatches(webhook, '/webhook/pinelabs/corporate-cards')).toBe(true)
        expect(mountMatches(webhook, '/user/55/corporate-cards')).toBe(false)
    })
})
