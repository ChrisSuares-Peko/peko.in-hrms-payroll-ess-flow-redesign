const serviceOperator = require('./../entities/serviceOperator')
const vendors = require('./../entities/vendor')
// const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
let sequelizeConfig = require('../../configs/database/index');
// const moment = require('moment')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async')

exports.create = asyncHandler(async (params) => {
    const serviceOperators = await serviceOperator.create(params)
    return serviceOperators
})

exports.findOne = asyncHandler(async (params) => {
    let whereClause = {
        accessKey: params.accessKey
    }
    if (params.serviceType)
        whereClause["serviceType"] = params.serviceType
    return await serviceOperator.findOne({
        include: [{
            model: vendors,
            attributes: ['apiUrl', 'healthUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5', 'optional6', 'optionals','vendorName','vendorEmail','state','gstNo','address']
        }],
        where: whereClause,
        raw: true,
        nest: true,
    })
})

exports.findOneServiceOperatorForLimits = asyncHandler(async (params) => {
    let whereClause = {
        accessKey: params.accessKey
    }
    if (params.serviceType)
        whereClause["serviceType"] = params.serviceType
    return await serviceOperator.findOne({
        include: [{
            model: vendors,
            as: '',
            attributes: ['apiUrl', 'optional1']
        }],
        where: whereClause,
        attributes: ['id', 'accessKey', 'serviceProvider'],
        raw: true,
        nest: true,
    })
})

exports.findAllServiceOperator = asyncHandler(async () => {
    return await serviceOperator.findAll({
        where: {
            serviceStatus: true
        }
    })
})

exports.updateServiceOperator = asyncHandler(async (params, data) => {
    return await serviceOperator.update(data, {
        where: {
            id: params.id
        }
    })
})

exports.Delete = asyncHandler(async (params) => {
    return await serviceOperator.destroy({
        where: {
            serviceId: params.serviceId
        }
    })
})

exports.updateStatus = asyncHandler(async (req) => {
    const params = req.params;
    const data = req.body;
    return await serviceOperator.update(data, {
        where: {
            id: params.id
        }
    })
});

exports.findAllServiceOperatorCount = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column
    } = params
    let columnNames = [
        "serviceProvider",
        "accessKey",
        "serviceCategory",
        "commissionType",
        "providerCommission",
        "vendor.vendorName",
        'serviceStatus',
    ];
    // Convert column index to column name
    if (column >= 0 && column < columnNames.length) {
        column = columnNames[column];
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    return await serviceOperator.findAndCountAll({
        include: [{
            model: vendors,
            as: '',
            attributes: ['vendorName', 'apiUrl', ['optional1', 'token']]
        }],
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                serviceProvider: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                accessKey: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                serviceStatus: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                providerCommission: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                serviceImage: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                serviceCategory: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                remarks: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                countryName: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                countryCode: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                balanceMethod: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                commissionType: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        },
        order: [
            [column, order]
        ],
        limit: length,
        offset: start
    })
})

exports.fetchServiceOperator = asyncHandler(async (query) => {
    return await serviceOperator.findAll({
        where: {
            serviceProvider: {
                [Op.like]: '%' + query + '%'
            },
            serviceStatus: true
        },
        attributes: ['id', 'serviceProvider']
    })
})

exports.getExcelCSVData = asyncHandler(async () => {
    let data = await serviceOperator.findAll({
        include: [{
            model: vendors,
            as: "",
            attributes: ['vendorName']
        }],
        attributes: ['id', 'serviceProvider', 'accessKey', 'serviceStatus', 'providerCommission', 'serviceImage',
            'serviceCategory', 'remarks', 'countryName', 'countryCode', 'balanceMethod', 'commissionType', 'serviceType',
        ],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true
    })

    let finalData = []
    data.forEach(function (limitData) {
        console.log("limited data", limitData)
        finalData.push({
            'ID': limitData.id,
            'Service Provider Name': limitData.serviceProvider ? limitData.serviceProvider : 'Not Available',
            'Access Key': limitData.accessKey ? limitData.accessKey : 'Not Available',
            'Status': limitData.serviceStatus !== null ? (limitData.serviceStatus ? 'Active' : 'Inactive') : 'Not AVailable',
            'Provider Commission': limitData.providerCommission ? limitData.providerCommission : 'Not AVailable',
            'Service Image': limitData.serviceImage ? limitData.serviceImage : 'Not Available',
            'Service Category': limitData.serviceCategory ? limitData.serviceCategory : 'Not Available',
            'Vendor Name': limitData.vendor.vendorName ? limitData.vendor.vendorName : 'Not Available',
            'Country Name': limitData.countryName ? limitData.countryName : 'Not Available',
            'Country Code': limitData.countryCode ? limitData.countryCode : 'Not Available',
            'Balance Method': limitData.balanceMethod !== null ? (limitData.balanceMethod ? 'Yes' : 'No') : 'Not AVailable',
            'Commission Type': limitData.commissionType ? limitData.commissionType : 'Not Available',
            'Service Type': limitData.serviceType === '1' ? 'Bill Payment' : limitData.serviceType === '2' ? 'Topup' : limitData.serviceType === '3' ? 'Other' : 'Not Available'
        })
    })
    return finalData
})

exports.find = asyncHandler(async (params) => {
    return await serviceOperator.findOne({
        where: {
            [Op.or]: [
                { serviceProvider: params.serviceProvider },
                { accessKey: params.accessKey },
            ],
        },
        raw: true,
    })
})

exports.findLastFiveTransactions = asyncHandler(async (params) => {
    const {
        userId,
        length,
        serviceProvider,
        status,
        orderCol,
        order
    } = params;

    const replacements = { userId, length, serviceProvider, status };

    let totalCountQuery = `
        SELECT COUNT(*)
        FROM reportAll
        WHERE credentialId = :userId
          AND serviceProvider = :serviceProvider
          AND status IN (:status)
    `;

    let query = `
        SELECT *,
            IFNULL((${totalCountQuery}), 0) AS totalCount
        FROM reportAll AS ra
        WHERE ra.credentialId = :userId
          AND ra.serviceProvider = :serviceProvider
          AND ra.status IN (:status)
    `;

    query += `
        ORDER BY ${orderCol} ${order}
        LIMIT :length
    `;

    const results = await sequelizeConfig.query(query, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements
    });
    return results;
})


exports.findAllServiceOperatorOnCategory = asyncHandler(async (serviceCategory) => {
    return await serviceOperator.findAll({
        where: {
            serviceCategory
        }
    })
})

exports.findServiceOperatorOnAccesskey = asyncHandler(async (accessKey) => {
    return await serviceOperator.findOne({
        where: {
            accessKey
        }
    })
})

exports.fetchServiceDetailsByOperatorId = async (serviceOperatorId) => {
    try {
      const serviceDetails = await serviceOperator.findOne({
        where: {
          id: serviceOperatorId,
          status: true,
        },
        attributes: [
          "id",
          "name",
          "accessKey",
          "vendor",
          "commissionType",
          "cashbackType",
          "providerCommission",
          "cashback",
          "surcharge",
          "surchargeType"
        ],
        raw: true
      });
  
      if (!serviceDetails) {
        return { error: "SERVICE_NOT_FOUND" };
      }
  
      // vendor column is usually JSON
      if (typeof serviceDetails.vendor === "string") {
        serviceDetails.vendor = JSON.parse(serviceDetails.vendor);
      }
  
      return serviceDetails;
  
    } catch (error) {
      console.log("Error in fetchServiceDetailsByOperatorId:", error);
      return { error: "INTERNAL_ERROR" };
    }
  };