const { verifyCorporateOwnerOrAdmin } = require('../verifyCorporateOwnerOrAdmin')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const run = (user) => {
    const res = buildRes()
    const next = jest.fn()
    verifyCorporateOwnerOrAdmin({ user }, res, next)
    return { res, next }
}

// Without this guard the sub-corporate management routes were reachable by ANY authenticated sub-user, and
// because req.user.id for a sub-user is the PARENT corporate's credential id the tenant WHERE clause accepted
// them — so an Employee could edit, and promote, themselves.
describe('verifyCorporateOwnerOrAdmin', () => {
    it('admits the corporate owner', () => {
        const { next, res } = run({ role: 'CORPORATE' })

        expect(next).toHaveBeenCalled()
        expect(res.status).not.toHaveBeenCalled()
    })

    it('admits a sub-corporate whose job role is Admin', () => {
        const { next } = run({ role: 'CORPORATE_SUB_USER', subCorporateRole: 'Admin' })

        expect(next).toHaveBeenCalled()
    })

    it('tolerates surrounding whitespace on the stored role', () => {
        expect(run({ role: 'CORPORATE_SUB_USER', subCorporateRole: '  Admin  ' }).next).toHaveBeenCalled()
    })

    it('rejects an Employee — the escalation path this guard exists to close', () => {
        const { next, res } = run({ role: 'CORPORATE_SUB_USER', subCorporateRole: 'Employee' })

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
        // '001', never '004' — the frontend interceptor hard-redirects to /404 on '004'.
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            // '007' = no permission, so the frontend says so rather than showing a bare error.
            responseCode: '007',
            message: "You don't have permission to perform this action.",
        }))
    })

    it('rejects every near-miss spelling, so only the canonical name grants authority', () => {
        ['admin', 'ADMIN', 'AdMiN', 'Administrator', 'Accountant', '', '   ', null, undefined]
            .forEach((subCorporateRole) => {
                expect(run({ role: 'CORPORATE_SUB_USER', subCorporateRole }).next).not.toHaveBeenCalled()
            })
    })

    it('rejects a non-string job role rather than coercing it', () => {
        [{}, [], 1, true, { toString: () => 'Admin' }].forEach((subCorporateRole) => {
            expect(run({ role: 'CORPORATE_SUB_USER', subCorporateRole }).next).not.toHaveBeenCalled()
        })
    })

    it('does not let a job role of Admin promote a credential that is not a sub-corporate', () => {
        expect(run({ role: 'SYSTEM_USER', subCorporateRole: 'Admin' }).next).not.toHaveBeenCalled()
        expect(run({ role: 'USER', subCorporateRole: 'Admin' }).next).not.toHaveBeenCalled()
    })

    it('rejects a request with no user at all rather than throwing', () => {
        const res = buildRes()
        const next = jest.fn()

        verifyCorporateOwnerOrAdmin({}, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(403)
    })
})
