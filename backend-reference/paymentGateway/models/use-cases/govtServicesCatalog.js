'use strict'

const govtServicesCatalog = require('../entities/govtServicesCatalog')
const { applyCommissionMarkup } = require('../../utils/applyCommissionMarkup')

exports.findByVendorKey = async (vendorCatalogId, credentialId = null, markUp = true) => {
  const catalogRow = await govtServicesCatalog.findOne({ where: { vendorCatalogId } })
  if (markUp) await applyCommissionMarkup(catalogRow, ['amount', 'price'], credentialId)
  return catalogRow
}
