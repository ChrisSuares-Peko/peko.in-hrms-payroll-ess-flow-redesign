const errorHandler = require('../error')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const run = (err) => {
    const res = buildRes()
    errorHandler(err, { LogTraceId: 't' }, res, jest.fn())
    return res
}

describe('errorHandler', () => {
    beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}))
    afterAll(() => console.log.mockRestore())

    it('returns a generic 500 with responseCode 001 for an unclassified error', () => {
        const res = run({ message: 'boom' })

        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({ status: false, message: 'boom', data: {}, responseCode: '001' })
    })

    it('honours an explicit status_code on the error', () => {
        const res = run({ message: 'nope', status_code: 400 })

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'nope', responseCode: '001' }))
    })

    it('tags a 403 with responseCode 007 and keeps the reason', () => {
        const res = run({ message: 'Your own requests are decided by your corporate admin.', status_code: 403 })

        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Your own requests are decided by your corporate admin.',
            responseCode: '007',
        }))
    })

    it('does not use 007 for any other status', () => {
        [400, 404, 409, 500].forEach((status) => {
            const res = run({ message: 'x', status_code: status })

            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ responseCode: '001' }))
        })
    })

    it('maps a CastError to a "Resource not found." message', () => {
        const res = run({ name: 'CastError', message: 'bad id' })

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Resource not found.' }))
    })

    it('maps a duplicate-key (11000) error to a friendly message', () => {
        const res = run({ code: 11000, message: 'dup' })

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Duplicate field value entered' }))
    })

    it('maps any Sequelize* error to the temporary-issue message', () => {
        const res = run({ name: 'SequelizeConnectionError', message: 'db' })

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: expect.stringContaining('temporary issue'),
        }))
    })

    it('maps INVALID AUTHORIZATION to a generic retry message', () => {
        const res = run({ message: 'INVALID AUTHORIZATION' })

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            message: 'Something went wrong. Please try again after sometime.',
        }))
    })
})
