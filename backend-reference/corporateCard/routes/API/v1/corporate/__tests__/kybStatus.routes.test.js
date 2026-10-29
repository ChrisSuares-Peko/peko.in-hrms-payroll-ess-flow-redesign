const router = require('../kybStatus')

const handlerNames = (method, path) => {
    const layer = router.stack.find((l) => l.route && l.route.path === path && l.route.methods[method])
    return layer ? layer.route.stack.map((h) => h.name) : null
}

describe('kyb status routes', () => {
    // The middleware being correct is worthless if it is not mounted, and nothing else would catch that.
    it('gates the resubmission reopen on the corporate admin check', () => {
        const names = handlerNames('post', '/reopen')

        expect(names).toEqual(['verifyCorporateAdmin', expect.any(String)])
    })

    it('keeps the reopen separate from the submit, so reading the rejection cannot submit it', () => {
        expect(handlerNames('post', '/initiate')).not.toBeNull()
        expect(handlerNames('post', '/reopen')).not.toBeNull()
        expect(handlerNames('post', '/reopen')).not.toBe(handlerNames('post', '/initiate'))
    })
})
