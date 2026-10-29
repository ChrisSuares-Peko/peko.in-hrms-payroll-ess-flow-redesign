const { uploadReceipt, listReceipts, deleteReceipt } = require('../cardReceipts')
const { uploadFile } = require('../../../utils/firebase')
const { findById } = require('../../../models/use-cases/cardTransaction')
const { resolveActingIdentity } = require('../../../utils/cardHelpers')
const {
    createReceipt,
    listActiveReceiptsByTransaction,
    findActiveReceiptById,
    softDeleteReceipt,
} = require('../../../models/use-cases/cardReceipt')

jest.mock('../../../utils/firebase', () => ({ uploadFile: jest.fn() }))
jest.mock('../../../models/use-cases/cardTransaction', () => ({ findById: jest.fn() }))
jest.mock('../../../utils/cardHelpers', () => ({
    isAdmin: (req) => req.user?.role === 'CORPORATE',
    resolveActingIdentity: jest.fn(),
    cardholderColumnsOf: (row) => ({ userId: row?.userId ?? null }),
    cardholderProfile: (req) => ({
        id: req.user?.employeeProfileId ?? null,
        name: req.user?.employeeName ?? null,
        email: req.user?.employeeEmail ?? null,
        mobileNo: req.user?.employeeMobile ?? null,
    }),
    resolveScope: (req) => {
        const corporateId = req.user?.corporateId
        if (!corporateId) return { error: 'Corporate context is missing.' }
        if (req.user?.role === 'CORPORATE') {
            const passed = typeof req.query?.userId === 'string' ? req.query.userId : undefined
            return { corporateId, cardholder: passed ? { userId: passed } : undefined }
        }
        const userId = req.user?.employeeProfileId
        if (!userId) return { error: 'Cardholder context is missing.' }
        return { corporateId, cardholder: { userId } }
    },
    rowBelongsToCardholder: (row, identity) => {
        if (!identity?.userId) return false
        return String(row?.userId ?? '') === String(identity.userId)
    },
}))
jest.mock('../../../models/use-cases/cardReceipt', () => ({
    createReceipt: jest.fn(),
    listActiveReceiptsByTransaction: jest.fn(),
    findActiveReceiptById: jest.fn(),
    softDeleteReceipt: jest.fn(),
}))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const cardholderReq = (overrides = {}) => ({
    user: { role: 'USER', corporateId: 42, employeeProfileId: '99' },
    body: {},
    query: {},
    params: { id: '1' },
    ...overrides,
})

const essCardholderReq = (overrides = {}) => ({
    user: { role: 'USER', corporateId: 42, employeeProfileId: '7', serviceMemberships: [{ label: 'Corporate Cards', hasAccess: true, role: 'Employee', status: 'ACTIVE' }] },
    body: {},
    query: {},
    params: { id: '1' },
    ...overrides,
})

const adminReq = (overrides = {}) => ({
    user: { role: 'CORPORATE', corporateId: 42 },
    body: {},
    query: {},
    params: { id: '1' },
    ...overrides,
})

const transaction = { id: 1, corporateId: 42, userId: '99' }
const essTransaction = { id: 1, corporateId: 42, userId: '7' }
const cardholderIdentity = { role: 'CARDHOLDER', userId: '99', name: null, email: null }

