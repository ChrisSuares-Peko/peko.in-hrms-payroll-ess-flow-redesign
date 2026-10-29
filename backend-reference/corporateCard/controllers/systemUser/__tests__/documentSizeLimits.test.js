const limitsService = require('../../../services/documentSizeLimits')
const { getDocumentSizeLimits, updateDocumentSizeLimits } = require('../documentSizeLimits')

jest.mock('../../../models/use-cases/settings', () => ({
    findByName: jest.fn(),
    seedIfAbsent: jest.fn(),
    save: jest.fn(),
}))
jest.mock('../../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

const settingsUC = require('../../../models/use-cases/settings')

const buildRes = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const payload = (res) => res.json.mock.calls[0][0].data

describe('getDocumentSizeLimits', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        limitsService.resetCache()
        settingsUC.findByName.mockResolvedValue(null)
    })

    it('lists every document a corporate uploads, with its limit', async () => {
        const res = buildRes()

        await getDocumentSizeLimits({}, res)

        const byName = Object.fromEntries(
            payload(res).documents.map((d) => [d.documentName, d.maxSizeKb])
        )
        expect(byName.MOA).toBe(10240)
        expect(byName.Address_Proof).toBe(500)
    })

    it('leaves out the documents Peko generates, which no one uploads', async () => {
        const res = buildRes()

        await getDocumentSizeLimits({}, res)

        const names = payload(res).documents.map((d) => d.documentName)
        expect(names).not.toContain('Corporate_Agreement_Generated')
        expect(names).not.toContain('Corporate_Agreement_Signed')
    })

    it('reports the default alongside the current value, so an edit can be undone', async () => {
        settingsUC.findByName.mockResolvedValue({ details: { Address_Proof: 1024 } })
        const res = buildRes()

        await getDocumentSizeLimits({}, res)

        const row = payload(res).documents.find((d) => d.documentName === 'Address_Proof')
        expect(row).toEqual(expect.objectContaining({ maxSizeKb: 1024, defaultMaxSizeKb: 500 }))
    })

    it('tells the client the range it may set', async () => {
        const res = buildRes()

        await getDocumentSizeLimits({}, res)

        expect(payload(res).minSizeKb).toBe(100)
        expect(payload(res).maxSizeKb).toBe(20 * 1024)
    })
})

describe('updateDocumentSizeLimits', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        limitsService.resetCache()
        settingsUC.findByName.mockResolvedValue(null)
        settingsUC.save.mockResolvedValue({})
    })

    it('persists the new limit merged over the ones it was not asked to change', async () => {
        const res = buildRes()

        await updateDocumentSizeLimits({ body: { limits: { Address_Proof: 1024 } } }, res, jest.fn())

        const [, saved] = settingsUC.save.mock.calls[0]
        expect(saved.Address_Proof).toBe(1024)
        expect(saved.MOA).toBe(10240)
    })

    it('returns the full list so the screen can render without refetching', async () => {
        const res = buildRes()

        await updateDocumentSizeLimits({ body: { limits: { Address_Proof: 1024 } } }, res, jest.fn())

        const row = payload(res).documents.find((d) => d.documentName === 'Address_Proof')
        expect(row.maxSizeKb).toBe(1024)
    })

    it('persists a new total limit', async () => {
        const res = buildRes()

        await updateDocumentSizeLimits(
            { body: { totals: { totalUploadKb: 20 * 1024 } } },
            res,
            jest.fn()
        )

        const [, saved] = settingsUC.save.mock.calls[0]
        expect(saved.totalUploadKb).toBe(20 * 1024)
        expect(saved.vendorPackKb).toBe(26 * 1024)
        expect(payload(res).totals.totalUploadKb).toBe(20 * 1024)
    })

    it('refuses an upload total larger than the vendor pack it has to fit inside', async () => {
        const next = jest.fn()

        await updateDocumentSizeLimits(
            { body: { totals: { totalUploadKb: 30 * 1024 } } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('cannot be smaller than the corporate upload limit'),
            })
        )
        expect(settingsUC.save).not.toHaveBeenCalled()
    })

    it('reports the shipped defaults for the totals so an edit can be undone', async () => {
        const res = buildRes()

        await getDocumentSizeLimits({}, res)

        expect(payload(res).totals.defaults).toEqual({
            totalUploadKb: 25 * 1024,
            vendorPackKb: 26 * 1024,
        })
    })

    it('refuses a vendor pack smaller than the upload total, which could never be satisfied', async () => {
        const next = jest.fn()

        await updateDocumentSizeLimits(
            { body: { totals: { vendorPackKb: 10 * 1024 } } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                message: expect.stringContaining('cannot be smaller than the corporate upload limit'),
            })
        )
        expect(settingsUC.save).not.toHaveBeenCalled()
    })

    it('rejects a total outside the allowed range without writing', async () => {
        const next = jest.fn()

        await updateDocumentSizeLimits(
            { body: { totals: { totalUploadKb: 500 } } },
            buildRes(),
            next
        )

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('must be between') })
        )
        expect(settingsUC.save).not.toHaveBeenCalled()
    })

    it('rejects an unknown total key', async () => {
        const next = jest.fn()

        await updateDocumentSizeLimits({ body: { totals: { nonsense: 2048 } } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('is not a total limit') })
        )
    })

    it('400s when neither limits nor totals were provided', async () => {
        const next = jest.fn()

        await updateDocumentSizeLimits({ body: {} }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining('Provide the document limits') })
        )
    })

    it.each([
        [{ Not_A_Document: 500 }, 'is not a KYB document'],
        [{ MOA: 50 }, 'must be between'],
        [{ MOA: 30 * 1024 }, 'must be between'],
        [{ MOA: 1.5 }, 'whole number'],
        [{}, 'at least one'],
        [null, 'as an object'],
    ])('rejects %p without writing', async (limits, fragment) => {
        const next = jest.fn()

        await updateDocumentSizeLimits({ body: { limits } }, buildRes(), next)

        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({ message: expect.stringContaining(fragment) })
        )
        expect(settingsUC.save).not.toHaveBeenCalled()
    })

    it('clears the cache so the next upload is gated on the new limit', async () => {
        await limitsService.getMaxSizeKbMap()
        settingsUC.findByName.mockResolvedValue({ details: { Address_Proof: 1024 } })

        await updateDocumentSizeLimits({ body: { limits: { Address_Proof: 1024 } } }, buildRes(), jest.fn())

        expect(await limitsService.maxSizeKbFor('Address_Proof')).toBe(1024)
    })
})
