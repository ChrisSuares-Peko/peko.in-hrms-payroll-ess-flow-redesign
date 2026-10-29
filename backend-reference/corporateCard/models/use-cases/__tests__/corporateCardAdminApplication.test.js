const { Op } = require('sequelize')
const corporateCardAdminApplication = require('../../entities/corporateCardAdminApplication')
const sharedDirectory = require('../../../utils/sharedDirectory')
const agreementUC = require('../corporateCardAgreement')
const {
    findByCorporate,
    findByCorporateIncludingDeleted,
    upsertByCorporate,
    findAndCount,
    findAllApplicationCorporateIds,
    searchCorporatesWithoutApplication,
    getApplicationsSummary,
} = require('../corporateCardAdminApplication')

jest.mock('../../entities/corporateCardAdminApplication', () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
}))
jest.mock('../corporateCardAgreement', () => ({
    findEntityNamesByCorporateIds: jest.fn(),
    findCorporateIdsByEntityName: jest.fn(),
}))
jest.mock('../../../utils/sharedDirectory', () => ({
    countPickableCorporates: jest.fn(),
    getCorporatesByIds: jest.fn(),
    searchCorporateIdsByCompanyName: jest.fn(),
    searchPickableCorporates: jest.fn(),
}))

describe('findByCorporate', () => {
    beforeEach(() => jest.clearAllMocks())

    // A closed account must read as having no application at all, or the corporate would be shown its
    // old KYB state instead of a fresh start.
    it('looks up the live application row, never a closed one', async () => {
        const row = { corporateId: 42, kybStatus: 'PENDING' }
        corporateCardAdminApplication.findOne.mockResolvedValue(row)

        const result = await findByCorporate(42)

        expect(corporateCardAdminApplication.findOne).toHaveBeenCalledWith({
            where: { corporateId: 42, isDeleted: false },
        })
        expect(result).toBe(row)
    })
})

describe('upsertByCorporate', () => {
    beforeEach(() => jest.clearAllMocks())

    it('updates the existing row in place when one already exists', async () => {
        const existing = { corporateId: 42, kybStatus: 'PENDING', update: jest.fn().mockResolvedValue(undefined) }
        corporateCardAdminApplication.findOne.mockResolvedValue(existing)

        const result = await upsertByCorporate(42, { kybStatus: 'SUBMITTED' })

        expect(existing.update).toHaveBeenCalledWith({ kybStatus: 'SUBMITTED', isDeleted: false })
        expect(corporateCardAdminApplication.create).not.toHaveBeenCalled()
        expect(result).toBe(existing)
    })

    it('creates a new row (with the corporateId merged in) when none exists yet', async () => {
        corporateCardAdminApplication.findOne.mockResolvedValue(null)
        const created = { corporateId: 42, kybStatus: 'SUBMITTED' }
        corporateCardAdminApplication.create.mockResolvedValue(created)

        const result = await upsertByCorporate(42, { kybStatus: 'SUBMITTED', createdByCredentialId: 7 })

        expect(corporateCardAdminApplication.create).toHaveBeenCalledWith({
            corporateId: 42,
            kybStatus: 'SUBMITTED',
            createdByCredentialId: 7,
            isDeleted: false,
        })
        expect(result).toBe(created)
    })
})

describe('findAndCount', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        agreementUC.findCorporateIdsByEntityName.mockResolvedValue([])
        agreementUC.findEntityNamesByCorporateIds.mockResolvedValue(new Map())
    })

    it('does not consult the shared directory when no searchText is given', async () => {
        corporateCardAdminApplication.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        sharedDirectory.getCorporatesByIds.mockResolvedValue(new Map())

        await findAndCount({ limit: 10, offset: 0, req: {} })

        expect(sharedDirectory.searchCorporateIdsByCompanyName).not.toHaveBeenCalled()
        const call = corporateCardAdminApplication.findAndCountAll.mock.calls[0][0]
        expect(call.where.corporateId).toBeUndefined()
    })

    it('searches company/contact-person/username in the shared DB, then filters own rows by the matched ids', async () => {
        corporateCardAdminApplication.findAndCountAll.mockResolvedValue({ count: 0, rows: [] })
        sharedDirectory.getCorporatesByIds.mockResolvedValue(new Map())
        sharedDirectory.searchCorporateIdsByCompanyName.mockResolvedValue({ ids: ['7', '9'], capped: false })
        const req = { LogTraceId: 'trace-1' }

        await findAndCount({ limit: 10, offset: 0, searchText: 'abr', req })

        expect(sharedDirectory.searchCorporateIdsByCompanyName).toHaveBeenCalledWith({ searchText: 'abr', req })
        const call = corporateCardAdminApplication.findAndCountAll.mock.calls[0][0]
        expect(call.where.corporateId).toEqual({ [Op.in]: ['7', '9'] })
    })

    it('returns an empty page without querying when the search matched no corporates', async () => {
        sharedDirectory.searchCorporateIdsByCompanyName.mockResolvedValue({ ids: [], capped: false })

        const result = await findAndCount({ limit: 10, offset: 0, searchText: 'zzz', req: {} })

        expect(result).toEqual({ count: 0, rows: [] })
        expect(corporateCardAdminApplication.findAndCountAll).not.toHaveBeenCalled()
    })
})

