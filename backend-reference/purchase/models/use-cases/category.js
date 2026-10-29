const category = require('./../entities/category')
const vendors = require('./../entities/vendor')
// const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
// const moment = require('moment')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async')

exports.create = asyncHandler(async (params) => {
    const categories = await category.create(params)
    return categories
})

exports.findOne = asyncHandler(async (params) => {
    return await category.findOne({
        // include: [{
        //     model: vendors,
        //     as: '',
        //     attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4']
        // }],
        where: {
            id: params.id
        },
        raw: true,
        nest: true,
    })
})

exports.findAllCategory = asyncHandler(async () => {
    return await category.findAll()
})

exports.updateCategory = asyncHandler(async (params, data) => {
    return await category.update(data, {
        where: {
            id: params.id
        }
    })
})

exports.deleteCategory = async (params) => {
    try {
        return await category.destroy({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("CATEGORY DELETE ROUTE CALLED")
    }
}

exports.findAllCategoryCount = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column
    } = params
    return await category.findAndCountAll({
        include: [{
            model: vendors,
            as: '',
            attributes: ['vendorName']
        }],
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                categoryName: {
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

exports.fetchCategory = asyncHandler(async (query) => {
    return await category.findAll({
        where: {
            categoryName: {
                [Op.like]: '%' + query + '%'
            }
        },
        attributes: ['id', 'categoryName']
    })
})

exports.getExcelCSVData = asyncHandler(async () => {
    let data = await category.findAll({
        attributes: ['id', 'categoryName', 'categoryImage', 'categoryStatus'],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true
    })

    let finalData = []
    data.forEach(function (limitData) {
        finalData.push({
            'ID': limitData.id,
            'Category Name': limitData.categoryName ? limitData.categoryName : 'Not Available',
            'Category Status': limitData.categoryStatus ? limitData.categoryStatus : 'Not AVailable',
            'Category Image': limitData.categoryImage ? limitData.categoryImage : 'Not Available',
        })
    })
    return finalData
})

exports.find = asyncHandler(async (params) => {
    return await category.findOne({
        where: {
            id: params.id
        },
        raw: true,
    })
})

exports.findCategoryByName = async (categoryName) => {
    try {
        return await category.findOne({
            where: {
                categoryName: categoryName
            },
            raw: true,
        })
    } catch (error) {
        return false
    }
}