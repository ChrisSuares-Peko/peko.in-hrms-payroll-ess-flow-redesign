const { saveGstr1ToPortal, getGstr1PortalSummary, fileGstr1Return } = require('../controllers/corporate/taxAndMore')

jest.mock('../utils/cacheDataMethods', () => ({
    getValue: jest.fn(),
    setValue: jest.fn(),
}))

jest.mock('../services/sandboxApi', () => ({
    saveGstr1:           jest.fn(),
    getGstr1SummaryLong: jest.fn(),
    fileGstr1:           jest.fn(),
}))

const { getValue } = require('../utils/cacheDataMethods')
const sandboxApi   = require('../services/sandboxApi')
const TaxSalesInvoice   = require('../models/entities/taxSalesInvoice')
const TaxAmendment      = require('../models/entities/taxAmendment')
const TaxGstr1Document  = require('../models/entities/taxGstr1Document')
const TaxGstr1HsnManual = require('../models/entities/taxGstr1HsnManual')
const TaxGstr1Filing    = require('../models/entities/taxGstr1Filing')

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeReq = (overrides = {}) => ({
    user: { corporateId: 1 },
    body: {},
    query: {},
    LogTraceId: 'test-trace',
    ...overrides,
})

const makeRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json   = jest.fn().mockReturnValue(res)
    return res
}

// ─── saveGstr1ToPortal ────────────────────────────────────────────────────────

describe('saveGstr1ToPortal', () => {
    const baseBody = { gstin: '27AABCU9603R1ZX', financialYear: '2024-25', month: '11' }

    beforeEach(() => jest.clearAllMocks())

    it('returns 401 when portal session is missing', async () => {
        getValue.mockResolvedValue(null)
        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await saveGstr1ToPortal(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false }))
    })

    it('returns referenceId on success', async () => {
        getValue.mockResolvedValue('staging-dummy-token')
        TaxSalesInvoice.findAll.mockResolvedValue([])
        TaxAmendment.findAll.mockResolvedValue([])
        TaxGstr1Document.findAll.mockResolvedValue([])
        TaxGstr1HsnManual.findAll.mockResolvedValue([])
        sandboxApi.saveGstr1.mockResolvedValue({
            transaction_id: 'txn-123',
            code: 200,
            data: { data: { reference_id: 'ref-abc123' }, status_cd: '1' },
        })
        TaxGstr1Filing.upsert.mockResolvedValue([{}, true])

        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await saveGstr1ToPortal(req, res)

        expect(sandboxApi.saveGstr1).toHaveBeenCalledWith(
            '27AABCU9603R1ZX', 2024, 11, 'staging-dummy-token', expect.any(Object)
        )
        expect(TaxGstr1Filing.upsert).toHaveBeenCalledWith(expect.objectContaining({
            corporateUserId: 1,
            gstin: '27AABCU9603R1ZX',
            financialYear: '2024-25',
            month: 11,
            referenceId: 'ref-abc123',
            status: 'saved',
        }))
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            data: { referenceId: 'ref-abc123' },
        }))
    })

    it('returns status false when sandbox returns non-1 status_cd', async () => {
        getValue.mockResolvedValue('staging-dummy-token')
        TaxSalesInvoice.findAll.mockResolvedValue([])
        TaxAmendment.findAll.mockResolvedValue([])
        TaxGstr1Document.findAll.mockResolvedValue([])
        TaxGstr1HsnManual.findAll.mockResolvedValue([])
        sandboxApi.saveGstr1.mockResolvedValue({
            data: { status_cd: '0', message: 'Portal error' },
        })

        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await saveGstr1ToPortal(req, res)

        expect(TaxGstr1Filing.upsert).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false }))
    })
})

// ─── getGstr1PortalSummary ────────────────────────────────────────────────────

