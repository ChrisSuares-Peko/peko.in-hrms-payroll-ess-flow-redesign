const { addComment, listComments } = require('../cardComments')
const { loadOwnedTransaction } = require('../cardTransactions')
const { appendComment, listComments: listCommentsUseCase } = require('../../../models/use-cases/cardComment')

jest.mock('../cardTransactions', () => ({ loadOwnedTransaction: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => ({ resolveActingIdentity: jest.fn() }))
jest.mock('../../../models/use-cases/cardComment', () => ({
    appendComment: jest.fn(),
    listComments: jest.fn(),
}))

const { resolveActingIdentity } = require('../../../utils/cardHelpers')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const cardholderReq = (overrides = {}) => ({
    user: {
        role: 'USER',
        corporateId: 42,
        employeeProfileId: '99',
        serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }],
        employeeName: 'Jane Cardholder',
        employeeEmail: 'jane@example.com',
    },
    body: {},
    query: {},
    params: { id: '1' },
    ...overrides,
})

const adminReq = (overrides = {}) => ({
    user: {
        role: 'CORPORATE',
        corporateId: 42,
        contactPersonName: 'Shyam Admin',
        email: 'shyam@example.com',
    },
    body: {},
    query: {},
    params: { id: '1' },
    ...overrides,
})

const transaction = { id: 1, corporateId: 42, userId: '99' }
const cardholderIdentity = { role: 'CARDHOLDER', userId: '99', name: 'Jane Cardholder', email: 'jane@example.com' }

describe('exports.addComment', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        resolveActingIdentity.mockResolvedValue(cardholderIdentity)
    })

    it('rejects with 403 when the transaction is not owned', async () => {
        loadOwnedTransaction.mockResolvedValue({ error: 'Forbidden', statusCode: 403 })
        const next = jest.fn()

        await addComment(cardholderReq({ body: { message: 'hi' } }), buildRes(), next)

        expect(appendComment).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('rejects an empty (or whitespace-only) message with 400', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        const next = jest.fn()

        await addComment(cardholderReq({ body: { message: '   ' } }), buildRes(), next)

        expect(appendComment).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('rejects a message over the 2000-character cap with 400', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        const next = jest.fn()

        await addComment(cardholderReq({ body: { message: 'x'.repeat(2001) } }), buildRes(), next)

        expect(appendComment).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('passes the transaction and body.role through to resolveActingIdentity', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        appendComment.mockResolvedValue([{}])
        const req = cardholderReq({ body: { message: 'Hello', role: 'CARDHOLDER' } })

        await addComment(req, buildRes(), jest.fn())

        expect(resolveActingIdentity).toHaveBeenCalledWith(req, transaction, 'CARDHOLDER')
    })

    it('maps the resolved identity onto the comment entry — admin acting as the cardholder', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        resolveActingIdentity.mockResolvedValue({ role: 'CARDHOLDER', userId: '99', name: 'Aarav Sharma', email: 'aarav@peko.in' })
        appendComment.mockResolvedValue([{}])
        const req = adminReq({ body: { message: 'Understood.', role: 'CARDHOLDER' } })

        await addComment(req, buildRes(), jest.fn())

        expect(appendComment).toHaveBeenCalledWith(1, expect.objectContaining({
            authorRole: 'CARDHOLDER',
            authorUserId: '99',
            authorName: 'Aarav Sharma',
            authorEmail: 'aarav@peko.in',
            message: 'Understood.',
        }), expect.objectContaining({ maxComments: 200 }))
    })

    it('rejects with resolveActingIdentity\'s own error/statusCode — e.g. a cardholder claiming role=ADMIN — without ever calling appendComment', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        resolveActingIdentity.mockResolvedValue({ error: 'A cardholder can only act as CARDHOLDER.', statusCode: 403 })
        const next = jest.fn()

        await addComment(cardholderReq({ body: { message: 'hi', role: 'ADMIN' } }), buildRes(), next)

        expect(appendComment).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('gives every comment a stable, server-generated id and createdAt timestamp', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        appendComment.mockResolvedValue([{}])

        await addComment(cardholderReq({ body: { message: 'hi' } }), buildRes(), jest.fn())

        const [, entry] = appendComment.mock.calls[0]
        expect(entry.id).toMatch(/^c_\d+_[0-9a-f]{6}$/)
        expect(new Date(entry.createdAt).toString()).not.toBe('Invalid Date')
    })

    it('returns 400 without a next-error-name leak when the comment cap has been reached', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        appendComment.mockResolvedValue(null)
        const next = jest.fn()

        await addComment(cardholderReq({ body: { message: 'hi' } }), buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('returns 200 with the new comment on success', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        appendComment.mockResolvedValue([{ id: 'c_1' }])
        const res = buildRes()

        await addComment(cardholderReq({ body: { message: 'hi' } }), res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            data: expect.objectContaining({ comment: expect.objectContaining({ message: 'hi' }) }),
            responseCode: '000',
        }))
    })
})

describe('exports.listComments', () => {
    beforeEach(() => jest.clearAllMocks())

    it('403s when the transaction is not owned', async () => {
        loadOwnedTransaction.mockResolvedValue({ error: 'Forbidden', statusCode: 403 })
        const next = jest.fn()

        await listComments(cardholderReq(), buildRes(), next)

        expect(listCommentsUseCase).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('returns the transaction\'s comments', async () => {
        loadOwnedTransaction.mockResolvedValue({ transaction })
        listCommentsUseCase.mockResolvedValue([{ id: 'c_1' }])
        const res = buildRes()

        await listComments(cardholderReq(), res, jest.fn())

        expect(listCommentsUseCase).toHaveBeenCalledWith(1)
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { comments: [{ id: 'c_1' }] } }))
    })
})
