const TaxImsSaveHistory = require('../entities/taxImsSaveHistory')

exports.createSaveHistoryRecord = async (data) => {
    return await TaxImsSaveHistory.create(data)
}

exports.findSaveHistory = async (corporateUserId, reconciliationId) => {
    return await TaxImsSaveHistory.findAll({
        where: { corporateUserId, reconciliationId },
        order: [['createdAt', 'DESC']],
        raw: true,
    })
}
