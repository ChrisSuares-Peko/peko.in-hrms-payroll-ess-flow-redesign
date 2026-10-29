require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const bankDetails = require('./../entities/bankDetails');


exports.updateBank = asyncHandler(async (data) => {
    if (data.default) {
        await bankDetails.update(
            { default: false },
            {
                where: {
                    credentialId: data.credentialId,
                },
            }
        );
    }
    return await bankDetails.update(data, {
        where: {
            id: data.id,
            credentialId: data.credentialId,
        },
    })
})

exports.findAllBankAccount = asyncHandler(async (params) => {
    return await bankDetails.findAll({
        where: {
            credentialId: params.id,
        },
        nest: true,
        raw: true
    })
})

exports.findDefaultBankAccount = asyncHandler(async (params) => {
    return await bankDetails.findOne({
        where: {
            credentialId: params.id,
            default: true,
            status: true
        },
        nest: true,
        raw: true
    })
})