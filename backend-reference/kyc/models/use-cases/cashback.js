/* eslint-disable no-undef */
const cashback = require('./../entities/cashback')
const serviceOperator = require('./../entities/serviceOperator')
const package = require('./../entities/package')
const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async')
exports.create = asyncHandler(async (params) => {
    return await cashback.create(params)
})
exports.update = asyncHandler(async (params, data) => {

    return await cashback.update(data, {
        where: {
            id: params.id
        }
    })

})
exports.findOne = asyncHandler(async (params) => {
    try {
        let { serviceOperatorId, packageId } = params
        return await cashback.findOne({
            where: {
                packageId,
                serviceOperatorId,
                serviceStatus: true,
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CASHBACK FIND ONE ROUTE CALLED")
    }
})
exports.deleteCashback = asyncHandler(async (params) => {
    return await cashback.destroy({
        where: {
            id: params.id
        }
    })
})
exports.findCashbackdata = asyncHandler(async (id) => {
    try {
        return await product.findAll({
            where: {
                categoryId: id
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CATEGORY ASSOCIATED WITH PRODUCT ROUTE CALLED")
    }
})
exports.findAllPackageCashbackCount = asyncHandler(async (params) => {
    let { start, length, searchText, order, column } = params
    let columnNames = [
        'id',
        'serviceOperator.serviceProvider',
        'cashbackType',
        'package.packageName',
        'surcharge',
        'serviceStatus',
        'cashback'
      ];
      
      // Convert column index to column name
      if (column >= 0 && column < columnNames.length) {
        column = columnNames[column];
        console.log("column data and column name is", column)
      } else {
        column = 'createdAt'; // Default column name if invalid index is provided
        console.log("column data", column)
      }
    const data = await cashback.findAndCountAll({
        include: [
            {
                model: serviceOperator,
                attributes: ['serviceProvider'],
                // where: {
                //     serviceProvider: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // },
            },
            {
                model: package,
                // where: {
                //     packageName: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // },
                attributes: ['packageName']
            }
        ],
        where: {
            [Op.or]: [
                //     {
                //     id: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // }, 
                {
                    cashbackType: {
                        [Op.like]: '%' + searchText + '%'
                    }
                },

                {
                    cashback: {
                        [Op.like]: '%' + searchText + '%'
                    }
                },
                {
                    '$serviceOperator.serviceProvider$': {
                        [Op.like]: '%' + searchText + '%'
                    }
                },
                {
                    '$package.packageName$': {
                        [Op.like]: '%' + searchText + '%'
                    }
                }
            ]
        },
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true,
    })
    return data
})

exports.getExcelCSVData = asyncHandler(async () => {
    const data = await cashback.findAndCountAll({
        include: [
            {
                model: serviceOperator, as: '',
                attributes: ['serviceProvider']
            },
            {
                model: package, as: '',
                attributes: ['packageName']
            }
        ],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true
    })

    let finalData = []
    data.rows.forEach(function (limitData) {
        finalData.push({
            //'ID': limitData.id, //hiding id from the excel
            'Service Operator': limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : 'Not Available',
            'Commission Type': limitData.cashbackType ? limitData.cashbackType : 'Not Available',
            'Package Name': limitData.package.packageName ? limitData.package.packageName : 'Not Available',
            'Status': limitData.serviceStatus !== null ? (limitData.serviceStatus ? 'Active' : 'Inactive') : 'Not Available',
            'Cashback': limitData.cashback ? limitData.cashback : 'Not Available',
            'Surcharge': limitData.surcharge ? limitData.surcharge : 'Not Available',
        })
    })
    return finalData
})