describe('the soft-delete contract', () => {
    beforeEach(() => jest.clearAllMocks())

    // upsert has to see the closed row or the unique corporateId index rejects the create.
    it('finds the row regardless of the flag, so a restart cannot collide on corporateId', async () => {
        const existing = { corporateId: 42, update: jest.fn().mockResolvedValue(undefined) }
        corporateCardAdminApplication.findOne.mockResolvedValue(existing)

        await upsertByCorporate(42, { businessType: 'LLP' })

        expect(corporateCardAdminApplication.findOne).toHaveBeenCalledWith({ where: { corporateId: 42 } })
        expect(corporateCardAdminApplication.create).not.toHaveBeenCalled()
    })

    // Any ordinary KYB write revives the row, so a closed corporate can never be stranded.
    it('revives a closed row on an ordinary write', async () => {
        const existing = { corporateId: 42, isDeleted: true, update: jest.fn().mockResolvedValue(undefined) }
        corporateCardAdminApplication.findOne.mockResolvedValue(existing)

        await upsertByCorporate(42, { businessType: 'LLP' })

        expect(existing.update).toHaveBeenCalledWith({ businessType: 'LLP', isDeleted: false })
    })

    it('lets an explicit isDeleted through, so the closure can actually delete', async () => {
        const existing = { corporateId: 42, update: jest.fn().mockResolvedValue(undefined) }
        corporateCardAdminApplication.findOne.mockResolvedValue(existing)

        await upsertByCorporate(42, { kybStatus: null, isDeleted: true })

        expect(existing.update).toHaveBeenCalledWith({ kybStatus: null, isDeleted: true })
    })

    it('can still read a closed row when the caller asks for it', async () => {
        const row = { corporateId: 42, isDeleted: true }
        corporateCardAdminApplication.findOne.mockResolvedValue(row)

        const result = await findByCorporateIncludingDeleted(42)

        expect(corporateCardAdminApplication.findOne).toHaveBeenCalledWith({ where: { corporateId: 42 } })
        expect(result).toBe(row)
    })
})

describe('findAllApplicationCorporateIds', () => {
    beforeEach(() => jest.clearAllMocks())

    it('queries only non-null corporateIds and maps them to strings', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([{ corporateId: 5 }, { corporateId: 9 }])

        const result = await findAllApplicationCorporateIds()

        expect(corporateCardAdminApplication.findAll).toHaveBeenCalledWith({
            where: { corporateId: { [Op.ne]: null }, isDeleted: false },
            attributes: ['corporateId'],
            raw: true,
        })
        expect(result).toEqual(['5', '9'])
    })
})

