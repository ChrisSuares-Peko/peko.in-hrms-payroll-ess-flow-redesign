const router = require('../accountClosure')

const handlerNames = (method) => {
    const layer = router.stack.find((l) => l.route && l.route.methods[method])
    return layer.route.stack.map((h) => h.name)
}

describe('account closure routes', () => {
    // The middleware being correct is worthless if it is not mounted, and nothing else would catch that.
    it.each(['get', 'post'])('gates %s on the account owner, after the admin check', (method) => {
        const names = handlerNames(method)

        expect(names).toContain('verifyCorporateAdmin')
        expect(names).toContain('requireAccountOwner')
        expect(names.indexOf('requireAccountOwner')).toBeGreaterThan(
            names.indexOf('verifyCorporateAdmin')
        )
    })
})
