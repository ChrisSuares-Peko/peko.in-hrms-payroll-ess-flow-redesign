const cashback = require('../entities/cashback')
const { Op } = require("sequelize");
const asyncHandler = require('../../middlewares/async')

exports.findOne = asyncHandler(async (params) => {
    try {
        let { serviceOperatorId, packageIds } = params
        return await cashback.findOne({
            where: {
                packageId: {
                    [Op.in]: packageIds
                },
                serviceOperatorId,
                serviceStatus: true,
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CASHBACK FIND ONE ROUTE CALLED")
    }
})


