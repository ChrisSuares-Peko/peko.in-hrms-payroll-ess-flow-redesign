const cashback = require('./../entities/cashback')
const serviceOperator = require('./../entities/serviceOperator')
const packageModel = require('./../entities/package')
// const sequelize = require('sequelize')
// const moment = require('moment')
const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');

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
        let { serviceOperatorId, packageIds } = params
        return await cashback.findOne({
            where: {
                packageId: {
                    [Op.in]: packageIds
                },
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


exports.getExcelCSVData = asyncHandler(async () => {
    const data = await cashback.findAndCountAll({
        include: [
            {
                model: serviceOperator, as: '',
                attributes: ['serviceProvider']
            },
            {
                model: packageModel, as: '',
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