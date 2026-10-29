const beneficiary = require('./../entities/beneficiary')
const disableServices = require('./../entities/disabledService');
const serviceOperator = require('./../entities/serviceOperator')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async')
const serviceOperators = require('./../entities/serviceOperator');
const operatorsData = require('../../utils/operatorsData.json');

const { accessKey } = operatorsData.prepaid;

function areCustomerParamsEqual(params1 = [], params2 = []) {
    if (!params1 || !params2) return false;
    if (!Array.isArray(params1) || !Array.isArray(params2)) return false;
    if (!params1.length || !params2.length) return false;

    const sorted1 = [...params1].sort((a, b) => (a.name > b.name ? 1 : -1));
    const sorted2 = [...params2].sort((a, b) => (a.name > b.name ? 1 : -1));

    if (sorted1.length !== sorted2.length) return false;

    return sorted1.every((p, i) => p.name === sorted2[i].name && p.value === sorted2[i].value);
}

const createBeneficiary = async (params) => {
    try {
        const whereCondition = {
            accessKey: params.accessKey,
            credentialId: params.credentialId,
        };

        const existingBeneficiaries = await beneficiary.findAll({ where: whereCondition });

        if (params.accessKey !== accessKey) {
            if (existingBeneficiaries && existingBeneficiaries.length > 0) {
                const duplicate = existingBeneficiaries.find(existing => {
                    return areCustomerParamsEqual(params.customerParams, existing.customerParams);
                });
                if (duplicate) {
                    return {
                        error: `This beneficiary is already added. Please add another beneficiary.`
                    };
                }
            }
        } else {
            // For JRI_prepaid, check phoneNo
            if (existingBeneficiaries && existingBeneficiaries.length > 0) {
                const duplicate = existingBeneficiaries.find(existing => {
                    return existing.phoneNo === params.phoneNo;
                });
                if (duplicate) {
                    return {
                        error: `This beneficiary is already added. Please add another beneficiary.`
                    };
                }
            }
        }
            
        const serviceOperator = await serviceOperators.findOne({
            where: {
                accessKey: params.accessKey
            }
        });

        if (!serviceOperator) {
            return {
                error: `Service Operator not found for accessKey: ${params.accessKey}`
            };
        }

        // Add serviceOperatorId to params
        params.serviceOperatorId = serviceOperator.id;

        const details = await beneficiary.create(params)
        return details
    } catch (error) {
        console.log("ERROR BLOCK - ", error.message);
        return {
            error: `Something went wrong`
        }
    } finally {
        console.log("BENEFICIARY CREATE ROUTE CALLED")
    }
}

const findAllBeneficiary = async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        status,
        column,
        credentialId
    } = params;
    const sortableColumns = [
        'name',
        'accountNo',
        'accessKey'
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = 'createdAt';
    }
    let disable = await disableServices.findAll({
        include: [{
            model: serviceOperator,
            attributes: ['accessKey']
        }],
        where: {
            serviceStatus: false
        },
        order: [
            ['createdAt', 'DESC']
        ],
        attributes: ['serviceOperatorId'],
        raw: true,
        nest: true
    });
    const disableService = disable.map((dt) => dt.serviceOperator.accessKey);

    const where = {
        credentialId: credentialId,
    };
    if (status === '1' || status === '0') {
        where.isActive = status;
    }
    where[Op.and] = [
        {
            [Op.or]: [
                {
                    id: {
                        [Op.like]: '%' + searchText + '%'
                    }
                },
                {
                    name: {
                        [Op.like]: '%' + searchText + '%'
                    }
                },
                {
                    accountNo: {
                        [Op.like]: '%' + searchText + '%'
                    }
                },
                {
                    accessKey: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }
            ]
        },
        {
            accessKey: {
                [Op.notIn]: disableService
            }
        }
    ];

    return await beneficiary.findAndCountAll({
        where: where,
        order: [
            [column, order]
        ],
        limit: length,
        offset: start
    });
};

const updateBeneficiary = async (params, data) => {
    try {
        return await beneficiary.update(data, {
            where: {
                id: params.id,
                credentialId: params.credentialId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("BENEFICIARY UPDATE ROUTE CALLED")
    }
}


const Delete = asyncHandler(async (params) => {
    return await beneficiary.destroy({
        where: {
            id: params.id,
            credentialId: params.credentialId
        }
    })
})
const fetchBeneficiaries = async (details, credentialId) => {
    try {
        return await beneficiary.findAll({
            where: {
                accessKey: details.accessKey,
                credentialId: credentialId
            },
            include: [
                {
                    model: serviceOperators,
                }
            ],
            // attributes: ['name']
        })
    } catch (error) {
        console.log(error)
        console.log(error.message.message)
    } finally {
        console.log("FETCH BENEFICIARY  ROUTE CALLED")
    }
}

const fetchRecentBeneficiaries = async (credentialId, includedAccessKeys) => {
    try {
        return await beneficiary.findAll({
            where: {
                accessKey: {
                    [Op.in]: includedAccessKeys,
                },

                credentialId: credentialId
            },
            limit: 5, 
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: serviceOperators,
                }
            ],
        })
    } catch (error) {
        console.log(error)
        console.log(error.message.message)
    } finally {
        console.log("FETCH BENEFICIARY  ROUTE CALLED")
    }
}

const fetchLastBeneficiaries = async (id) => {
    try {
        return await beneficiary.findAll({
            where: {
                credentialId: id
            },
            include: [{
                model: serviceOperators,
                attributes: ['serviceProvider', 'serviceImage']
            }],
            order: [['createdAt', 'DESC']],
            limit: 5
        });
    } catch (error) {
        console.log(error)
        console.log(error.message.message)
    } finally {
        console.log("FETCH BENEFICIARY  ROUTE CALLED")
    }
}


module.exports = {
    createBeneficiary,
    findAllBeneficiary,
    updateBeneficiary,
    Delete,
    fetchBeneficiaries,
    fetchRecentBeneficiaries,
    fetchLastBeneficiaries
}