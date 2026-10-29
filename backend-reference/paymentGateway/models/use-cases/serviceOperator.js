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
            attributes: ['vendorName', 'apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'healthUrl','vendorEmail','type','optionals','state','gstNo','address']
        }],
        where: whereClause,
        raw: true,
        nest: true,
    })
})

exports.findOneServiceOperatorForLimits = asyncHandler(async (params) => {
    let whereClause = {
        accessKey: params.accessKey
    }
    if (params.serviceType)
        whereClause["serviceType"] = params.serviceType
    return await serviceOperator.findOne({
        include: [{
            model: vendors,
            attributes: ['apiUrl', 'optional1']
        }],
        where: whereClause,
        attributes: ['id', 'accessKey', 'serviceProvider'],
        raw: true,
        nest: true,
    })
})

exports.findOneById = asyncHandler(async (id) => {
    return await serviceOperator.findOne({
        where: { id },
    })
})