const serviceOperator = require('./../entities/serviceOperator')
const vendors = require('./../entities/vendor')
const asyncHandler = require('./../../middlewares/async')

exports.findOne = asyncHandler(async (params) => {
    let whereClause = {
        accessKey: params.accessKey
    }
    if (params.serviceType)
        whereClause["serviceType"] = params.serviceType
    return await serviceOperator.findOne({
        include: [{
            model: vendors,
            attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5','optional6', 'vendorEmail', 'vendorName', 'type','healthUrl','state','gstNo','address']
        }],
        where: whereClause,
        raw: true,
        nest: true,
    })
})