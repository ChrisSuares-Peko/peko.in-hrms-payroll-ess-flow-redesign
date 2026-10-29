const { verifyCorporateAdmin } = require('../verifyCorporateAdmin')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const run = (user) => {
    const res = buildRes()
    const next = jest.fn()
    verifyCorporateAdmin({ user }, res, next)
    return { res, next }
}

describe('verifyCorporateAdmin — an employee Admin', () => {
    it('admits an employee whose card role is Admin', () => {
        const { next } = run({ role: 'USER', corporateId: 42, employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Admin', status: 'ACTIVE' }] })

        expect(next).toHaveBeenCalled()
    })

    it('still rejects an Employee', () => {
        const { next, res } = run({ role: 'USER', corporateId: 42, employeeProfileId: '99', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] })

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: '007' }))
    })

    it('rejects a sub-corporate session with no job role at all', () => {
        expect(run({ role: 'USER', corporateId: 42, employeeProfileId: '99' }).next).not.toHaveBeenCalled()
    })

    it('rejects near-miss spellings, so only the canonical name grants authority', () => {
        ['admin', 'ADMIN', 'Administrator', 'Accountant', ''].forEach((subCorporateRole) => {
            expect(run({ role: 'USER', employeeProfileId: '99', subCorporateRole }).next).not.toHaveBeenCalled()
        })
    })

    it('keeps admitting the corporate owner', () => {
        expect(run({ role: 'CORPORATE', corporateId: 42 }).next).toHaveBeenCalled()
    })
})
