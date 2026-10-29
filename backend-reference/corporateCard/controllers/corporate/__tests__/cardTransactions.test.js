const { listTransactions, getTransactionsSummary, getTransaction, exportTransactions, decideTransactionApproval } = require('../cardTransactions')
const cardTransactionUseCase = require('../../../models/use-cases/cardTransaction')
const { getCardholdersByIdentities, searchSubCorporateIds } = require('../../../utils/sharedDirectory')

jest.mock('../../../models/use-cases/cardTransaction', () => ({
    findById: jest.fn(),
    setAdminApproval: jest.fn(),
    listTransactions: jest.fn(),
    getMonthlySummary: jest.fn(),
}))

jest.mock('../../../utils/sharedDirectory', () => ({ getCardholdersByIdentities: jest.fn() }))
beforeEach(() => { getCardholdersByIdentities.mockResolvedValue(new Map()) })

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.setHeader = jest.fn().mockReturnValue(res)
    res.send = jest.fn().mockReturnValue(res)
    return res
}

const cardholderReq = (overrides = {}) => ({
    user: { role: 'USER', corporateId: 42, employeeProfileId: '99' , serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] },
    query: {},
    params: {},
    ...overrides,
})

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42 },
    query: {},
    params: {},
    ...overrides,
})

describe('exports.listTransactions', () => {
    beforeEach(() => jest.clearAllMocks())

    it('forces a cardholder to their own userId, ignoring any query override', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const req = cardholderReq({ query: { userId: 'someone-elses-id' } })
        const res = buildRes()
        const next = jest.fn()

        await listTransactions(req, res, next)

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            cardholder: { userId: '99' },
        }))
        expect(next).not.toHaveBeenCalled()
    })

    it('lets an admin optionally narrow to one cardholder via ?userId', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const req = adminReq({ query: { userId: '123' } })
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            cardholder: { userId: '123' },
        }))
    })

    it('lets an admin omit userId to see the whole corporate', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const req = adminReq()
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            cardholder: undefined,
        }))
    })

    it('translates a recognized ?status filter into decision/internalStatus', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const req = cardholderReq({ query: { status: 'Declined' } })
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            decision: 'DECLINED',
            internalStatus: 'AUTH_RECEIVED',
        }))
    })

    it('translates a ?status=Reversed filter into decision/internalStatus, distinct from Declined', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const req = cardholderReq({ query: { status: 'Reversed' } })
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            decision: 'DECLINED',
            internalStatus: 'REVERSED',
        }))
    })

    it('rejects an unrecognized ?status filter with 400', async () => {
        const req = cardholderReq({ query: { status: 'NotARealStatus' } })
        const res = buildRes()
        const next = jest.fn()

        await listTransactions(req, res, next)

        expect(cardTransactionUseCase.listTransactions).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('serializes rows with the FE-facing status word, not the internal vocabulary', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 1,
            rows: [{ id: 1, displayId: 'CC000001', decision: 'AUTHORIZED', status: 'NOTIFIED' }],
        })
        const req = cardholderReq()
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { count: 1, rows: [expect.objectContaining({ status: 'Completed', transactionId: 'CC000001' })] },
        }))
    })

    it('surfaces declineReason on the list row for a declined transaction, null when authorized', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 2,
            rows: [
                { id: 1, decision: 'DECLINED', status: 'AUTH_RECEIVED', declineReason: 'Exceeds per-transaction limit' },
                { id: 2, decision: 'AUTHORIZED', status: 'NOTIFIED', declineReason: null },
            ],
        })
        const res = buildRes()

        await listTransactions(cardholderReq(), res, jest.fn())

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { count: 2, rows: [
                expect.objectContaining({ declineReason: 'Exceeds per-transaction limit' }),
                expect.objectContaining({ declineReason: null }),
            ] },
        }))
    })

    it('passes searchText/member/cardLast4 from the query through to the use-case', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        searchSubCorporateIds.mockResolvedValue({ ids: ['11'], capped: false })
        const req = cardholderReq({ query: { searchText: 'Stark', member: 'Aarav Sharma', cardLast4: '7890' } })
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(searchSubCorporateIds).toHaveBeenCalledWith({ searchText: 'Aarav Sharma', fields: ['name'], req })
        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            searchText: 'Stark',
            cardLast4: '7890',
            memberMatchIds: ['11'],
        }))
        expect(cardTransactionUseCase.listTransactions.mock.calls[0][0].member).toBeUndefined()
    })

    it('trims leading/trailing whitespace from searchText before querying', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const req = cardholderReq({ query: { searchText: '  CC000028  ' } })
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            searchText: 'CC000028',
        }))
    })

    it('treats an all-whitespace searchText as no filter at all', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const req = cardholderReq({ query: { searchText: '   ' } })
        const res = buildRes()

        await listTransactions(req, res, jest.fn())

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            searchText: undefined,
        }))
    })

    it('surfaces member/cardLast4 from the joined row, and defaults when unresolved', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 2,
            rows: [
                { id: 1, decision: 'AUTHORIZED', status: 'NOTIFIED', userId: '11', cardIssuance: { maskedCardNumber: '1234 56** **** 7890' } },
                { id: 2, decision: 'DECLINED', status: 'AUTH_RECEIVED' },
            ],
        })
        getCardholdersByIdentities.mockResolvedValue(new Map([['11', { id: '11', name: 'Aarav Sharma' }]]))
        const res = buildRes()

        await listTransactions(cardholderReq(), res, jest.fn())

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { count: 2, rows: [
                expect.objectContaining({ member: 'Aarav Sharma', cardLast4: '7890' }),
                expect.objectContaining({ member: '', cardLast4: null }),
            ] },
        }))
    })
})

