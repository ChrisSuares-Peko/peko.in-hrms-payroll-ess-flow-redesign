const settingsUC = require('../../models/use-cases/settings')
const {
    SETTING_NAME,
    getMaxSizeKbMap,
    maxSizeKbFor,
    resetCache,
    localLimits,
} = require('../documentSizeLimits')

jest.mock('../../models/use-cases/settings', () => ({
    findByName: jest.fn(),
    seedIfAbsent: jest.fn(),
}))
jest.mock('../../utils/loggerHelper', () => ({ customLog: jest.fn() }))

describe('documentSizeLimits', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        resetCache()
    })

    describe('when the setting does not exist yet', () => {
        beforeEach(() => settingsUC.findByName.mockResolvedValue(null))

        it('seeds the table from the local defaults', async () => {
            await getMaxSizeKbMap()

            expect(settingsUC.seedIfAbsent).toHaveBeenCalledWith(SETTING_NAME, localLimits())
        })

        it('serves the local defaults on that first call rather than nothing', async () => {
            const limits = await getMaxSizeKbMap()

            expect(limits.MOA).toBe(10240)
            expect(limits.Address_Proof).toBe(500)
        })
    })

    describe('when the setting exists', () => {
        it('prefers the stored limit over the local default', async () => {
            settingsUC.findByName.mockResolvedValue({ details: { MOA: 4096, Address_Proof: 1024 } })

            const limits = await getMaxSizeKbMap()

            expect(limits.MOA).toBe(4096)
            expect(limits.Address_Proof).toBe(1024)
        })

        it('keeps the local default for any document the setting does not mention', async () => {
            settingsUC.findByName.mockResolvedValue({ details: { MOA: 4096 } })

            const limits = await getMaxSizeKbMap()

            expect(limits.GST_Certificate).toBe(2048)
        })

        it('never seeds again', async () => {
            settingsUC.findByName.mockResolvedValue({ details: { MOA: 4096 } })

            await getMaxSizeKbMap()

            expect(settingsUC.seedIfAbsent).not.toHaveBeenCalled()
        })

        it('parses details stored as a JSON string', async () => {
            settingsUC.findByName.mockResolvedValue({ details: JSON.stringify({ MOA: 3072 }) })

            expect((await getMaxSizeKbMap()).MOA).toBe(3072)
        })

        it('ignores a document name it does not know', async () => {
            settingsUC.findByName.mockResolvedValue({ details: { Not_A_Document: 99, MOA: 4096 } })

            const limits = await getMaxSizeKbMap()

            expect(limits.Not_A_Document).toBeUndefined()
            expect(limits.MOA).toBe(4096)
        })

        it.each([0, -1, 'abc', null])('ignores the unusable limit %p', async (bad) => {
            settingsUC.findByName.mockResolvedValue({ details: { MOA: bad } })

            expect((await getMaxSizeKbMap()).MOA).toBe(10240)
        })
    })

    describe('when the settings table cannot be read', () => {
        it('falls back to the local defaults instead of blocking uploads', async () => {
            settingsUC.findByName.mockRejectedValue(new Error('db down'))

            const limits = await getMaxSizeKbMap()

            expect(limits).toEqual(localLimits())
        })

        it('falls back when a seed write fails too', async () => {
            settingsUC.findByName.mockResolvedValue(null)
            settingsUC.seedIfAbsent.mockRejectedValue(new Error('insert failed'))

            expect(await getMaxSizeKbMap()).toEqual(localLimits())
        })
    })

    describe('caching', () => {
        it('does not hit the table on every upload', async () => {
            settingsUC.findByName.mockResolvedValue({ details: { MOA: 4096 } })

            await getMaxSizeKbMap()
            await getMaxSizeKbMap()
            await getMaxSizeKbMap()

            expect(settingsUC.findByName).toHaveBeenCalledTimes(1)
        })

        it('collapses concurrent first reads into one query', async () => {
            settingsUC.findByName.mockResolvedValue({ details: { MOA: 4096 } })

            await Promise.all([getMaxSizeKbMap(), getMaxSizeKbMap(), getMaxSizeKbMap()])

            expect(settingsUC.findByName).toHaveBeenCalledTimes(1)
        })
    })

    describe('maxSizeKbFor', () => {
        it('returns the resolved limit for a known document', async () => {
            settingsUC.findByName.mockResolvedValue({ details: { Cancelled_Cheque: 750 } })

            expect(await maxSizeKbFor('Cancelled_Cheque')).toBe(750)
        })

        it('falls back to the default for a name it does not know', async () => {
            settingsUC.findByName.mockResolvedValue(null)

            expect(await maxSizeKbFor('Not_A_Document')).toBe(10240)
        })
    })
})
