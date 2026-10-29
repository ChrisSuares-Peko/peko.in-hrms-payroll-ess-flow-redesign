const mockUpload = jest.fn()
const mockDelete = jest.fn()
const mockFile = jest.fn().mockImplementation(() => ({ delete: mockDelete }))
const mockBucket = jest.fn().mockImplementation(() => ({ upload: mockUpload, file: mockFile }))

jest.mock('../../configs/firebase-private.json', () => ({}), { virtual: true })
jest.mock('firebase-admin', () => ({
    initializeApp: jest.fn().mockReturnValue({ storage: jest.fn().mockImplementation(() => ({ bucket: mockBucket })) }),
    credential: { cert: jest.fn() },
}))

const mockWriteFile = jest.fn().mockResolvedValue()
const mockUnlinkSync = jest.fn()
jest.mock('fs', () => ({
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    unlinkSync: mockUnlinkSync,
    promises: { writeFile: mockWriteFile },
}))

process.env.NODE_ENV = 'staging'

const { uploadFile, deleteFile } = require('../firebase')

describe('uploadFile', () => {
    beforeEach(() => jest.clearAllMocks())

    it('writes a temp file, uploads it publicly, removes the temp file, and returns a public download url', async () => {
        mockUpload.mockResolvedValue()

        const url = await uploadFile(Buffer.from('hello').toString('base64'), 'corporate-cards/42/1/receipts', 'png')

        expect(mockWriteFile).toHaveBeenCalled()
        expect(mockUpload).toHaveBeenCalledWith(
            expect.stringContaining('.png'),
            expect.objectContaining({
                predefinedAcl: 'publicRead',
                destination: expect.stringMatching(/^staging\/corporate-cards\/42\/1\/receipts\/.+\.png$/),
            })
        )
        expect(mockUnlinkSync).toHaveBeenCalled()
        expect(url).toMatch(/^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/peko-storage\.appspot\.com\/o\/.+\?alt=media&token=.+$/)
    })
})

describe('deleteFile', () => {
    beforeEach(() => jest.clearAllMocks())

    it('extracts the storage path from a download url and deletes it', async () => {
        mockDelete.mockResolvedValue()
        const url = 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcorporate-cards%2F42%2F1%2Freceipts%2Fabc.png?alt=media&token=xyz'

        const result = await deleteFile(url)

        expect(mockFile).toHaveBeenCalledWith('staging/corporate-cards/42/1/receipts/abc.png')
        expect(result).toEqual({ success: true, message: expect.stringContaining('deleted successfully') })
    })

    it('reports failure instead of throwing when the delete rejects', async () => {
        mockDelete.mockRejectedValue(new Error('not found'))
        const url = 'https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fabc.png?alt=media&token=xyz'

        const result = await deleteFile(url)

        expect(result).toEqual({ success: false, message: expect.stringContaining('not found') })
    })
})
