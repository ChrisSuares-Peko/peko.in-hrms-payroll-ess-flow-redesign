jest.mock('../cacheDataMethods', () => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
}))

const { getValue } = require('../cacheDataMethods')
const systemUser = require('../../models/entities/systemUser')
const { checkPermission } = require('../checkPermission')

const permissionsGranting = (write) => ([
    {
        serviceCategory: 'Settings',
        services: [{ services: [{ service: 'Corporate Users', hasAccess: true, write }] }],
    },
])

const mockRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('checkPermission("Corporate Users")', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('resolves the session from Redis via x-user-key and grants write access', async () => {
        const sessionUser = { id: 1855, role: 'SYSTEM_USER' }
        getValue.mockResolvedValue(JSON.stringify(sessionUser))
        systemUser.findOne.mockResolvedValue({ roleAndPermission: { permissions: permissionsGranting(true) } })
        const req = { headers: { 'x-user-key': '1855_abc-session' } }
        const res = mockRes()
        const next = jest.fn()

        await checkPermission('Corporate Users', 'write')(req, res, next)

        expect(getValue).toHaveBeenCalledWith('userData_1855_abc-session')
        expect(req.user).toEqual(sessionUser)
        expect(systemUser.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { credentialId: 1855 } }))
        expect(next).toHaveBeenCalledWith()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('resolves an OIDC session keyed by its sessionuuid', async () => {
        getValue.mockResolvedValue(JSON.stringify({ id: 7, role: 'SYSTEM_USER' }))
        systemUser.findOne.mockResolvedValue({ roleAndPermission: { permissions: permissionsGranting(true) } })
        const req = { headers: { 'x-user-key': '0f4c2a9e-oidc-uuid' } }
        const next = jest.fn()

        await checkPermission('Corporate Users', 'write')(req, mockRes(), next)

        expect(getValue).toHaveBeenCalledWith('userData_0f4c2a9e-oidc-uuid')
        expect(next).toHaveBeenCalledWith()
    })

    it('rejects with 401 / responseCode 002 when no session header reaches the service', async () => {
        const req = { headers: {} }
        const res = mockRes()
        const next = jest.fn()

        await checkPermission('Corporate Users', 'write')(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false, responseCode: '002' }))
        expect(next).not.toHaveBeenCalled()
        expect(systemUser.findOne).not.toHaveBeenCalled()
    })

    it('rejects with 401 / responseCode 002 when the x-user-key session has expired from Redis', async () => {
        getValue.mockResolvedValue(null)
        const req = { headers: { 'x-user-key': '1855_expired' } }
        const res = mockRes()
        const next = jest.fn()

        await checkPermission('Corporate Users', 'write')(req, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: '002' }))
        expect(next).not.toHaveBeenCalled()
    })

    it('denies with 403 when the resolved system user lacks write access', async () => {
        getValue.mockResolvedValue(JSON.stringify({ id: 1855, role: 'SYSTEM_USER' }))
        systemUser.findOne.mockResolvedValue({ roleAndPermission: { permissions: permissionsGranting(false) } })
        const req = { headers: { 'x-user-key': '1855_abc-session' } }
        const next = jest.fn()

        await checkPermission('Corporate Users', 'write')(req, mockRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })
})
