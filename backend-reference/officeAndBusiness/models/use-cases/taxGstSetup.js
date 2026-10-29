const TaxGstSetup = require('../entities/taxGstSetup')

exports.findSetupByUser = async (corporateUserId) => {
  return await TaxGstSetup.findAll({
    where: { corporateUserId, isActive: true },
    order: [['createdAt', 'DESC']],
    raw: true,
  })
}

exports.findActiveSetup = async (corporateUserId, gstin, financialYear) => {
  return await TaxGstSetup.findOne({
    where: { corporateUserId, gstin, financialYear, isActive: true },
    raw: true,
  })
}

exports.createSetup = async (data) => {
  const record = await TaxGstSetup.create(data)
  return record || false
}

exports.updateSetup = async (id, corporateUserId, data) => {
  return await TaxGstSetup.update(data, { where: { id, corporateUserId } })
}
