const activation_keys = require('../entities/activation_keys')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async');
const subscription_plans = require('../entities/subscription_plans');
const products = require('../entities/products');
// const sequelize = require('../../configs/database/index');
const cryptoJSEncryption = require('../../utils/encryptionUtils');

exports.create = asyncHandler(async (params) => {
    const activationKeyData = await activation_keys.create(params)
    if (!activationKeyData) {
        return false;
    }
    return activationKeyData
})

exports.getActivationKeyById = asyncHandler(async (params) => {
    let {
        activation_key
    } = await activation_keys.findByPk(params);
    if (activation_key) {
        activation_key = cryptoJSEncryption.decrypt(activation_key, process.env.CRYPTOJS_ENCRYPTION_KEY)
    }
    return activation_key;
});

exports.findOne = asyncHandler(async (params) => {
    return await activation_keys.findOne({
        where: {
            planId: params,
            isAssigned: false
        },
        raw: true,
        nest: true,
    })
})

exports.findOneByKey = asyncHandler(async (key,id) => {
    return await activation_keys.findOne({
        where: {
            activation_key: key,
            planId: id,
            isAssigned: false
        },
    })
})

exports.findAllActivationKeys = asyncHandler(async () => {
    return await activation_keys.findAll({
        where: {
            status: true
        }
    })

})

exports.assignActivationKey = asyncHandler(async (data, params) => {
    return await activation_keys.update(data, {
        where: {
            id: params.keyId,
            isAssigned: false
        }
    })
})

exports.updateActivationKey = asyncHandler(async (params, data) => {
    return await activation_keys.update(data, {
        where: {
            id: params.id
        }
    })
})

exports.fetchAllPlans = async () => {
    try {
        return await subscription_plans.findAll({
            include: [{
                model: products,
                attributes: ['id', 'name']
            }],
            where: {
                status: true
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PRODUCTS FIND ALL ROUTE CALLED")
    }
}

exports.deleteActivationKey = asyncHandler(async (params) => {
    return await activation_keys.destroy({
        where: {
            id: params.id
        }
    })
})

exports.findAllActivationKeysAndCount = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column
    } = params
    const sortableColumns = [
        'id',
        'activation_key'

    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    const activationData = await activation_keys.findAndCountAll({
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                activation_key: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        },
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true
    })
    activationData.rows.forEach(rows => {
        let decryptedActivationKey = cryptoJSEncryption.decrypt(rows.activation_key, process.env.CRYPTOJS_ENCRYPTION_KEY);
        let maskedActivationKey;

        if (decryptedActivationKey.length <= 4) {
            const firstChar = decryptedActivationKey.charAt(0);
            maskedActivationKey = firstChar + '#'.repeat(Math.max(decryptedActivationKey.length - 1, 0));
        } else {
            const firstTwo = decryptedActivationKey.substring(0, 2);
            const lastTwo = decryptedActivationKey.slice(-2);
            //maskedActivationKey = firstTwo + '#'.repeat(Math.max(decryptedActivationKey.length - 4 - firstTwo.length - lastTwo.length, 0)) + lastTwo;
            const middleCharsCount = Math.max(decryptedActivationKey.length - 4 - firstTwo.length - lastTwo.length, 0);
            maskedActivationKey = firstTwo + '#'.repeat(middleCharsCount) + lastTwo;
        }
        rows.activation_key = maskedActivationKey;
    });
    return activationData
})

exports.fetchActivationKeys = asyncHandler(async (query) => {
    return await activation_keys.findAll({
        where: {
            activation_key: {
                [Op.like]: '%' + query + '%'
            },
            status: true
        },
        attributes: ['id', 'activation_key']
    })
})

exports.getExcelCSVData = asyncHandler(async () => {
    let data = await activation_keys.findAll({
        attributes: ['id', 'activation_key', 'planId'],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true
    })

    let finalData = []
    data.forEach(function (activationData) {
        activationData.activation_key = cryptoJSEncryption.decrypt(activationData.activation_key, process.env.CRYPTOJS_ENCRYPTION_KEY)

        finalData.push({
            'ID': activationData.id,
            'Activation Key': activationData.activation_key ? activationData.activation_key : 'Not Available'
        })
    })
    return finalData
})

exports.checkActivationKeyExists= asyncHandler(async (planId) => {
    const activationKey = await activation_keys.findOne({
        where: {
            planId: planId,
            isAssigned: false
        }
    });
    return !!activationKey; // Return true if an activation key exists, false otherwise
})