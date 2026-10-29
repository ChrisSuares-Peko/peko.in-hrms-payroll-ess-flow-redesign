const { listRoles } = require('../cardRoleCatalogue')
const catalogueModule = require('../../../controllers/corporate/cardRoleCatalogue')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const fetch = async () => {
    const res = buildRes()
    await listRoles({ user: { corporateId: 42, role: 'CORPORATE' } }, res)
    return res.json.mock.calls[0][0]
}

describe('listRoles', () => {
    it('returns both presets, Admin first', async () => {
        const body = await fetch()

        expect(body.status).toBe(true)
        expect(body.responseCode).toBe('000')
        expect(body.data.count).toBe(2)
        expect(body.data.rows.map((r) => r.roleName)).toEqual(['Admin', 'Employee'])
    })

    it('includes each role\'s full permission tree and a matching count', async () => {
        const { data } = await fetch()

        data.rows.forEach((row) => {
            const enabled = row.permissions.services
                .flatMap((s) => s.categories)
                .flatMap((c) => c.permissions)
                .filter((p) => p.enabled).length
            expect(row.permissionCount).toBe(enabled)
            expect(row.description).toBeTruthy()
        })
    })

    it('marks Employee as the default and Admin as the one with corporate authority', async () => {
        const byName = Object.fromEntries((await fetch()).data.rows.map((r) => [r.roleName, r]))

        expect(byName.Employee.isDefault).toBe(true)
        expect(byName.Admin.actsAsCorporateAdmin).toBe(true)
        expect(byName.Employee.actsAsCorporateAdmin).toBe(false)
    })

    it('gives Employee strictly fewer permissions than Admin', async () => {
        const byName = Object.fromEntries((await fetch()).data.rows.map((r) => [r.roleName, r]))

        expect(byName.Employee.permissionCount).toBeLessThan(byName.Admin.permissionCount)
        expect(byName.Employee.permissionCount).toBeGreaterThan(0)
    })

    it('exposes no write handlers', () => {
        expect(Object.keys(catalogueModule)).toEqual(['listRoles'])
    })

    it('does not depend on the corporate in the session — the presets are global', async () => {
        const res = buildRes()
        await listRoles({ user: {} }, res)

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json.mock.calls[0][0].data.count).toBe(2)
    })
})