describe('exports.uploadReceipt', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        resolveActingIdentity.mockResolvedValue(cardholderIdentity)
    })

    it('rejects with 403 when the transaction belongs to another cardholder', async () => {
        findById.mockResolvedValue({ id: 1, corporateId: 42, userId: 'someone-else' })
        const req = cardholderReq({ body: { base64: 'YQ==', mimeType: 'image/png' } })
        const next = jest.fn()

        await uploadReceipt(req, buildRes(), next)

        expect(createReceipt).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('rejects a missing base64 payload with 400', async () => {
        findById.mockResolvedValue(transaction)
        const req = cardholderReq({ body: { mimeType: 'image/png' } })
        const next = jest.fn()

        await uploadReceipt(req, buildRes(), next)

        expect(uploadFile).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('rejects an unsupported mimeType with 400', async () => {
        findById.mockResolvedValue(transaction)
        const req = cardholderReq({ body: { base64: 'YQ==', mimeType: 'application/zip' } })
        const next = jest.fn()

        await uploadReceipt(req, buildRes(), next)

        expect(uploadFile).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 400 }))
    })

    it('passes the transaction and body.role through to resolveActingIdentity', async () => {
        findById.mockResolvedValue(transaction)
        uploadFile.mockResolvedValue('https://cdn.example.com/receipt.png')
        createReceipt.mockResolvedValue({ id: 5 })
        const req = cardholderReq({ body: { base64: 'YQ==', mimeType: 'image/png', role: 'CARDHOLDER' } })

        await uploadReceipt(req, buildRes(), jest.fn())

        expect(resolveActingIdentity).toHaveBeenCalledWith(req, transaction, 'CARDHOLDER')
    })

    it('stamps uploadedByRole/uploadedByUserId from the resolved identity, not the raw body', async () => {
        findById.mockResolvedValue(transaction)
        uploadFile.mockResolvedValue('https://cdn.example.com/receipt.png')
        createReceipt.mockResolvedValue({ id: 5, fileUrl: 'https://cdn.example.com/receipt.png', uploadedByRole: 'CARDHOLDER' })
        const req = cardholderReq({
            body: { base64: 'YQ==', mimeType: 'image/png', uploadedByRole: 'ADMIN' },
        })

        await uploadReceipt(req, buildRes(), jest.fn())

        expect(createReceipt).toHaveBeenCalledWith(expect.objectContaining({
            uploadedByRole: 'CARDHOLDER',
            uploadedByUserId: '99',
            cardTransactionId: 1,
        }))
    })

    it('lets an admin attribute the upload to the transaction\'s own cardholder (role=CARDHOLDER)', async () => {
        findById.mockResolvedValue(transaction)
        resolveActingIdentity.mockResolvedValue({ role: 'CARDHOLDER', userId: '99', name: 'Aarav Sharma', email: 'aarav@peko.in' })
        uploadFile.mockResolvedValue('https://cdn.example.com/receipt.png')
        createReceipt.mockResolvedValue({ id: 5, uploadedByRole: 'CARDHOLDER' })
        const req = adminReq({ body: { base64: 'YQ==', mimeType: 'image/png', role: 'CARDHOLDER' } })

        await uploadReceipt(req, buildRes(), jest.fn())

        expect(createReceipt).toHaveBeenCalledWith(expect.objectContaining({ uploadedByRole: 'CARDHOLDER', uploadedByUserId: '99' }))
    })

    it('rejects with resolveActingIdentity\'s own error/statusCode without ever calling uploadFile/createReceipt', async () => {
        findById.mockResolvedValue(transaction)
        resolveActingIdentity.mockResolvedValue({ error: 'A cardholder can only act as CARDHOLDER.', statusCode: 403 })
        const next = jest.fn()
        const req = cardholderReq({ body: { base64: 'YQ==', mimeType: 'image/png', role: 'ADMIN' } })

        await uploadReceipt(req, buildRes(), next)

        expect(uploadFile).not.toHaveBeenCalled()
        expect(createReceipt).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('stamps uploadedByRole ADMIN for an admin uploading as themselves', async () => {
        findById.mockResolvedValue(transaction)
        resolveActingIdentity.mockResolvedValue({ role: 'ADMIN', userId: 42, name: 'Shyam Admin', email: 'shyam@example.com' })
        uploadFile.mockResolvedValue('https://cdn.example.com/receipt.png')
        createReceipt.mockResolvedValue({ id: 5, uploadedByRole: 'ADMIN' })
        const req = adminReq({ body: { base64: 'YQ==', mimeType: 'image/png' } })

        await uploadReceipt(req, buildRes(), jest.fn())

        expect(createReceipt).toHaveBeenCalledWith(expect.objectContaining({ uploadedByRole: 'ADMIN', uploadedByUserId: 42 }))
    })
})

describe('exports.listReceipts', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns only the owned transaction\'s receipts', async () => {
        findById.mockResolvedValue(transaction)
        listActiveReceiptsByTransaction.mockResolvedValue([{ id: 1, fileUrl: 'x' }])
        const res = buildRes()

        await listReceipts(cardholderReq(), res, jest.fn())

        expect(listActiveReceiptsByTransaction).toHaveBeenCalledWith(1)
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('403s when the transaction is not the cardholder\'s own', async () => {
        findById.mockResolvedValue({ id: 1, corporateId: 42, userId: 'someone-else' })
        const next = jest.fn()

        await listReceipts(cardholderReq(), buildRes(), next)

        expect(listActiveReceiptsByTransaction).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })
})

describe('exports.deleteReceipt', () => {
    beforeEach(() => jest.clearAllMocks())

    it('404s when the receipt does not exist under that transaction', async () => {
        findById.mockResolvedValue(transaction)
        findActiveReceiptById.mockResolvedValue(null)
        const next = jest.fn()

        await deleteReceipt(cardholderReq({ params: { id: '1', receiptId: '99' } }), buildRes(), next)

        expect(softDeleteReceipt).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 404 }))
    })

    it('lets the original cardholder uploader delete their own receipt', async () => {
        findById.mockResolvedValue(transaction)
        const receipt = { uploadedByRole: 'CARDHOLDER', uploadedByUserId: '99' }
        findActiveReceiptById.mockResolvedValue(receipt)
        const res = buildRes()

        await deleteReceipt(cardholderReq({ params: { id: '1', receiptId: '99' } }), res, jest.fn())

        expect(softDeleteReceipt).toHaveBeenCalledWith(receipt)
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('lets an ESS-keyed cardholder delete their own receipt', async () => {
        findById.mockResolvedValue(essTransaction)
        const receipt = { uploadedByRole: 'CARDHOLDER', uploadedByUserId: '7' }
        findActiveReceiptById.mockResolvedValue(receipt)
        const res = buildRes()

        await deleteReceipt(essCardholderReq({ params: { id: '1', receiptId: '99' } }), res, jest.fn())

        expect(softDeleteReceipt).toHaveBeenCalledWith(receipt)
        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('forbids an ESS-keyed cardholder from deleting a receipt keyed on the corporate', async () => {
        findById.mockResolvedValue(essTransaction)
        findActiveReceiptById.mockResolvedValue({ uploadedByRole: 'CARDHOLDER', uploadedByUserId: 42 })
        const next = jest.fn()

        await deleteReceipt(essCardholderReq({ params: { id: '1', receiptId: '99' } }), buildRes(), next)

        expect(softDeleteReceipt).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('forbids a cardholder from deleting a receipt an admin uploaded', async () => {
        findById.mockResolvedValue(transaction)
        findActiveReceiptById.mockResolvedValue({ uploadedByRole: 'ADMIN', uploadedByUserId: 42 })
        const next = jest.fn()

        await deleteReceipt(cardholderReq({ params: { id: '1', receiptId: '99' } }), buildRes(), next)

        expect(softDeleteReceipt).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('lets an admin delete any receipt under their corporate', async () => {
        findById.mockResolvedValue(transaction)
        const receipt = { uploadedByRole: 'CARDHOLDER', uploadedByUserId: '99' }
        findActiveReceiptById.mockResolvedValue(receipt)
        const res = buildRes()

        await deleteReceipt(adminReq({ params: { id: '1', receiptId: '99' } }), res, jest.fn())

        expect(softDeleteReceipt).toHaveBeenCalledWith(receipt)
        expect(res.status).toHaveBeenCalledWith(200)
    })
})
