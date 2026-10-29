/* eslint-disable no-unused-vars */
const disableService = require('./../entities/disabledService')
const asyncHandler = require('./../../middlewares/async')
const serviceOperators = require('../entities/serviceOperator')


exports.findOne = asyncHandler(async (params) => {
    let { credentialId, serviceOperatorId } = params
    return await disableService.findOne({
        where: {
            credentialId,
            serviceOperatorId,
            serviceStatus: true
        }
    })
})


exports.findDisableService = asyncHandler(async (params) => {
    let whereClause = {
        credentialId: params.credentialId,
        serviceStatus: true
    }
    return await disableService.findAll({
        include: [{
            model: serviceOperators,
            attributes: ['serviceProvider', 'accessKey']
        }],
        where: whereClause,
        raw: true,
        nest: true,
    })
})