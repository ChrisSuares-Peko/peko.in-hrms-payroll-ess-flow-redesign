const vendor = require('./../entities/vendor')
// const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
// const moment = require('moment')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const { handleSortFields } = require('../../utils/sortHandle');
const { formattedDateTime } = require('../../utils/formatter');

exports.create = asyncHandler(async (params) => {
    const vendors = await vendor.create(params)
    return vendors
})

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

exports.findAllVendor = async () => {
    try {
        return await vendor.findAll({
            where: {
                isActive: true
            },
            attributes: ['vendorName', 'type']
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("VENDOR FIND ALL ROUTE CALLED")
    }
}

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

exports.findAllVendors = asyncHandler(async (params, type) => {
    try{
        let {
            limit,
            offset,
            searchText,
            sort,
            sortField
        } = params
        let order = handleSortFields(sortField,sort)
     
        const whereCondition = {
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
                },
            },{
                type: {
                    [Op.like]: '%' + searchText + '%'
                },
            }]
        }
        if (type) {
            whereCondition.type = type;
        }
        return await vendor.findAndCountAll({
            where: whereCondition,
            order: order,
            limit,
            offset
        })
    } catch (error) {
      console.log(error);
      throw  {message:'Something went wrong'};
    }
})

exports.vendorAndCountExport = asyncHandler(async (params, type) => {
    try{
        let {
            searchText,
            sort,
            sortField
        } = params
        let order = handleSortFields(sortField,sort)
     
        const whereCondition = {
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
            },{
                type: {
                    [Op.like]: '%' + searchText + '%'
                },
            }]
        }
        if (type) {
            whereCondition.type = type;
        }
        const data = await vendor.findAndCountAll({
            where: whereCondition,
            order: order,
        })
        let finalData = []
        data.rows.forEach(function (limitData) {
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Vendor Name": limitData.vendorName ? limitData.vendorName : "Not Available",
                "API URL": limitData.apiUrl ? limitData.apiUrl : "Not Available",
                "Health URL": limitData.healthUrl ? limitData.healthUrl : "Not Available",
                Type: limitData.type ? limitData.type : "Not Available",
                Status: limitData.isActive ? "Active"  : "In Active",
            })
        })
        return finalData
    } catch (error) {
      console.log(error);
      throw  {message:'Something went wrong'};
    }
})

exports.fetchVendorDetails = asyncHandler(async (query, type, vendors) => {
    const whereCondition = {
        vendorName: {
            [Op.like]: '%' + query + '%'
        }
    };

    if (type) {
        whereCondition.type = type;
    }

    if (vendors && vendors.length > 0) {
        whereCondition.id = {
            [Op.in]: vendors
        };
    }

    return await vendor.findAll({
        where: whereCondition,
        attributes: ['id', 'vendorName']
    });
});


exports.fetchVendorData = asyncHandler(async (type) => {
    console.log(type)
    return await vendor.findAll({
        where: {
            type: type
        },
        attributes: ['id', 'vendorName']
    })
})

exports.updateStatus = asyncHandler(async (req) => {
    const params = req.params;
    const data = req.body;
    return await vendor.update(data, {
        where: {
            id: params.id
        }
    })
});

exports.getExcelCSVData = asyncHandler(async () => {
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
            'Vendor Status': limitData.isActive !== null ? (limitData.isActive ? 'Active' : 'Inactive') : 'Not Available',
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

exports.findVendorByName = async (vendorName) => {
    try {
        return await vendor.findOne({
            where: {
                vendorName: vendorName
            },
            raw: true,
        })
    } catch (error) {
        return false
    }
}