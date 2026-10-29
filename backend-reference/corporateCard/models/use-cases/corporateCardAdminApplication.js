const { Op, fn, col } = require('sequelize')
const corporateCardAdminApplication = require('../entities/corporateCardAdminApplication')
const asyncHandler = require('../../middlewares/async')
const { KYB_STATUS_OPTIONS } = require('../../constants/corporateCardApplication')
const sharedDirectory = require('../../utils/sharedDirectory')
const { findEntityNamesByCorporateIds, findCorporateIdsByEntityName } = require('./corporateCardAgreement')
const { customLog } = require('../../utils/loggerHelper')

const findByCorporate = asyncHandler(async (corporateId) =>
    corporateCardAdminApplication.findOne({ where: { corporateId, isDeleted: false } }))

const findByCorporateIncludingDeleted = asyncHandler(async (corporateId) =>
    corporateCardAdminApplication.findOne({ where: { corporateId } }))

const lockByCorporate = asyncHandler(async (corporateId, transaction) =>
    corporateCardAdminApplication.findOne({
        where: { corporateId },
        transaction,
        lock: transaction.LOCK.UPDATE,
    }))

const findBySvcCardNumber = asyncHandler(async (svcCardNumber) => {
    const value = svcCardNumber ? String(svcCardNumber).trim() : ''
    if (!value) return null
    return corporateCardAdminApplication.findOne({ where: { svcCardNumber: value } })
})

const findOtherByCardSchemeId = asyncHandler(async (cardSchemeId, corporateId) => {
    const scheme = Number(cardSchemeId)
    if (!Number.isInteger(scheme) || scheme <= 0) return null
    return corporateCardAdminApplication.findOne({
        where: {
            cardSchemeId: scheme,
            isDeleted: false,
            corporateId: { [Op.ne]: corporateId },
        },
    })
})

const upsertByCorporate = asyncHandler(async (corporateId, fields = {}) => {
    const revived = Object.prototype.hasOwnProperty.call(fields, 'isDeleted')
        ? fields
        : { ...fields, isDeleted: false }
    const existing = await corporateCardAdminApplication.findOne({ where: { corporateId } })
    if (existing) {
        await existing.update(revived)
        return existing
    }
    return corporateCardAdminApplication.create({ corporateId, ...revived })
})

const VENDOR_EMAIL_COLUMNS = ['vendorEmailStatus', 'vendorEmailSentAt']

const updateVendorEmailState = asyncHandler(async (corporateId, state = {}) => {
    const [affected] = await corporateCardAdminApplication.update(state, {
        where: { corporateId },
        fields: VENDOR_EMAIL_COLUMNS,
        silent: true,
    })
    return affected
})

const attachCorporates = async (rows, req) => {
    try {
        const corporates = await sharedDirectory.getCorporatesByIds(rows.map((row) => row.corporateId), req)
        rows.forEach((row) => {
            row.corporateUser = row.corporateId ? corporates.get(String(row.corporateId)) || null : null
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            message: '[Internal] corporate hydration failed — rendering applications without company names',
            error: err?.message,
        }, 'CONSOLE')
        rows.forEach((row) => { row.corporateUser = null })
    }
    return rows
}

const attachAgreementEntityNames = async (rows, req) => {
    try {
        const names = await findEntityNamesByCorporateIds(rows.map((row) => row.corporateId))
        rows.forEach((row) => {
            row.agreementEntityName = row.corporateId ? names.get(String(row.corporateId)) || null : null
        })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            action: 'corporateCard:applications:entityNameHydrationFailed',
            message: '[Applications] Could not read the agreement entity names',
            error: err?.message,
        }, 'CONSOLE')
        rows.forEach((row) => { row.agreementEntityName = null })
    }
    return rows
}

const searchEntityNameIds = async (searchText, req) => {
    try {
        return await findCorporateIdsByEntityName({ searchText })
    } catch (err) {
        customLog(req?.LogTraceId, 'error', {
            action: 'corporateCard:applications:entityNameSearchFailed',
            message: '[Applications] Entity-name search failed — searching corporate names only',
            error: err?.message,
        }, 'CONSOLE')
        return []
    }
}

const findAndCount = asyncHandler(async ({ limit, offset, status, searchText, req }) => {
    const where = { isDeleted: false }
    if (status) where.kybStatus = status

    if (searchText) {
        const [directory, entityIds] = await Promise.all([
            sharedDirectory.searchCorporateIdsByCompanyName({ searchText, req }),
            searchEntityNameIds(searchText, req),
        ])
        const ids = [...new Set([...(directory?.ids || []), ...entityIds].map(Number))]
            .filter(Number.isInteger)
        if (!ids.length) return { count: 0, rows: [] }
        where.corporateId = { [Op.in]: ids }
    }

    const { count, rows } = await corporateCardAdminApplication.findAndCountAll({
        where,
        order: [['updatedAt', 'DESC']],
        limit,
        offset,
    })
    await attachCorporates(rows, req)
    await attachAgreementEntityNames(rows, req)
    return { count, rows }
})

const findAllApplicationCorporateIds = asyncHandler(async () => {
    const rows = await corporateCardAdminApplication.findAll({
        where: { corporateId: { [Op.ne]: null }, isDeleted: false },
        attributes: ['corporateId'],
        raw: true,
    })
    return rows.map((r) => String(r.corporateId))
})

const PICKABLE_PAGE_SIZE = 100
const PICKABLE_MAX_PAGES = 50

const searchCorporatesWithoutApplication = asyncHandler(async ({ searchText, limit = 20, req }) => {
    const excluded = new Set(await findAllApplicationCorporateIds())
    const picked = []
    let offset = 0
    for (let page = 0; page < PICKABLE_MAX_PAGES && picked.length < limit; page += 1) {
        const rows = await sharedDirectory.searchPickableCorporates({ searchText, limit: PICKABLE_PAGE_SIZE, offset, req })
        for (const row of rows) {
            if (!excluded.has(String(row.id))) {
                picked.push(row)
                if (picked.length >= limit) break
            }
        }
        if (rows.length < PICKABLE_PAGE_SIZE) break
        offset += PICKABLE_PAGE_SIZE
    }
    return picked
})

const getApplicationsSummary = asyncHandler(async (req) => {
    const grouped = await corporateCardAdminApplication.findAll({
        attributes: ['kybStatus', [fn('COUNT', col('id')), 'count']],
        where: { isDeleted: false },
        group: ['kybStatus'],
        raw: true,
    })

    const byStatus = { PENDING: 0, COMPLETED: 0 }
    let totalApplications = 0
    grouped.forEach((r) => {
        const count = Number(r.count) || 0
        totalApplications += count
        const status = (r.kybStatus || 'PENDING').toUpperCase()
        if (byStatus[status] !== undefined) byStatus[status] += count
        else if (!KYB_STATUS_OPTIONS.includes(status)) byStatus.PENDING += count
    })

    const totalCorporates = await sharedDirectory.countPickableCorporates(req)

    return {
        totalCorporates,
        totalApplications,
        pending: byStatus.PENDING,
        completed: byStatus.COMPLETED,
        notProvisioned: Math.max(totalCorporates - totalApplications, 0),
    }
})

module.exports = {
    findByCorporate,
    findByCorporateIncludingDeleted,
    lockByCorporate,
    findBySvcCardNumber,
    findOtherByCardSchemeId,
    upsertByCorporate,
    updateVendorEmailState,
    findAndCount,
    findAllApplicationCorporateIds,
    searchCorporatesWithoutApplication,
    getApplicationsSummary,
}
