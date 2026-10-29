const asyncHandler = require("../../middlewares/async");
const { handleSortFields } = require("../../utils/sortHandle");
const credential = require("../entities/credential");
const paymentLinks = require("../entities/paymentLink");
const { Op } = require('sequelize');
const moment = require('moment')

exports.findAllPaymentLinkOrders = asyncHandler(async (params) => {
    let { limit, offset, sort, sortField, corporateId, searchText, status } = params;
    let whereClause = {};
    let order = handleSortFields(sortField, sort)

    // Search conditions
    if (searchText) {
        whereClause[Op.or] = [
            {
                id: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                client_url: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                status: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                invoiceId: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                credentialId: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                type: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                '$credential.name$': {
                    [Op.like]: "%" + searchText + "%",
                }
            },
            {
                '$credential.username$': {
                    [Op.like]: "%" + searchText + "%",
                }
            },
        ];
    }

    // Corporate ID filter
    if (corporateId) {
        whereClause.credentialId = corporateId;
    }

    // Status filter
    if (status) {
        whereClause.status = status;
    }

    // Return the results
    return await paymentLinks.findAndCountAll({
        attributes:['createdAt','amount','status','paymentLink','type'],
        include: [
            {
                model: credential,
                attributes: ["name", "email", 'username']
            },
        ],
        where: whereClause,
        order: order,
        limit: limit || 10, // Set default limit if not provided
        offset: offset || 0,
        raw: true,
        nest: true,
    });
});

exports.paymentLinkOrdersExcelCSVData = asyncHandler(async (params) => {
    let { sort, sortField, corporateId, searchText, status } = params;
    let whereClause = {};
    let order = handleSortFields(sortField, sort)

    // Search conditions
    if (searchText) {
        whereClause[Op.or] = [
            {
                id: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                client_url: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                status: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                invoiceId: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                credentialId: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                type: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                '$credential.name$': {
                    [Op.like]: "%" + searchText + "%",
                }
            },
            {
                '$credential.username$': {
                    [Op.like]: "%" + searchText + "%",
                }
            },
        ];
    }

    // Corporate ID filter
    if (corporateId) {
        whereClause.credentialId = corporateId;
    }

    // Status filter
    if (status) {
        whereClause.status = status;
    }

    // Return the results
    let data = await paymentLinks.findAndCountAll({
        include: [
            {
                model: credential,
                attributes: ["name", "email", 'username']
            },
        ],
        where: whereClause,
        order: order,
        raw: true,
        nest: true,
    });

    let finalData = [];
    data.rows.forEach(function (limitData) {
        finalData.push({
            //ID: limitData.id,
            "Date": limitData.createdAt ? moment(limitData.createdAt).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
            "Corporate ID": limitData.credential?.username ? limitData.credential?.username : "Not Available",
            "Corporate Name": limitData.credential.name ? limitData.credential.name : "Not Available",
            Amount: limitData.amount ? "₹ "+parseFloat(limitData.amount).toFixed(2) : "0.00",
            "Status": limitData.status ? limitData.status : "Not Available",
            "Type": limitData.type ? limitData.type : "Corporate",
            "Link": limitData.paymentLink ? limitData.paymentLink : "Not Available",
        });
    });
    return finalData;
});