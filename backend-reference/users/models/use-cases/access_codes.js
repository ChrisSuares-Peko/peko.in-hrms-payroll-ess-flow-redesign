const access_codes = require('../entities/access_codes')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async');
const sequelize = require('../../configs/database/index');
const credential = require('../entities/credential');


exports.create = async (params) => {
    let transaction;

    try {
        transaction = await sequelize.transaction();

        const activationKeyData = await access_codes.create(params, {
            transaction
        });

        await transaction.commit();

        if (!activationKeyData) {
            return false;
        }

        return activationKeyData;

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error in create access_code:", error);
        return false;
    }
};

exports.findOne = asyncHandler(async (params) => {
    return await access_codes.findOne({
        where: {
            access_code: params,
            isAssigned: false,
            status: true
        },
        raw: true,
        nest: true,
    })

})
exports.findByGroupId = asyncHandler(async (params) => {
    return await access_codes.findOne({
        where: {
            groupId: params,
            isAssigned: true
        },
        raw: true,
        nest: true,
    })

})

exports.fetchAllPartners = asyncHandler(async (query) => {
    return await credential.findAll({
        where: {
            role: 'PARTNER',
            name: {
                [Op.like]: '%' + query + '%'
            }
        },
        attributes: ['id', 'name']
    })
})

exports.findDuplicate = asyncHandler(async (params) => {
    return await access_codes.findOne({
        where: {
            access_code: params
        },
        raw: true,
        nest: true,
    })

})
exports.findAllAccessCodes = asyncHandler(async () => {

    return await access_codes.findAll({
        where: {
            status: true
        }
    })
})

exports.assignAccessCode = asyncHandler(async (data, params) => {
    return await access_codes.update(data, {
        where: {
            id: params.keyId,
            isAssigned: false
        }
    })
})

exports.updateAccessCodeDetails = async (params, data) => {
    let transaction;

    try {
        transaction = await sequelize.transaction();

        let whereCondition = {
            [Op.and]: [{ id: params.id }]
        };

        await access_codes.update(data, {
            where: whereCondition,
            transaction
        });

        if (params.groupId !== null && params.groupId !== undefined) {
            whereCondition = {
                [Op.and]: [
                    { groupId: params.groupId },
                    { isAssigned: false },
                    { id: { [Op.ne]: params.id } }
                ]
            };

            await access_codes.update(
                {
                    isAssigned: true,
                    status: 0
                },
                {
                    where: whereCondition,
                    transaction
                }
            );
        }

        const response2 = await credential.update(
            {
                registeredBy: data.partnerId
            },
            {
                where: { id: data.credentialId },
                transaction
            }
        );

        await transaction.commit();
        return response2;

    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Error updating access code details:", error);
        return null;
    }
};

exports.updateAccessCode = asyncHandler(async (params, data) => {
    return await access_codes.update(data, {
        where: {
            id: params.id
        }
    })
})
exports.deleteAccessCode = asyncHandler(async (params) => {
    return await access_codes.destroy({
        where: {
            id: params.id
        }
    })
})
exports.findByCorporateUserId = asyncHandler(async (id) => {
    return await access_codes.findOne({
        where: {
            corporateUserId: id
        }
    })
})

exports.findAllAccessCodesAndCount = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column
    } = params
    const sortableColumns = [
        'id',
        'access_code'

    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    return await access_codes.findAndCountAll({
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                access_code: {
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
})

exports.fetchAccessCodes = asyncHandler(async (query) => {
    return await access_codes.findAll({
        where: {
            access_code: {
                [Op.like]: '%' + query + '%'
            },
            status: true
        },
        attributes: ['id', 'access_code']
    })
})

exports.getExcelCSVData = asyncHandler(async () => {

    let data = await access_codes.findAll({
        attributes: ['id', 'access_code'],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true

    })

    let finalData = []
    data.forEach(function (accessCodeData) {
        finalData.push({
            'ID': accessCodeData.id,
            'Access Code': accessCodeData.access_code ? accessCodeData.access_code : 'Not Available'
        })
    })
    return finalData
})

exports.fetchAllAccessCodes = asyncHandler(async () => {

    return await access_codes.findAll({})
})