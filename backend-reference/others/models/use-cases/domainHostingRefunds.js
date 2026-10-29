const asyncHandler = require('../../middlewares/async');
const { Op } = require('sequelize');
const orders = require('../entities/order');
const serviceOperator = require('../entities/serviceOperator');
const credential = require('../entities/credential');

const DOMAIN_HOSTING_ACCESS_KEY = 'domain_and_hosting';

exports.findAllDomainHostingRefunds = asyncHandler(async (params) => {
    const { from, to, searchText, limit, offset, sort, registeredBy } = params;

    const orderWhere = { status: { [Op.in]: ['CANCELLATION_REQUESTED', 'REFUNDED', 'CANCELLED'] } };

    if (from && to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        toDate.setHours(0, 0, 0, 0);
        orderWhere.transactionDate = { [Op.between]: [from, toDate] };
    }

    if (searchText) {
        const safeSearch = searchText.replace(/[%_]/g, '\\$&');
        orderWhere[Op.or] = [
            { corporateTxnId: { [Op.like]: `%${safeSearch}%` } },
            { paymentMode: { [Op.like]: `%${safeSearch}%` } },
            { '$credential.username$': { [Op.like]: `%${safeSearch}%` } },
            { '$credential.name$': { [Op.like]: `%${safeSearch}%` } },
        ];
    }

    const registeredByWhere = registeredBy ? { registeredBy } : {};

    return await orders.findAndCountAll({
        where: orderWhere,
        include: [
            {
                model: serviceOperator,
                where: { accessKey: DOMAIN_HOSTING_ACCESS_KEY, ...registeredByWhere },
                attributes: ['id', 'serviceProvider'],
            },
            {
                model: credential,
                attributes: ['id', 'username', 'name'],
            },
        ],
        attributes: [
            'id', 'corporateTxnId', 'transactionDate', 'amountInINR',
            'status', 'paymentMode', 'orderResponse', 'message',
        ],
        order: [['transactionDate', sort === 'ASC' ? 'ASC' : 'DESC']],
        limit: limit || undefined,
        offset: offset || 0,
        raw: true,
        nest: true,
    });
});

exports.domainHostingRefundsExcelCSVData = asyncHandler(async (params) => {
    const data = await exports.findAllDomainHostingRefunds({ ...params, limit: undefined, offset: 0 });
    return (data.rows || []).map(row => ({
        'Transaction ID': row.corporateTxnId || '',
        'Date': row.transactionDate ? new Date(row.transactionDate).toLocaleDateString() : '',
        'Customer': row.credential?.name || row.credential?.username || '',
        'Username': row.credential?.username || '',
        'Amount (₹)': row.amountInINR || 0,
        'Payment Mode': row.paymentMode || '',
        'Remarks': row.message || '',
        'Status': row.status || '',
    }));
});
