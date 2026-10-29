const beneficiary = require('./../entities/beneficiary')
const disableServices = require('./../entities/disabledService');
const serviceOperator = require('./../entities/serviceOperator')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async')
const createBeneficiary = async (params) => {
    try {
        const isExists = await beneficiary.findOne({
            where: {
                billerId: params.billerId,
                accessKey: params.accessKey,
                credentialId: params.credentialId,
            }
        })
        if (isExists) {
            return {
                error: `This beneficiary is already added. Please add another beneficiary.`
            }
        }
        const details = await beneficiary.create(params)
        return details
    } catch (error) {
        console.log("ERROR BLOCK - ", error.message);
    } finally {
        console.log("BENEFICIARY CREATE ROUTE CALLED")
    }
}

const findOneBeneficiary = async (params) => {
    try {
        return await beneficiary.findOne({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("BENEFICIARY FIND ONE ROUTE CALLED")
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
        console.log("column selected", column)
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
    console.log("disabled services", disable);
    const disableService = disable.map((dt) => dt.serviceOperator.accessKey);
    console.log("salmaaaan", disableService);

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
                id: params.id
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("BENEFICIARY UPDATE ROUTE CALLED")
    }
}

/*const deleteBeneficiary = async (id) => {
    try {
        return await beneficiary.destroy({
            where: {
                id
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("BENEFICIARY DELETE ROUTE CALLED")
    }
}*/

const Delete = asyncHandler(async (params) => {
    return await beneficiary.destroy({
        where: {
            id: params.id
        }
    })
})
const fetchBeneficiaries = async (details) => {
    try {
        return await beneficiary.findAll({
            where: {
                accessKey: details.accessKey,
                credentialId: details.credentialId
            }
            // attributes: ['name']
        })
    } catch (error) {
        console.log(error)
        console.log(error.message.message)
    } finally {
        console.log("FETCH BENEFICIARY  ROUTE CALLED")
    }
}
const getExcelCSVData = async (params) => {
    let data = await beneficiary.findAll({
        where: {
            credentialId: params.credentialId
        },
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true
    })

    let finalData = []
    data.forEach(function (beneficiaryData) {
        finalData.push({
            'ID': beneficiaryData.id,
            'Beneficiary Name': beneficiaryData.name ? beneficiaryData.name : 'Not Available',
            'Account Number': beneficiaryData.accountNo ? beneficiaryData.accountNo : 'Not Available',
            'Access Key': beneficiaryData.accessKey ? beneficiaryData.accessKey : 'Not AVailable',
            'Status': beneficiaryData.isActive == true ? 'Active' : 'Inactive'
        })
    })
    return finalData

}
module.exports = {
    createBeneficiary,
    findOneBeneficiary,
    findAllBeneficiary,
    updateBeneficiary,
    Delete,
    getExcelCSVData,
    fetchBeneficiaries
}