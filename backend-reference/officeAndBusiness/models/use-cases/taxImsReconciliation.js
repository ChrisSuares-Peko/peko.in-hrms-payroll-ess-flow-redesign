const TaxImsReconciliation = require('../entities/taxImsReconciliation')

exports.createReconciliation = async (data) => {
  const record = await TaxImsReconciliation.create(data)
  return record || false
}

exports.updateReconciliation = async (id, corporateUserId, data) => {
  return await TaxImsReconciliation.update(data, { where: { id, corporateUserId } })
}

exports.findReconciliationById = async (id, corporateUserId) => {
  return await TaxImsReconciliation.findOne({ where: { id, corporateUserId }, raw: true })
}

exports.findActiveReconciliation = async (corporateUserId, gstin, financialYear, month) => {
  return await TaxImsReconciliation.findOne({
    where: { corporateUserId, gstin, financialYear, month },
    order: [['createdAt', 'DESC']],
    raw: true,
  })
}
