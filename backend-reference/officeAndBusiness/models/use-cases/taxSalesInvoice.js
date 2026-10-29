const { Op } = require('sequelize')
const TaxSalesInvoice = require('../entities/taxSalesInvoice')

exports.createSalesInvoice = async (data) => {
  const record = await TaxSalesInvoice.create(data)
  return record || false
}

exports.bulkCreateSalesInvoices = async (rows) => {
  return await TaxSalesInvoice.bulkCreate(rows)
}

exports.findSalesInvoices = async (corporateUserId, gstin, financialYear, month) => {
  const where = { corporateUserId, gstin, financialYear }
  if (month) where.month = month
  return await TaxSalesInvoice.findAndCountAll({
    where,
    order: [['invoiceDate', 'DESC']],
    raw: true,
  })
}

exports.findSalesInvoiceById = async (id, corporateUserId) => {
  return await TaxSalesInvoice.findOne({ where: { id, corporateUserId }, raw: true })
}

exports.updateSalesInvoice = async (id, corporateUserId, data) => {
  return await TaxSalesInvoice.update(data, { where: { id, corporateUserId } })
}

exports.deleteSalesInvoice = async (id, corporateUserId) => {
  const record = await TaxSalesInvoice.findOne({ where: { id, corporateUserId } })
  if (!record) return false
  await record.destroy()
  return true
}

exports.findExistingInvoiceNos = async (corporateUserId, gstin, financialYear, month) => {
  const rows = await TaxSalesInvoice.findAll({
    where: { corporateUserId, gstin, financialYear, month },
    attributes: ['invoiceNo', 'invoiceType'],
    raw: true,
  })
  // Returns a Map<invoiceType, Set<invoiceNo>> so duplicates are scoped per type
  const map = new Map()
  for (const r of rows) {
    if (!map.has(r.invoiceType)) map.set(r.invoiceType, new Set())
    map.get(r.invoiceType).add(r.invoiceNo)
  }
  return map
}

exports.getMonthSummary = async (corporateUserId, gstin, financialYear) => {
  const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]
  const results = await Promise.all(
    MONTHS.map(async (m) => {
      const count = await TaxSalesInvoice.count({ where: { corporateUserId, gstin, financialYear, month: m } })
      const missing = await TaxSalesInvoice.count({
        where: {
          corporateUserId, gstin, financialYear, month: m,
          [Op.or]: [{ status: 'missing_fields' }, { hsnCode: null }, { placeOfSupply: null }],
        },
      })
      let status = 'not_started'
      if (count > 0) status = missing > 0 ? 'missing_fields' : 'uploaded'
      return { month: m, invoiceCount: count, status }
    })
  )
  return results
}