describe('searchCorporatesWithoutApplication', () => {
    beforeEach(() => jest.clearAllMocks())

    it('returns pickable corporates from the first page when none already have an application', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([])
        sharedDirectory.searchPickableCorporates.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])

        const result = await searchCorporatesWithoutApplication({ limit: 20 })

        expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
        expect(sharedDirectory.searchPickableCorporates).toHaveBeenCalledTimes(1)
        expect(sharedDirectory.searchPickableCorporates).toHaveBeenCalledWith({
            searchText: undefined,
            limit: 100,
            offset: 0,
            req: undefined,
        })
    })

    it('excludes corporates that already have an application row', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([{ corporateId: 2 }])
        sharedDirectory.searchPickableCorporates.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }])

        const result = await searchCorporatesWithoutApplication({ limit: 20 })

        expect(result).toEqual([{ id: 1 }, { id: 3 }])
    })

    it('pages through the shared directory when the first page is exhausted without reaching the limit', async () => {
        const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }))
        corporateCardAdminApplication.findAll.mockResolvedValue(fullPage.map((r) => ({ corporateId: r.id })))
        sharedDirectory.searchPickableCorporates
            .mockResolvedValueOnce(fullPage)
            .mockResolvedValueOnce([{ id: 200 }, { id: 201 }])

        const result = await searchCorporatesWithoutApplication({ limit: 5 })

        expect(result).toEqual([{ id: 200 }, { id: 201 }])
        expect(sharedDirectory.searchPickableCorporates).toHaveBeenCalledTimes(2)
        expect(sharedDirectory.searchPickableCorporates).toHaveBeenNthCalledWith(2, {
            searchText: undefined,
            limit: 100,
            offset: 100,
            req: undefined,
        })
    })

    it('stops paging once enough unexcluded corporates have been picked, without fetching further pages', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([])
        const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }))
        sharedDirectory.searchPickableCorporates.mockResolvedValue(fullPage)

        const result = await searchCorporatesWithoutApplication({ limit: 5 })

        expect(result).toHaveLength(5)
        expect(result).toEqual(fullPage.slice(0, 5))
        expect(sharedDirectory.searchPickableCorporates).toHaveBeenCalledTimes(1)
    })

    it('stops paging once the shared directory returns a short page (no more results)', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([])
        sharedDirectory.searchPickableCorporates.mockResolvedValue([{ id: 1 }, { id: 2 }])

        const result = await searchCorporatesWithoutApplication({ limit: 20 })

        expect(result).toEqual([{ id: 1 }, { id: 2 }])
        expect(sharedDirectory.searchPickableCorporates).toHaveBeenCalledTimes(1)
    })

    it('caps at 50 pages in the pathological case where every candidate already has an application', async () => {
        const fullPage = Array.from({ length: 100 }, (_, i) => ({ id: i }))
        corporateCardAdminApplication.findAll.mockResolvedValue(fullPage.map((r) => ({ corporateId: r.id })))
        sharedDirectory.searchPickableCorporates.mockResolvedValue(fullPage)

        const result = await searchCorporatesWithoutApplication({ limit: 20 })

        expect(result).toEqual([])
        expect(sharedDirectory.searchPickableCorporates).toHaveBeenCalledTimes(50)
    })

    it('defaults limit to 20 when not provided', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([])
        sharedDirectory.searchPickableCorporates.mockResolvedValue(
            Array.from({ length: 30 }, (_, i) => ({ id: i }))
        )

        const result = await searchCorporatesWithoutApplication({})

        expect(result).toHaveLength(20)
    })

    it('passes searchText and req through to the shared directory search', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([])
        sharedDirectory.searchPickableCorporates.mockResolvedValue([])
        const req = { LogTraceId: 'trace-1' }

        await searchCorporatesWithoutApplication({ searchText: 'steel', req, limit: 20 })

        expect(sharedDirectory.searchPickableCorporates).toHaveBeenCalledWith({
            searchText: 'steel',
            limit: 100,
            offset: 0,
            req,
        })
    })
})

describe('getApplicationsSummary', () => {
    beforeEach(() => jest.clearAllMocks())

    it('no longer tracks or returns an inProgress bucket', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([
            { kybStatus: 'PENDING', count: '3' },
            { kybStatus: 'COMPLETED', count: '2' },
        ])
        sharedDirectory.countPickableCorporates.mockResolvedValue(10)

        const summary = await getApplicationsSummary()

        expect(summary).not.toHaveProperty('inProgress')
        expect(summary).toEqual({
            totalCorporates: 10,
            totalApplications: 5,
            pending: 3,
            completed: 2,
            notProvisioned: 5,
        })
    })

    it('folds a legacy/unknown status (e.g. the retired IN_PROGRESS) into pending', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([
            { kybStatus: 'IN_PROGRESS', count: '4' },
            { kybStatus: 'COMPLETED', count: '1' },
        ])
        sharedDirectory.countPickableCorporates.mockResolvedValue(10)

        const summary = await getApplicationsSummary()

        expect(summary.pending).toBe(4)
        expect(summary.completed).toBe(1)
        expect(summary.totalApplications).toBe(5)
    })

    it('does NOT fold recognized in-flight statuses (SUBMITTED/UNDER_REVIEW/VERIFIED/REJECTED) into pending', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([
            { kybStatus: 'PENDING', count: '1' },
            { kybStatus: 'SUBMITTED', count: '2' },
            { kybStatus: 'UNDER_REVIEW', count: '3' },
            { kybStatus: 'VERIFIED', count: '2' },
            { kybStatus: 'REJECTED', count: '1' },
            { kybStatus: 'COMPLETED', count: '5' },
        ])

        const summary = await getApplicationsSummary()

        expect(summary.pending).toBe(1)
        expect(summary.completed).toBe(5)
        expect(summary.totalApplications).toBe(14)
    })

    it('treats a null kybStatus as pending', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([{ kybStatus: null, count: '2' }])
        sharedDirectory.countPickableCorporates.mockResolvedValue(5)

        const summary = await getApplicationsSummary()

        expect(summary.pending).toBe(2)
    })

    it('never returns a negative notProvisioned count', async () => {
        corporateCardAdminApplication.findAll.mockResolvedValue([{ kybStatus: 'PENDING', count: '10' }])
        sharedDirectory.countPickableCorporates.mockResolvedValue(3)

        const summary = await getApplicationsSummary()

        expect(summary.notProvisioned).toBe(0)
    })
})
