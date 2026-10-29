/* eslint-disable no-unused-vars */
const package = require('./../entities/package')
// const sequelize = require('sequelize')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const cashback = require('../entities/cashback');

exports.createPackage = asyncHandler(async (params) => {
    try {
        return await package.create(params)
    } catch (error) {
        console.log(error.message)
    } finally {
        console.log("PACKAGE CREATE ROUTE CALLED")
    }
});

exports.updatePackage = asyncHandler(async (req, res) => {
    const params = req.params;
    const data = req.body;
    return await package.update(data, {
        where: {
            id: params.id
        }
    })
});

exports.findOnePackage = asyncHandler(async (params) => {
    try {
        let {
            id
        } = params
        return await package.findOne({
            where: {
                id
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PACKAGE FIND ONE ROUTE CALLED")
    }
})

exports.findPackageCashback = asyncHandler(async (id) => {
    try {
        return await cashback.findAll({
            where: {
                packageId: id
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PACKAGE ASSOCIATED WITH CASHBACK ROUTE CALLED")
    }
})


exports.findAllPackage = asyncHandler(async () => {
    try {
        return await package.findAll({
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("PACKAGE FIND All ROUTE CALLED")
    }
});

exports.deletePackage = async (params) => {
    try {

        return await package.destroy({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("PAKAGE DELETE ROUTE CALLED")
    }
}
exports.updatePackageStatus = asyncHandler(async (req, res) => {
    const params = req.params;
    const data = req.body;
    return await package.update(data, {
        where: {
            id: params.id
        }
    })
});

exports.findAllPackagesCount = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column
    } = params
    const sortableColumns = [
        'id',
        'packageName',
        'packagePrice',
        'description',
        'status',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }

    const data = await package.findAndCountAll({
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                packageName: {
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
        nest: true,
    })
    return data
})
exports.getExcelCSVData = asyncHandler(async () => {

    const data = await package.findAndCountAll({
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true
    })

    let finalData = []
    data.rows.forEach(function (packageData) {
        finalData.push({
            'ID': packageData.id,
            'Package Name': packageData.packageName ? packageData.packageName : 'Not Available',
            'Package Price': packageData.packagePrice ? parseFloat(packageData.packagePrice).toFixed(2) + 'INR' : 'Not Available',
            'Package Description': packageData.description ? packageData.description : 'Not Available',
            'Status': packageData.status ? packageData.status : 'Not Available'
        })
    })
    return finalData
})