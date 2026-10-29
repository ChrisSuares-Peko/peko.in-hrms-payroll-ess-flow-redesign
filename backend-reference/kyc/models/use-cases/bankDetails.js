const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const bankDetails = require('./../entities/bankDetails');

exports.createAccount = asyncHandler(async (params) => {
    if (params.default) {
        await bankDetails.update(
            { default: false },
            {
                where: {
                    credentialId: params.credentialId,
                },
            }
        );
    }
    return await bankDetails.create(params);
})

exports.findOneBankAccount = asyncHandler(async (params) => {
    return await bankDetails.findOne({
        where: {
            credentialId: params.id,
        },
        nest: true,
        raw: true
    })
})
exports.findBankAccountByAccountOrIBAN = asyncHandler(async (accountNumber, iban, selectedId) => {
    const bankAccount = await bankDetails.findOne({
        where: {
            [Op.and]: [
                {
                    [Op.or]: [
                        { accountNumber: accountNumber },
                        { iban: iban }
                    ]
                },
                {
                    id: {
                        [Op.not]: selectedId
                    }
                }
            ]
        },
        nest: true,
        raw: true
    });
    return bankAccount;
});


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