describe('exports.getTransactionsSummary', () => {
    beforeEach(() => jest.clearAllMocks())

    it('rejects a malformed month', async () => {
        const req = cardholderReq({ query: { month: 'not-a-month' } })
        const res = buildRes()
        const next = jest.fn()

        await getTransactionsSummary(req, res, next)

        expect(cardTransactionUseCase.getMonthlySummary).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('computes the IST-anchored month window and scopes to the caller', async () => {
        cardTransactionUseCase.getMonthlySummary.mockResolvedValue({ amountSpent: 4599, transactionCount: 1 })
        const req = cardholderReq({ query: { month: '2026-07' } })
        const res = buildRes()

        await getTransactionsSummary(req, res, jest.fn())

        expect(cardTransactionUseCase.getMonthlySummary).toHaveBeenCalledWith({
            corporateId: 42,
            cardholder: { userId: '99' },
            monthStart: new Date('2026-06-30T18:30:00.000Z'),
            monthEnd: new Date('2026-07-31T18:30:00.000Z'),
        })
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { amountSpent: 4599, transactionCount: 1 } }))
    })
})

describe('exports.getTransaction', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns 404 when the transaction does not exist', async () => {
        cardTransactionUseCase.findById.mockResolvedValue(null)
        const req = cardholderReq({ params: { id: '1' } })
        const res = buildRes()
        const next = jest.fn()

        await getTransaction(req, res, next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it('returns 403 (not 404) when the transaction belongs to a different corporate', async () => {
        cardTransactionUseCase.findById.mockResolvedValue({ id: 1, corporateId: 999, userId: '99' })
        const req = cardholderReq({ params: { id: '1' } })
        const res = buildRes()
        const next = jest.fn()

        await getTransaction(req, res, next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('returns 403 when a cardholder requests another cardholder\'s transaction under the same corporate', async () => {
        cardTransactionUseCase.findById.mockResolvedValue({ id: 1, corporateId: 42, userId: 'someone-else' })
        const req = cardholderReq({ params: { id: '1' } })
        const res = buildRes()
        const next = jest.fn()

        await getTransaction(req, res, next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('lets an admin view any transaction under their corporate regardless of userId', async () => {
        cardTransactionUseCase.findById.mockResolvedValue({ id: 1, corporateId: 42, userId: 'anyone', decision: 'AUTHORIZED', status: 'NOTIFIED' })
        getCardholdersByIdentities.mockResolvedValue(new Map([['anyone', { id: 'anyone', name: 'Aarav Sharma', email: 'aarav@peko.in', role: 'User' }]]))
        const req = adminReq({ params: { id: '1' } })
        const res = buildRes()
        const next = jest.fn()

        await getTransaction(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('enriches the response with cardholder Name/Email/Role, hydrated by userId (Team stays null — no such column exists)', async () => {
        cardTransactionUseCase.findById.mockResolvedValue({ id: 1, corporateId: 42, userId: '99', decision: 'AUTHORIZED', status: 'NOTIFIED' })
        getCardholdersByIdentities.mockResolvedValue(new Map([['99', { id: '99', name: 'Aarav Sharma', email: 'aarav@peko.in', role: 'User' }]]))
        const req = cardholderReq({ params: { id: '1' } })
        const res = buildRes()

        await getTransaction(req, res, jest.fn())

        expect(getCardholdersByIdentities).toHaveBeenCalledWith([{ userId: '99' }], expect.objectContaining({ params: { id: '1' } }))
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { transaction: expect.objectContaining({
                cardholder: { name: 'Aarav Sharma', email: 'aarav@peko.in', team: null, role: 'User' },
            }) },
        }))
    })

    it('returns cardholder: null when the cardholder lookup finds nothing (e.g. deleted user)', async () => {
        cardTransactionUseCase.findById.mockResolvedValue({ id: 1, corporateId: 42, userId: '99', decision: 'AUTHORIZED', status: 'NOTIFIED' })
        getCardholdersByIdentities.mockResolvedValue(new Map())
        const req = cardholderReq({ params: { id: '1' } })
        const res = buildRes()

        await getTransaction(req, res, jest.fn())

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { transaction: expect.objectContaining({ cardholder: null }) },
        }))
    })

    it('degrades cardholder to null instead of failing the detail when the directory is unreachable', async () => {
        cardTransactionUseCase.findById.mockResolvedValue({ id: 1, corporateId: 42, userId: '99', decision: 'AUTHORIZED', status: 'NOTIFIED' })
        getCardholdersByIdentities.mockRejectedValue(new Error('others unreachable'))
        const req = cardholderReq({ params: { id: '1' } })
        const res = buildRes()
        const next = jest.fn()

        await getTransaction(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { transaction: expect.objectContaining({ cardholder: null }) },
        }))
    })
})

describe('exports.exportTransactions', () => {
    beforeEach(() => jest.clearAllMocks())

    it('rejects an unrecognized ?status filter with 400, never querying', async () => {
        const req = cardholderReq({ query: { status: 'NotARealStatus' } })
        const next = jest.fn()

        await exportTransactions(req, buildRes(), next)

        expect(cardTransactionUseCase.listTransactions).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('scopes a cardholder to their own userId and caps at EXPORT_MAX_ROWS', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 1, rows: [{ id: 1, decision: 'AUTHORIZED', status: 'NOTIFIED', displayId: 'CC000001', createdAt: '2026-07-07T10:00:00.000Z' }] })
        const req = cardholderReq()

        await exportTransactions(req, buildRes(), jest.fn())

        expect(cardTransactionUseCase.listTransactions).toHaveBeenCalledWith(expect.objectContaining({
            corporateId: 42,
            cardholder: { userId: '99' },
            limit: 10000,
            offset: 0,
        }))
    })

    it('returns a header-only CSV (200), not an error, when there are no rows', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({ count: 0, rows: [] })
        const next = jest.fn()
        const res = buildRes()

        await exportTransactions(cardholderReq(), res, next)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
        const csv = res.send.mock.calls[0][0]
        expect(csv).toBe(`${String.fromCharCode(0xfeff)}Card,Date,Transaction ID,Merchant,Category,Status,Amount`)
    })

    it('sends a BOM-prefixed, cardholder-shaped CSV (no Member/Approval/Fee) with an attachment filename', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, decision: 'AUTHORIZED', status: 'NOTIFIED', displayId: 'CC000001',
                createdAt: '2026-07-07T10:00:00.000Z', merchantName: 'Stark Industries', category: 'Travel',
                transactionAmount: '500.00', userId: '11', cardIssuance: { maskedCardNumber: '1234 56** **** 7890' },
            }],
        })
        getCardholdersByIdentities.mockResolvedValue(new Map([['11', { id: '11', name: 'Aarav Sharma' }]]))
        const res = buildRes()

        await exportTransactions(cardholderReq(), res, jest.fn())

        expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8')
        expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="transactions-all.csv"')
        expect(res.status).toHaveBeenCalledWith(200)
        const csv = res.send.mock.calls[0][0]
        expect(csv.charCodeAt(0)).toBe(0xfeff)
        expect(csv.slice(1).split('\r\n')[0]).toBe('Card,Date,Transaction ID,Merchant,Category,Status,Amount')
        expect(csv).toContain('Stark Industries')
        expect(csv).toContain('Travel')
        expect(csv).toContain('CC000001')
        expect(csv).toContain('7890')
        expect(csv).not.toContain('Aarav Sharma')
    })

    it('sends an admin-shaped CSV (Member/Approval/Fee, no Category/Transaction ID)', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, decision: 'AUTHORIZED', status: 'NOTIFIED', displayId: 'CC000001',
                createdAt: '2026-07-07T10:00:00.000Z', merchantName: 'Stark Industries', category: 'Travel',
                transactionAmount: '500.00', userId: '11', cardIssuance: { maskedCardNumber: '1234 56** **** 7890' },
            }],
        })
        getCardholdersByIdentities.mockResolvedValue(new Map([['11', { id: '11', name: 'Aarav Sharma' }]]))
        const res = buildRes()

        await exportTransactions(adminReq(), res, jest.fn())

        const csv = res.send.mock.calls[0][0]
        expect(csv.slice(1).split('\r\n')[0]).toBe('Card,Date,Merchant,Member,Status,Approval,Fee,Amount')
        expect(csv).toContain('Stark Industries')
        expect(csv).toContain('Aarav Sharma')
        expect(csv).not.toContain('Travel')
        expect(csv).not.toContain('CC000001')
    })

    it('honors an explicit ?variant=user override for an admin-role caller (their own My transactions tab)', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, decision: 'AUTHORIZED', status: 'NOTIFIED', displayId: 'CC000001',
                createdAt: '2026-07-07T10:00:00.000Z', merchantName: 'Stark Industries', category: 'Travel',
                transactionAmount: '500.00', userId: '11', cardIssuance: { maskedCardNumber: '1234 56** **** 7890' },
            }],
        })
        const res = buildRes()

        await exportTransactions(adminReq({ query: { variant: 'user' } }), res, jest.fn())

        const csv = res.send.mock.calls[0][0]
        expect(csv.slice(1).split('\r\n')[0]).toBe('Card,Date,Transaction ID,Merchant,Category,Status,Amount')
        expect(csv).toContain('Travel')
        expect(csv).toContain('CC000001')
    })

    it('honors an explicit ?variant=admin override for a cardholder caller', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 1,
            rows: [{
                id: 1, decision: 'AUTHORIZED', status: 'NOTIFIED', displayId: 'CC000001',
                createdAt: '2026-07-07T10:00:00.000Z', merchantName: 'Stark Industries', category: 'Travel',
                transactionAmount: '500.00', userId: '99', cardIssuance: { maskedCardNumber: '1234 56** **** 7890' },
            }],
        })
        getCardholdersByIdentities.mockResolvedValue(new Map([['99', { id: '99', name: 'Aarav Sharma' }]]))
        const res = buildRes()

        await exportTransactions(cardholderReq({ query: { variant: 'admin' } }), res, jest.fn())

        const csv = res.send.mock.calls[0][0]
        expect(csv.slice(1).split('\r\n')[0]).toBe('Card,Date,Merchant,Member,Status,Approval,Fee,Amount')
        expect(csv).toContain('Aarav Sharma')
        expect(csv).not.toContain('Travel')
    })

    it('names the file after the status filter when one is applied', async () => {
        cardTransactionUseCase.listTransactions.mockResolvedValue({
            count: 1,
            rows: [{ id: 1, decision: 'DECLINED', status: 'AUTH_RECEIVED', displayId: 'CC000002', createdAt: '2026-07-07T10:00:00.000Z' }],
        })
        const res = buildRes()

        await exportTransactions(cardholderReq({ query: { status: 'Declined' } }), res, jest.fn())

        expect(res.setHeader).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="transactions-declined.csv"')
    })
})

