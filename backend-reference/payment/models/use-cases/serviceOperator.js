/* eslint-disable no-unused-vars */
const serviceOperator = require('./../entities/serviceOperator')
const vendors = require('./../entities/vendor')
const sequelize = require('../../configs/database/index')
//const sequelize = require('sequelize')
let sequelizeConfig = require('../../configs/database/index');

const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async')


exports.findOne = asyncHandler(async (params) => {
    let whereClause = {}
    if (params.id) whereClause.id = params.id
    if (params.accessKey) whereClause.accessKey = params.accessKey
    if (params.serviceType) whereClause.serviceType = params.serviceType
    return await serviceOperator.findOne({
        include: [{
            model: vendors,
           
            attributes: ['apiUrl', 'optional1', 'optional2', 'optional3', 'optional4', 'optional5','healthUrl','optional6','optionals','vendorEmail','vendorName','state','gstNo','address']
        }],
        where: whereClause,
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



exports.fetchServiceOperator = asyncHandler(async (query, res) => {

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

    // F-PAY-30: allow-list the column + direction — this ORDER BY is raw SQL (injection risk).
    const ALLOWED_SORT_COLS = new Set(["transactionDate"]);
    const safeOrderCol = ALLOWED_SORT_COLS.has(orderCol) ? orderCol : "transactionDate";
    const safeOrder = String(order).toUpperCase() === "ASC" ? "ASC" : "DESC";

    query += `
        ORDER BY ${safeOrderCol} ${safeOrder}
        LIMIT :length
    `;

    const results = await sequelizeConfig.query(query, {
        type: sequelizeConfig.QueryTypes.SELECT,
        replacements
    });

    return results;
})