describe('getGstr1PortalSummary', () => {
    const baseQuery = { gstin: '27AABCU9603R1ZX', financialYear: '2024-25', month: '11' }

    beforeEach(() => jest.clearAllMocks())

    it('returns 401 when portal session is missing', async () => {
        getValue.mockResolvedValue(null)
        const req = makeReq({ query: baseQuery })
        const res = makeRes()

        await getGstr1PortalSummary(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false }))
    })

    it('stores chksum + secSum and returns them', async () => {
        const mockSecSum = [
            { sec_nm: 'B2B', txval: 100000, iamt: 0, camt: 9000, samt: 9000, csamt: 0 },
            { sec_nm: 'TTL_LIAB', txval: 100000, iamt: 0, camt: 9000, samt: 9000, csamt: 0 },
        ]
        getValue.mockResolvedValue('staging-dummy-token')
        sandboxApi.getGstr1SummaryLong.mockResolvedValue({
            code: 200,
            data: {
                data: {
                    ret_period: '112024',
                    gstin: '27AABCU9603R1ZX',
                    chksum: 'abc-chksum-xyz',
                    sec_sum: mockSecSum,
                    status_cd: '1',
                },
                status_cd: '1',
            },
        })
        TaxGstr1Filing.upsert.mockResolvedValue([{}, true])

        const req = makeReq({ query: baseQuery })
        const res = makeRes()

        await getGstr1PortalSummary(req, res)

        expect(sandboxApi.getGstr1SummaryLong).toHaveBeenCalledWith(
            '27AABCU9603R1ZX', 2024, 11, 'staging-dummy-token'
        )
        expect(TaxGstr1Filing.upsert).toHaveBeenCalledWith(expect.objectContaining({
            chksum: 'abc-chksum-xyz',
            secSum: mockSecSum,
            retPeriod: '112024',
        }))
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            data: { secSum: mockSecSum, chksum: 'abc-chksum-xyz', retPeriod: '112024' },
        }))
    })
})

// ─── fileGstr1Return ──────────────────────────────────────────────────────────

describe('fileGstr1Return', () => {
    const baseBody = { gstin: '27AABCU9603R1ZX', financialYear: '2024-25', month: '11', pan: 'ABCDE1234F', otp: '123456' }

    beforeEach(() => jest.clearAllMocks())

    it('returns 401 when portal session is missing', async () => {
        getValue.mockResolvedValue(null)
        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await fileGstr1Return(req, res)

        expect(res.status).toHaveBeenCalledWith(401)
    })

    it('returns 400 when no filing record with chksum exists', async () => {
        getValue.mockResolvedValue('staging-dummy-token')
        TaxGstr1Filing.findOne.mockResolvedValue(null)

        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await fileGstr1Return(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false }))
    })

    it('returns 400 when filing record exists but chksum is empty', async () => {
        getValue.mockResolvedValue('staging-dummy-token')
        TaxGstr1Filing.findOne.mockResolvedValue({ chksum: null, retPeriod: '112024', secSum: [] })

        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await fileGstr1Return(req, res)

        expect(res.status).toHaveBeenCalledWith(400)
        expect(sandboxApi.fileGstr1).not.toHaveBeenCalled()
    })

    it('returns ackNum and marks status filed on success', async () => {
        getValue.mockResolvedValue('staging-dummy-token')
        TaxGstr1Filing.findOne.mockResolvedValue({
            chksum: 'abc-chksum-xyz',
            retPeriod: '112024',
            secSum: [{ sec_nm: 'TTL_LIAB', txval: 100000, iamt: 0, camt: 9000, samt: 9000, csamt: 0 }],
        })
        sandboxApi.fileGstr1.mockResolvedValue({
            code: 200,
            data: { data: { ack_num: 'AA270924024267B' }, status_cd: 1 },
        })
        TaxGstr1Filing.update.mockResolvedValue([1])

        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await fileGstr1Return(req, res)

        expect(sandboxApi.fileGstr1).toHaveBeenCalledWith(
            '27AABCU9603R1ZX', 2024, 11, 'ABCDE1234F', '123456', 'staging-dummy-token',
            expect.objectContaining({ chksum: 'abc-chksum-xyz', ret_period: '112024' })
        )
        expect(TaxGstr1Filing.update).toHaveBeenCalledWith(
            expect.objectContaining({ ackNum: 'AA270924024267B', status: 'filed' }),
            expect.objectContaining({ where: { corporateUserId: 1, gstin: '27AABCU9603R1ZX', financialYear: '2024-25', month: 11 } })
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            status: true,
            data: expect.objectContaining({ ackNum: 'AA270924024267B' }),
        }))
    })

    it('returns status false when sandbox filing fails', async () => {
        getValue.mockResolvedValue('staging-dummy-token')
        TaxGstr1Filing.findOne.mockResolvedValue({
            chksum: 'abc-chksum-xyz',
            retPeriod: '112024',
            secSum: [],
        })
        sandboxApi.fileGstr1.mockResolvedValue({
            data: { data: {}, status_cd: 0, message: 'Filing failed' },
        })

        const req = makeReq({ body: baseBody })
        const res = makeRes()

        await fileGstr1Return(req, res)

        expect(TaxGstr1Filing.update).not.toHaveBeenCalled()
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: false }))
    })
})
