const orders = require('./../entities/order');
const credential = require('./../entities/credential');
const transaction = require('./../entities/transaction');
const serviceOperators = require('./../entities/serviceOperator');
const asyncHandler = require('./../../middlewares/async');
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const operatorsData = require('../../utils/operatorsData.json');

const GLOBAL_BUSINESS_SETUP_ACCESS_KEY = operatorsData.globalBusinessSetup.accessKey;

exports.findCorporateDetails = asyncHandler(async (params) => {
    const order = await orders.findOne({
        where: {
            corporateTxnId: params.corporateTxnId,
        },
        include: [
            {
                model: credential,
                attributes: ['email', 'name', 'username', 'registeredBy'],
            },
        ],
        raw: true,
        nest: true
    });
    return order;
});

exports.hasPurchasedGlobalBusinessSetup = async ({
    credentialId,
    serviceOperatorId
}) => {
    return await orders.findOne({
        where: {
            credentialId,
            status: "SUCCESS",
            serviceOperatorId,
        },
        order: [["createdAt", "DESC"]],
    });
};

/**
 * Admin transaction listing for Global Business Setup.
 * Joins transaction + serviceOperator (filtered by accessKey) + credential + order.
 * Mirrors the shape used by other admin reports in IN (works/worksReport).
 */
exports.findAllTransactionsForAdmin = asyncHandler(async (params) => {
    const {
        from,
        to,
        searchText,
        sort,
        filter,
        partnerId,
        corporateId,
        subCorporateUserId,
        limit,
        offset,
        serviceAttribute = [],
        credentialAttribute = ["id", "username", "name", "email", "registeredBy"],
        transactionAttribute = [],
        orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'transactionDate', 'corporateTxnId'],
        sortField = 'transactionDate',
    } = params;

    const whereClause = {};

    if (searchText && searchText.trim()) {
        whereClause[Op.or] = [
            { id: { [Op.like]: `%${searchText}%` } },
            { remarks: { [Op.like]: `%${searchText}%` } },
            { transactionCategory: { [Op.like]: `%${searchText}%` } },
            { '$serviceOperator.serviceProvider$': { [Op.like]: `%${searchText}%` } },
            { '$credential.name$': { [Op.like]: `%${searchText}%` } },
            { '$credential.username$': { [Op.like]: `%${searchText}%` } },
            { '$order.paymentMode$': { [Op.like]: `%${searchText}%` } },
            { '$order.status$': { [Op.like]: `%${searchText}%` } },
            { '$order.corporateTxnId$': { [Op.like]: `%${searchText}%` } },
            sequelize.literal(`LOWER(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$.data.plan.name')) LIKE LOWER(:searchText)`),
        ];
    }

    if (from && to) {
        const tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        whereClause.transactionDate = { [Op.between]: [from, tomorrow] };
    }

    if (subCorporateUserId) {
        whereClause['$order.subCorporateUserId$'] = subCorporateUserId;
    }

    const credentialWhere = {};
    if (partnerId === 'default') credentialWhere.registeredBy = null;
    else if (partnerId) credentialWhere.registeredBy = partnerId;
    if (corporateId) credentialWhere.id = corporateId;

    const includeOptions = [
        {
            model: serviceOperators,
            attributes: serviceAttribute,
            where: { accessKey: GLOBAL_BUSINESS_SETUP_ACCESS_KEY },
        },
        {
            model: credential,
            attributes: credentialAttribute,
            where: Object.keys(credentialWhere).length ? credentialWhere : undefined,
            include: [
                {
                    model: credential,
                    as: 'registeredByCredential',
                    attributes: ['name'],
                },
            ],
        },
        {
            model: orders,
            attributes: orderAttribute,
            where: {
                ...(filter && { status: filter }),
                orderResponse: { [Op.ne]: null },
            },
        },
    ];

    const sortClause = [sortField, sort === 'DESC' ? 'DESC' : 'ASC'];

    return await transaction.findAndCountAll({
        include: includeOptions,
        where: whereClause,
        ...(searchText ? { replacements: { searchText: `%${searchText}%` } } : {}),
        order: [sortClause],
        attributes: transactionAttribute,
        ...(limit ? { limit } : {}),
        ...(offset ? { offset } : {}),
    });
});
