const disableService = require('./../entities/disabledService')
require("sequelize");
const asyncHandler = require('./../../middlewares/async')

exports.findOne = asyncHandler(async (params) => {
   
    let { serviceOperatorId } = params
    return await disableService.findOne({
        where: {
            serviceOperatorId,
            serviceStatus: true
        }
    })
})
