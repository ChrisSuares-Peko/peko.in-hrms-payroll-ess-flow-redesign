jest.mock('../../../models/use-cases/accountClosureRequest', () => ({
    findLatestByCorporate: jest.fn(),
    findOpenByCorporate: jest.fn(),
    createRequest: jest.fn(),
}))
jest.mock('../../../utils/cardHelpers', () => ({
    actorCredentialId: jest.fn(() => 7),
    adminActor: jest.fn(() => 'Aarav Sharma (Admin)'),
}))

const closureUC = require('../../../models/use-cases/accountClosureRequest')
const { getAccountClosureRequest, requestAccountClosure } = require('../accountClosure')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data
const req = (body = {}) => ({ user: { corporateId: 42 }, body })

const ROW = {
    id: 9,
    status: 'PENDING',
    reason: 'TOO_EXPENSIVE',
    details: 'Moving to an in-house card programme',
    requestedByName: 'Aarav Sharma (Admin)',
    createdAt: '2026-08-17T10:00:00.000Z',
}

beforeEach(() => {
    jest.clearAllMocks()
    closureUC.findLatestByCorporate.mockResolvedValue(null)
    closureUC.findOpenByCorporate.mockResolvedValue(null)
    closureUC.createRequest.mockImplementation(async (fields) => ({ id: 9, ...fields }))
})

describe('getAccountClosureRequest', () => {
    it('400s without a corporate context', async () => {
        const next = jest.fn()
        await getAccountClosureRequest({ user: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('returns no request plus the reason catalogue for a corporate that never asked', async () => {
        const res = buildRes()
        await getAccountClosureRequest(req(), res, jest.fn())

        expect(payload(res).request).toBeNull()
        expect(payload(res).reasons).toEqual(
            expect.arrayContaining([{ value: 'OTHERS', label: 'Others' }])
        )
        expect(payload(res).detailsMin).toBe(10)
        expect(payload(res).detailsMax).toBe(1000)
    })

    it('reports the latest request with a human-readable reason', async () => {
        closureUC.findLatestByCorporate.mockResolvedValue(ROW)
        const res = buildRes()

        await getAccountClosureRequest(req(), res, jest.fn())

        expect(payload(res).request).toMatchObject({
            id: '9',
            status: 'PENDING',
            reason: 'TOO_EXPENSIVE',
            reasonLabel: 'Too expensive for our needs',
            requestedByName: 'Aarav Sharma (Admin)',
        })
    })
})

describe('requestAccountClosure', () => {
    it('records a PENDING request attributed to the admin who asked', async () => {
        const res = buildRes()
        await requestAccountClosure(req({ reason: 'NOT_USING' }), res, jest.fn())

        expect(closureUC.createRequest).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            status: 'PENDING',
            reason: 'NOT_USING',
            details: null,
            requestedByCredentialId: 7,
            requestedByName: 'Aarav Sharma (Admin)',
        }))
        expect(payload(res).request.status).toBe('PENDING')
    })

    it('accepts a lowercase reason from the client', async () => {
        await requestAccountClosure(req({ reason: 'not_using' }), buildRes(), jest.fn())

        expect(closureUC.createRequest).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'NOT_USING' })
        )
    })

    it('stores trimmed details for Others', async () => {
        await requestAccountClosure(
            req({ reason: 'OTHERS', details: '  Acquired by another group  ' }),
            buildRes(),
            jest.fn()
        )

        expect(closureUC.createRequest).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'OTHERS', details: 'Acquired by another group' })
        )
    })

    it('accepts details exactly at the minimum', async () => {
        await requestAccountClosure(
            req({ reason: 'OTHERS', details: 'a'.repeat(10) }),
            buildRes(),
            jest.fn()
        )

        expect(closureUC.createRequest).toHaveBeenCalledWith(
            expect.objectContaining({ details: 'a'.repeat(10) })
        )
    })

    it('still accepts an omitted explanation for a non-Others reason', async () => {
        await requestAccountClosure(req({ reason: 'NOT_USING' }), buildRes(), jest.fn())

        expect(closureUC.createRequest).toHaveBeenCalledWith(
            expect.objectContaining({ reason: 'NOT_USING', details: null })
        )
    })

    // Two clicks must not queue two closures for the same corporate.
    it('refuses a second request while one is already awaiting review', async () => {
        closureUC.findOpenByCorporate.mockResolvedValue(ROW)
        const next = jest.fn()

        await requestAccountClosure(req({ reason: 'NOT_USING' }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
        expect(closureUC.createRequest).not.toHaveBeenCalled()
    })
})
