const disableService = require('./../entities/disabledService')
const serviceOperator = require('./../entities/serviceOperator')
const credential = require('./../entities/credential')
// const sequelize = require('sequelize')
// const moment = require('moment')
const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async')
// const ErrorResponse = require('./../../utils/error-response')

exports.create = asyncHandler(async (params) => {
    return await disableService.create(params)
})

exports.Delete = asyncHandler(async (params) => {
    let { id } = params
    return await disableService.destroy({
        where: {
            id
        }
    })
})

exports.findAll = asyncHandler(async (params) => {
    let { start, length, searchText, order, column } = params
    const sortableColumns = [
        'Id',
        'serviceProvider',
        'credentialId',
        'name',
        'serviceStatus',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }

    const data = await disableService.findAndCountAll({
        include: [
            {
                model: serviceOperator, as: '',
                // where: {
                //     serviceProvider: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // },
                attributes: ['serviceProvider']
            },
            {
                model: credential, as: '',
                // where: {
                //     name: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // },
                attributes: ['name']
            }
        ],
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                '$credential.name$': {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                '$serviceOperator.serviceProvider$': {
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

exports.findOne = asyncHandler(async (params) => {
    let { serviceOperatorId, credentialId, } = params
    return await disableService.findOne({
        where: {
            credentialId,
            serviceOperatorId,
            serviceStatus: true
        }
    })
})

exports.getExcel = asyncHandler(async () => {
    const data = await disableService.findAndCountAll({
        include: [
            {
                model: serviceOperator, as: '',
                attributes: ['serviceProvider']
            },
            {
                model: credential, as: '',
                attributes: ['name']
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
            'ID': limitData.Id,
            'Service Operator': limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : 'Not Available',
            'CorporateId': limitData.credentialId ? limitData.credentialId : 'Not Available',
            'Corporate Name': limitData.credential.name ? limitData.credential.name : 'Not Available',
            'Service Status': limitData.serviceStatus ? limitData.serviceStatus : 'Not Available'
        })
    })
    return finalData
})

exports.find = asyncHandler(async (params) => {
    let { serviceOperatorId, credentialId } = params
    return await disableService.findOne({
        where: {
            credentialId,
            serviceOperatorId,
            serviceStatus: true
        }
    })
})

exports.isServiceEnabled = async (credentialId, accessKey) => {
    const disabled = await disableService.findOne({
        where: {
            credentialId,
            serviceStatus: true,
        },
        include: [
            {
                model: serviceOperator,
                where: { accessKey },
                attributes: [],
            },
        ],
        raw: true,
    });

    return !disabled;
};