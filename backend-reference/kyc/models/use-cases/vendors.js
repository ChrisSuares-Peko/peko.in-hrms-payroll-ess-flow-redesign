/* eslint-disable no-unused-vars */
const vendor = require('./../entities/vendor')
const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async')

exports.create = async (params) => {
    let transaction;
  
    try {
      transaction = await sequelize.transaction();
  
      const vendors = await vendor.create(params, { transaction });
  
      await transaction.commit();
      return vendors;
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error creating vendor:", error);
      return false;
    }
};
  
exports.findOne = asyncHandler(async (params) => {
    return await vendor.findOne({
        where: {
            vendorCode: params.vendorCode
        }
    })
})

exports.find = asyncHandler(async (vendorName) => {
    return await vendor.findOne({
        where: {
            vendorName: vendorName
        }
    })
})

/*const findAllVendor = async (params) => {
    try {
        return await vendor.findAll({
            where: {
                vendorCode: params.vendorCode
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("VENDOR FIND ALL ROUTE CALLED")
    }
}*/

exports.update = asyncHandler(async (params, data) => {
    return await vendor.update(data, {
        where: {
            id: params.id
        }
    })
})

exports.Delete = asyncHandler(async (params) => {
    return await vendor.destroy({
        where: {
            vendorCode: params.vendorCode
        }
    })
})
exports.findAllVendors = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column
    } = params
    const sortableColumns = [
        'id',
        'vendorName',
        'isActive',
        'apiUrl',
        'healthUrl',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    return await vendor.findAndCountAll({
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                vendorName: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                apiUrl: {
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
exports.fetchVendorDetails = asyncHandler(async (query, res) => {
    return await vendor.findAll({
        where: {
            vendorName: {
                [Op.like]: '%' + query + '%'
            }
        },
        attributes: ['id', 'vendorName']
    })
})
exports.fetchVendorData = asyncHandler(async (type, res) => {
    console.log(type)
    return await vendor.findAll({
        where: {
            type: type
        },
        attributes: ['id', 'vendorName']
    })
})

exports.updateStatus = asyncHandler(async (req, res, next) => {
    const params = req.params;
    const data = req.body;
    return await vendor.update(data, {
        where: {
            id: params.id
        }
    })
});
 
exports.getExcelCSVData = asyncHandler(async (params) => {
    let data = await vendor.findAll({
        attributes: ['Id', 'vendorName', 'isActive', 'apiUrl', 'healthUrl', 'optional1',
            'isBillPaymentAvailable', 'isTopUpAvailable', 'currency'
        ],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true

    })

    let finalData = []
    data.forEach(function (limitData) {
        finalData.push({
            'Vendor Code': limitData.Id,
            'Vendor Name': limitData.vendorName && limitData.vendorName != null ? limitData.vendorName : 'Not Available',
            'Vendor Status': limitData.isActive !== null?(limitData.isActive?'Active':'Inactive'):'Not Available',
            'Api Url': limitData.apiUrl ? limitData.apiUrl.toUpperCase() : 'Not Available',
            'Health URL': limitData.healthUrl ? limitData.healthUrl : 'Not Available',
            // 'Optional1': limitData.optional1,
            // 'Is Bill Payment Available': limitData.isBillPaymentAvailable,
            // 'Is Top Up Available': limitData.isTopUpAvailable,
            // 'Currency': limitData.currency,

        })
    })
    return finalData
})