const asyncHandler = require('../async')

describe('asyncHandler', () => {
    it('forwards ALL arguments to the wrapped fn (not just req/res/next)', async () => {
        const inner = jest.fn().mockResolvedValue('ok')
        const wrapped = asyncHandler(inner)

        await wrapped(1, 2, 3, 4)

        expect(inner).toHaveBeenCalledWith(1, 2, 3, 4)
    })

    it('resolves to the wrapped fn\'s return value', async () => {
        const wrapped = asyncHandler(async (a, b) => a + b)

        await expect(wrapped(2, 3)).resolves.toBe(5)
    })

    it('route-handler form: routes a rejection to next() (the 3rd arg is a function)', async () => {
        const err = new Error('boom')
        const next = jest.fn()
        const wrapped = asyncHandler(async () => { throw err })

        await wrapped({}, {}, next)

        expect(next).toHaveBeenCalledWith(err)
    })

    it('use-case form: propagates a rejection to the caller when the 3rd arg is non-callable data', async () => {
        const err = new Error('lock timeout')
        const wrapped = asyncHandler(async () => { throw err })

        await expect(wrapped(1, { x: 1 }, 11, {})).rejects.toThrow('lock timeout')
    })
})
