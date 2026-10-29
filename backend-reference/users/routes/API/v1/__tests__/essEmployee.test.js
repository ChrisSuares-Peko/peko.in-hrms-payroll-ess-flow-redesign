jest.mock('../../../../controllers/essEmployee', () => ({
    createEssUser: jest.fn(),
    listEssUsers: jest.fn(),
    deleteEssUser: jest.fn(),
    getEssAccess: jest.fn(),
    updateEssAccess: jest.fn(),
    updateEssEmail: jest.fn(),
}))
jest.mock('../../../../utils/apiValidation', () => ({
    validateCreateEssUser: (req, res, next) => next(),
    validateUpdateEssEmail: (req, res, next) => next(),
}))
jest.mock('../../../../utils/trustedFrontendUrl', () => ({ sanitizeBodyBaseUrl: (req, res, next) => next() }))

const router = require('../essEmployee')
const controllers = require('../../../../controllers/essEmployee')

const handlersFor = (method, path) =>
    router.stack.find((layer) => layer.route?.path === path && layer.route.methods[method]).route.stack
        .map((layer) => layer.handle)

const run = async (method, path, user) => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    const req = { user, body: {}, params: {}, headers: {} }
    for (const handler of handlersFor(method, path)) {
        let advanced = false
        await handler(req, res, () => { advanced = true })
        if (!advanced) break
    }
    return res
}

// F-USR-09: an ESS employee's own session (role USER) carries the employer's corporateId, which was the only
// scoping on these routes — so any employee could list colleagues, revoke them, or switch ESS off for everyone.
// Every ESS management route now needs the corporate owner or an Admin sub-user.
describe('/ess routes', () => {
    beforeEach(() => jest.clearAllMocks())

    const ROUTES = [
        ['post', '/user', 'createEssUser'],
        ['put', '/user/:employeeId/email', 'updateEssEmail'],
        ['get', '/users', 'listEssUsers'],
        ['delete', '/user/:employeeId', 'deleteEssUser'],
        ['get', '/access', 'getEssAccess'],
        ['patch', '/access', 'updateEssAccess'],
    ]

    it.each(ROUTES)('%s %s refuses an ESS employee session', async (method, path, controller) => {
        const res = await run(method, path, { role: 'USER', corporateId: 42 })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(controllers[controller]).not.toHaveBeenCalled()
    })

    it.each(ROUTES)('%s %s refuses an Employee-role sub-user', async (method, path, controller) => {
        const res = await run(method, path, { role: 'CORPORATE_SUB_USER', subCorporateRole: 'Employee', corporateId: 42 })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(controllers[controller]).not.toHaveBeenCalled()
    })

    it.each([
        ['the corporate owner', { role: 'CORPORATE' }],
        ['an Admin sub-user', { role: 'CORPORATE_SUB_USER', subCorporateRole: 'Admin' }],
    ])('lets %s manage ESS', async (_label, user) => {
        for (const [method, path] of ROUTES) await run(method, path, { ...user, corporateId: 42 })

        ROUTES.forEach(([, , controller]) => expect(controllers[controller]).toHaveBeenCalled())
    })
})
