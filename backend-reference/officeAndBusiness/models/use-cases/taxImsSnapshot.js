const TaxImsSnapshot = require('../entities/taxImsSnapshot')
const { TAX_IMS_REF_ID_CHARS } = require('../../utils/constants')

function generateRefId() {
    const chars = TAX_IMS_REF_ID_CHARS
    let id = 'IMS-'
    for (let i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length))
    return id
}

exports.createSnapshot = async (data) => {
    return await TaxImsSnapshot.create({ ...data, refId: generateRefId() })
}

exports.findSnapshots = async (corporateUserId, gstin, financialYear, month) => {
    return await TaxImsSnapshot.findAll({
        where: { corporateUserId, gstin, financialYear, month },
        order: [['createdAt', 'DESC']],
        raw: true,
    })
}
