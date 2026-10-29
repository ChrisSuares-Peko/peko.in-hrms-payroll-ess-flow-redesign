const cashback = require('./../entities/cashback')
const serviceOperator = require('./../entities/serviceOperator')

const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async')
exports.create = asyncHandler(async (params) => {
    return await cashback.create(params)
})
exports.update = asyncHandler(async (params, data) => {

    return await cashback.update(data, {
        where: {
            id: params.id
        }
    })

})
exports.findOne = asyncHandler(async (params) => {
    try {
        let { serviceOperatorId, packageIds, accessKey } = params

        const where = {
            packageId: { [Op.in]: packageIds },
            serviceStatus: true,
        }
        if (serviceOperatorId) where.serviceOperatorId = serviceOperatorId

        const queryOptions = {
            where,
            raw: true,
        }

        if (accessKey && !serviceOperatorId) {
            queryOptions.include = [{
                model: serviceOperator,
                attributes: [],
                where: { accessKey },
                required: true,
            }]
            queryOptions.nest = true
        }

        return await cashback.findOne(queryOptions)
    } catch (error) {
        console.log('cashback.findOne error:', error?.message)
    } finally {
        console.log("CASHBACK FIND ONE ROUTE CALLED")
    }
})






