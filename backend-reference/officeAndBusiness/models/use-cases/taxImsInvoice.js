const TaxImsInvoice = require('../entities/taxImsInvoice')

exports.upsertImsInvoices = async (rows) => {
    for (const row of rows) {
        const existing = await TaxImsInvoice.findOne({
            where: {
                reconciliationId: row.reconciliationId,
                supplierGstin:    row.supplierGstin,
                invoiceNo:        row.invoiceNo,
                invoiceType:      row.invoiceType,
            },
        })
        if (!existing) {
            await TaxImsInvoice.create(row)
        } else {
            // Keep user's action — only refresh raw portal data
            await existing.update({ rawData: row.rawData, supplierName: row.supplierName })
        }
    }
}

exports.bulkCreateImsInvoices = async (rows) => {
    return await TaxImsInvoice.bulkCreate(rows)
}

exports.findImsInvoices = async (corporateUserId, reconciliationId, { invoiceTypes, imsAction } = {}) => {
    const where = { corporateUserId, reconciliationId }
    if (invoiceTypes?.length) where.invoiceType = invoiceTypes
    if (imsAction) where.imsAction = imsAction
    const rows = await TaxImsInvoice.findAll({
        where,
        order: [['supplierName', 'ASC'], ['invoiceDate', 'DESC']],
        raw: true,
    })
    // Deduplicate: keep latest row per (supplierGstin, invoiceNo, invoiceType)
    const seen = new Map()
    for (const row of rows) {
        const key = `${row.supplierGstin}|${row.invoiceNo}|${row.invoiceType}`
        if (!seen.has(key) || row.id > seen.get(key).id) seen.set(key, row)
    }
    return [...seen.values()]
}

const NOTE_TYPES = ['B2BCN', 'B2BCNA', 'B2BDN', 'B2BDNA']

exports.getImsTabCounts = async (corporateUserId, reconciliationId) => {
    const all = await TaxImsInvoice.findAll({
        where: { corporateUserId, reconciliationId },
        attributes: ['invoiceType', 'imsAction'],
        raw: true,
    })

    const tabCounts = { all: all.length, b2b: 0, amendments: 0, notes: 0, ecom: 0 }
    const actionCounts = { accepted: 0, rejected: 0, pending: 0, noaction: 0 }

    for (const inv of all) {
        if (inv.invoiceType === 'B2B')                        tabCounts.b2b++
        else if (inv.invoiceType === 'B2BA')                  tabCounts.amendments++
        else if (NOTE_TYPES.includes(inv.invoiceType))        tabCounts.notes++
        else if (inv.invoiceType === 'ECOM' || inv.invoiceType === 'ECOMA') tabCounts.ecom++

        if (inv.imsAction) actionCounts[inv.imsAction] = (actionCounts[inv.imsAction] || 0) + 1
    }

    return { tabCounts, actionCounts }
}

exports.findImsInvoiceById = async (id, corporateUserId) => {
    return await TaxImsInvoice.findOne({ where: { id, corporateUserId }, raw: true })
}

exports.updateImsInvoiceAction = async (id, corporateUserId, imsAction) => {
    return await TaxImsInvoice.update({ imsAction }, { where: { id, corporateUserId } })
}

exports.findImsInvoicesByIds = async (ids, corporateUserId, reconciliationId) => {
    return await TaxImsInvoice.findAll({
        where: { id: ids, corporateUserId, reconciliationId },
        raw: true,
    })
}

exports.resetImsInvoiceActions = async (ids, corporateUserId) => {
    return await TaxImsInvoice.update(
        { imsAction: 'noaction', isAutoAccepted: false },
        { where: { id: ids, corporateUserId } }
    )
}

exports.autoAcceptNoaction = async (reconciliationId, corporateUserId) => {
    return await TaxImsInvoice.update(
        { imsAction: 'accepted', isAutoAccepted: true },
        { where: { reconciliationId, corporateUserId, imsAction: 'noaction' } }
    )
}

exports.getImsInvoiceCount = async (reconciliationId, corporateUserId) => {
    return await TaxImsInvoice.count({ where: { reconciliationId, corporateUserId } })
}

exports.getItcEstimate = async (reconciliationId, corporateUserId) => {
    const all = await TaxImsInvoice.findAll({
        where: { reconciliationId, corporateUserId },
        raw: true,
    })

    const sum = (arr) => parseFloat(arr.reduce((s, i) => s + parseFloat(i.totalTax || 0), 0).toFixed(2))

    const accepted    = all.filter(i => i.imsAction === 'accepted')
    const autoAccepted = all.filter(i => i.imsAction === 'noaction')
    const pending     = all.filter(i => i.imsAction === 'pending')
    const rejected    = all.filter(i => i.imsAction === 'rejected')
    const blocked     = all.filter(i => {
        const raw = typeof i.rawData === 'string' ? JSON.parse(i.rawData) : (i.rawData || {})
        return raw.ispendactblocked === 'Y'
    })

    return {
        accepted:      sum(accepted),
        autoAccepted:  sum(autoAccepted),
        pending:       sum(pending),
        rejected:      sum(rejected),
        blocked:       sum(blocked),
        netClaimable:  parseFloat((sum(accepted) + sum(autoAccepted) - sum(blocked)).toFixed(2)),
        totalCount:    all.length,
        reviewedCount: accepted.length + rejected.length + pending.length,
        pendingCount:  autoAccepted.length + pending.length,
    }
}
