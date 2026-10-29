/* eslint-disable no-prototype-builtins */
const plans = require('../entities/plans')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async');
const { uploadFile } = require('../../utils/commonUploadFile');


exports.create = asyncHandler(async (params) => {
    if (params.hasOwnProperty('logo') && params.logoFormat) {
        const publicUrl = await uploadFile(params.logo, 'planLogo', params.logoFormat);
        params.logo = publicUrl;
    }
    const plan = await plans.create(params)
    console.log("data in the user case-------", plan)
    if (!plan) {
        return false;
    }
    return plan
})

exports.findOne = asyncHandler(async (params) => {
    return await plans.findOne({
        where: {
            id: params.id
        },
        raw: true,
        nest: true,
    })

})
exports.findAllPlans = asyncHandler(async () => {

    return await plans.findAll({
        where: {
            status: true
        }
    })
})

exports.updatePlan = asyncHandler(async (params, data) => {
    if (data.hasOwnProperty('logo') && data.logoFormat) {
        const publicUrl = await uploadFile(data.logo, 'planLogo', data.logoFormat);
        data.logo = publicUrl;
    }
    console.log(`params in use case ----${JSON.stringify(params)} and data in the use case ${JSON.stringify(data)}`)
    return await plans.update(data, {
        where: {
            id: params.id
        }
    })
})

exports.deletePlan = asyncHandler(async (params) => {
    return await plans.destroy({
        where: {
            id: params.id
        }
    })
})

exports.findAllPlansAndCount = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column
    } = params
    const sortableColumns = [
        'name',
        'price',
        'description',
        'highlights',
        'logo',
        'status',

    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    return await plans.findAndCountAll({
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                name: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                price: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                description: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                highlights: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                billingCycle: {
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

exports.fetchPlans = asyncHandler(async (query) => {

    return await plans.findAll({
        where: {
            name: {
                [Op.like]: '%' + query + '%'
            },
            status: true
        },
        attributes: ['id', 'name']
    })

})

exports.getExcelCSVData = asyncHandler(async () => {

    let data = await plans.findAll({
        attributes: ['id', 'name', 'price', 'description', 'highlights'],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true

    })

    let finalData = []
    data.forEach(function (planData) {
        finalData.push({
            'ID': planData.id,
            'Name': planData.name ? planData.name : 'Not Available',
            'Price': planData.price ? planData.price : 'Not Available',
            'Description': planData.description ? planData.description : 'Not Available',
            'Highlights': planData.highlights ? planData.highlights : 'Not Available'
        })
    })
    return finalData
})