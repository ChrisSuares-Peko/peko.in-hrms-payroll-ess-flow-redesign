const cashback = require('./../entities/cashback')
const asyncHandler = require('./../../middlewares/async')
const { Op } = require("sequelize");
const { customLog } = require('../../utils/loggerHelper');

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
        customLog(null, "error", { error, message: "Error finding cashback" });
    } finally {
        customLog(null, "info", { message: "Cashback find one route called" });
    }
})