describe('exports.decideTransactionApproval', () => {
    beforeEach(() => jest.clearAllMocks())

    const pendingTxn = (overrides = {}) => ({ id: 1, corporateId: 42, userId: '99', cardIssuanceId: 7, adminApproval: 'PENDING', ...overrides })

    it('rejects a missing/invalid decision with 400, without updating', async () => {
        cardTransactionUseCase.findById.mockResolvedValue(pendingTxn())
        const req = adminReq({ params: { id: '1' }, body: { decision: 'MAYBE' }, user: { role: 'CORPORATE', corporateId: 42, id: 5 } })
        const next = jest.fn()

        await decideTransactionApproval(req, buildRes(), next)

        expect(cardTransactionUseCase.setAdminApproval).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('allows rejecting without a reason (reason is optional)', async () => {
        cardTransactionUseCase.findById.mockResolvedValue(pendingTxn())
        cardTransactionUseCase.setAdminApproval.mockResolvedValue({ adminApproval: 'REJECTED', adminApprovalReason: null })
        const req = adminReq({ params: { id: '1' }, body: { decision: 'REJECTED', reason: '   ' }, user: { role: 'CORPORATE', corporateId: 42, id: 5 } })
        const res = buildRes()
        const next = jest.fn()

        await decideTransactionApproval(req, res, next)

        expect(next).not.toHaveBeenCalled()
        expect(cardTransactionUseCase.setAdminApproval).toHaveBeenCalledWith(1, {
            adminApproval: 'REJECTED',
            adminApprovalReason: null,
            adminApprovalBy: 5,
        })
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { approval: 'Rejected', approvalReason: null },
        }))
    })

    it('409s when the transaction has already been reviewed', async () => {
        cardTransactionUseCase.findById.mockResolvedValue(pendingTxn({ adminApproval: 'APPROVED' }))
        const req = adminReq({ params: { id: '1' }, body: { decision: 'REJECTED', reason: 'Personal' }, user: { role: 'CORPORATE', corporateId: 42, id: 5 } })
        const next = jest.fn()

        await decideTransactionApproval(req, buildRes(), next)

        expect(cardTransactionUseCase.setAdminApproval).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 409 }))
    })

    it('403s when the transaction belongs to a different corporate', async () => {
        cardTransactionUseCase.findById.mockResolvedValue(pendingTxn({ corporateId: 999 }))
        const req = adminReq({ params: { id: '1' }, body: { decision: 'APPROVED' }, user: { role: 'CORPORATE', corporateId: 42, id: 5 } })
        const next = jest.fn()

        await decideTransactionApproval(req, buildRes(), next)

        expect(cardTransactionUseCase.setAdminApproval).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('approves a pending transaction and returns the FE approval word', async () => {
        cardTransactionUseCase.findById.mockResolvedValue(pendingTxn())
        cardTransactionUseCase.setAdminApproval.mockResolvedValue({ adminApproval: 'APPROVED', adminApprovalReason: null })
        const req = adminReq({ params: { id: '1' }, body: { decision: 'approved' }, user: { role: 'CORPORATE', corporateId: 42, id: 5 } })
        const res = buildRes()
        const next = jest.fn()

        await decideTransactionApproval(req, res, next)

        expect(cardTransactionUseCase.setAdminApproval).toHaveBeenCalledWith(1, {
            adminApproval: 'APPROVED',
            adminApprovalReason: null,
            adminApprovalBy: 5,
        })
        expect(next).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { approval: 'Approved', approvalReason: null },
        }))
    })

    it('rejects a pending transaction with a reason', async () => {
        cardTransactionUseCase.findById.mockResolvedValue(pendingTxn())
        cardTransactionUseCase.setAdminApproval.mockResolvedValue({ adminApproval: 'REJECTED', adminApprovalReason: 'Not company related' })
        const req = adminReq({ params: { id: '1' }, body: { decision: 'REJECTED', reason: 'Not company related' }, user: { role: 'CORPORATE', corporateId: 42, id: 5 } })
        const res = buildRes()

        await decideTransactionApproval(req, res, jest.fn())

        expect(cardTransactionUseCase.setAdminApproval).toHaveBeenCalledWith(1, {
            adminApproval: 'REJECTED',
            adminApprovalReason: 'Not company related',
            adminApprovalBy: 5,
        })
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            data: { approval: 'Rejected', approvalReason: 'Not company related' },
        }))
    })
})
