const disableService = require('../entities/disabledService')
const asyncHandler = require('../../middlewares/async')
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

exports.isServiceEnabled = async (credentialId, accessKey) => {
    const disabled = await disableService.findOne({
        where: {
            credentialId,
            serviceStatus: true,
        },
        include: [
            {
                model: serviceOperators,
                where: { accessKey },
                attributes: [],
            },
        ],
        raw: true,
    });

    return !disabled;
};