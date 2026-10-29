process.env.NODE_ENV = 'staging'

const s3 = require('../../../utils/s3')
const { getDocument } = require('../document')

jest.mock('../../../utils/s3', () => ({ getDocumentDecrypted: jest.fn() }))

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('getDocument', () => {
    beforeEach(() => jest.clearAllMocks())

    it('400s when no docKey param is present', async () => {
        const next = jest.fn()
        await getDocument({ params: {}, user: { role: 'CORPORATE', username: 'abc' } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Document key is required', status_code: 400 }))
    })

    it('400s when the docKey has fewer than 3 path segments', async () => {
        const next = jest.fn()
        const req = { params: { docKey: 'staging/corporate' }, user: { role: 'CORPORATE', username: 'abc' } }

        await getDocument(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: 'Invalid document', status_code: 400 }))
    })

    it('403s when the docKey belongs to a different environment', async () => {
        const next = jest.fn()
        const req = {
            params: { docKey: 'production/corporate/abc/KYB-Documents/file-1' },
            user: { role: 'CORPORATE', username: 'abc' },
        }

        await getDocument(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'You are not authorized to access this document', status_code: 403 })
        )
        expect(s3.getDocumentDecrypted).not.toHaveBeenCalled()
    })

    it('403s a non-admin trying to fetch another user\'s document (role matches, username does not)', async () => {
        const next = jest.fn()
        const req = {
            params: { docKey: 'staging/corporate/someone-else/KYB-Documents/file-1' },
            user: { role: 'CORPORATE', username: 'abc' },
        }

        await getDocument(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('403s a non-admin whose role does not match the docKey role segment', async () => {
        const next = jest.fn()
        const req = {
            params: { docKey: 'staging/system_user/abc/KYB-Documents/file-1' },
            user: { role: 'CORPORATE', username: 'abc' },
        }

        await getDocument(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(expect.objectContaining({ status_code: 403 }))
    })

    it('lets a non-admin fetch their own document (matching env, role, username)', async () => {
        s3.getDocumentDecrypted.mockResolvedValue({ buffer: Buffer.from('x'), type: 'pdf' })
        const res = buildRes()
        const req = {
            params: { docKey: 'staging/corporate/abc/KYB-Documents/file-1' },
            user: { role: 'CORPORATE', username: 'abc' },
        }

        await getDocument(req, res, jest.fn())

        expect(s3.getDocumentDecrypted).toHaveBeenCalledWith('staging/corporate/abc/KYB-Documents/file-1')
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ status: true, message: 'Fetched Document successfully' })
        )
    })

    it('lets SYSTEM_USER fetch any corporate\'s document in the same environment, regardless of username', async () => {
        s3.getDocumentDecrypted.mockResolvedValue({ buffer: Buffer.from('x'), type: 'pdf' })
        const res = buildRes()
        const req = {
            params: { docKey: 'staging/corporate/someone-else/KYB-Documents/file-1' },
            user: { role: 'SYSTEM_USER', username: 'admin-user' },
        }

        await getDocument(req, res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('is case-insensitive on role/environment matching', async () => {
        s3.getDocumentDecrypted.mockResolvedValue({ buffer: Buffer.from('x'), type: 'pdf' })
        const res = buildRes()
        const req = {
            params: { docKey: 'STAGING/CORPORATE/ABC/KYB-Documents/file-1' },
            user: { role: 'corporate', username: 'ABC' },
        }

        await getDocument(req, res, jest.fn())

        expect(res.status).toHaveBeenCalledWith(200)
    })

    it('500s when the decrypt step comes back empty', async () => {
        s3.getDocumentDecrypted.mockResolvedValue(null)
        const next = jest.fn()
        const req = {
            params: { docKey: 'staging/corporate/abc/KYB-Documents/file-1' },
            user: { role: 'CORPORATE', username: 'abc' },
        }

        await getDocument(req, buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: 'Something went wrong while fetching document', status_code: 500 })
        )
    })
})
