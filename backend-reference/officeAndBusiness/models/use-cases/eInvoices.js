const asyncHandler = require('../../middlewares/async');
const { Op, fn, col, cast, Sequelize } = require('sequelize');
const eInvoice = require('../entities/eInvoices');
const eWaybill = require('../entities/eWaybill');
const SubCorporateUser = require('../entities/subCorporateUsers');
const Subscription = require('../entities/subscription');
const Package = require('../entities/package');
const Cashback = require('../entities/cashback');
const serviceOperators = require('../entities/serviceOperator');
const operatorsData = require('../../utils/operatorsData.json');

const E_INVOICE_ACCESS_KEY = operatorsData.eInvoice.accessKey;

exports.createEInvoice = asyncHandler(async (params) => {
    return await eInvoice.create(params);
});

exports.getEInvoiceByIrn = asyncHandler(async (irn) => {
    return await eInvoice.findOne({ where: { irn } });
});

exports.getEInvoiceById = asyncHandler(async (id, corporateUserId = undefined) => {
    return await eInvoice.findOne({ where: corporateUserId ? { id, corporateUserId } : { id } });
});

exports.findAllEInvoicesAndCount = asyncHandler(async (params) => {
    const { from, to, limit, offset, searchText, sort, sortField, corporateUserId, subCorporateUserId, status, supplyType, hasEwaybill } = params;

    const whereClause = { corporateUserId };

    if (status) {
        whereClause.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (supplyType && supplyType.length) {
        whereClause.supplyType = { [Op.in]: supplyType };
    }

    if (hasEwaybill === true || hasEwaybill === 'true') {
        whereClause.eWaybillId = { [Op.ne]: null };
    } else if (hasEwaybill === false || hasEwaybill === 'false') {
        whereClause.eWaybillId = null;
    }

    if (subCorporateUserId) {
        whereClause.subCorporateUserId = subCorporateUserId;
    }

    if (searchText) {
        whereClause[Op.or] = [
            Sequelize.where(fn('CONCAT', fn('COALESCE', col('prefix'), ''), col('docNo')), { [Op.like]: `%${searchText}%` }),
            { ackNo: { [Op.like]: `%${searchText}%` } },
            { docDate: { [Op.like]: `%${searchText}%` } },
            { buyerGstin: { [Op.like]: `%${searchText}%` } },
            Sequelize.literal(`JSON_VALID(\`eInvoices\`.\`buyerDetails\`) AND JSON_UNQUOTE(JSON_EXTRACT(\`eInvoices\`.\`buyerDetails\`, '$.legalName')) LIKE :searchText`),
            Sequelize.literal(`JSON_VALID(\`eInvoices\`.\`buyerDetails\`) AND JSON_UNQUOTE(JSON_EXTRACT(\`eInvoices\`.\`buyerDetails\`, '$.tradeName')) LIKE :searchText`),
            { supplyType: { [Op.like]: `%${searchText}%` } },
            { docType: { [Op.like]: `%${searchText}%` } },
            { status: { [Op.like]: `%${searchText}%` } },
            Sequelize.where(fn('CAST', Sequelize.literal('`eInvoices`.`totalAmount` AS CHAR')), { [Op.like]: `%${searchText}%` }),
        ];
    }

    if (from && to) {
        const tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        whereClause.createdAt = { [Op.between]: [from, tomorrow] };
    }

    const orderType = sort === 'ASC' ? 'ASC' : 'DESC';
    const orderField = sortField || 'id';

    const [activeCount, cancelledCount] = await Promise.all([
        eInvoice.count({ where: { corporateUserId, status: 'ACTIVE' } }),
        eInvoice.count({ where: { corporateUserId, status: 'CANCELLED' } }),
    ]);

    const result = await eInvoice.findAndCountAll({
        include: [
            {
                model: SubCorporateUser,
                attributes: ['id', 'name'],
                required: false,
            },
        ],
        where: whereClause,
        ...(searchText ? { replacements: { searchText: `%${searchText}%` } } : {}),
        order: [[orderField, orderType]],
        limit,
        offset,
        raw: true,
        nest: true,
    });

    return {
        rows: result.rows,
        count: result.count,
        activeCount,
        cancelledCount,
    };
});

exports.getEInvoiceDashboard = asyncHandler(async (corporateUserId) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
        totalCount,
        activeCount,
        activeTotalAmount,
        cancelledLast30,
        eWaybillActiveCount,
    ] = await Promise.all([
        eInvoice.count({ where: { corporateUserId } }),
        eInvoice.count({ where: { corporateUserId, status: 'ACTIVE' } }),
        eInvoice.sum('totalAmount', { where: { corporateUserId, status: 'ACTIVE' } }),
        eInvoice.count({
            where: {
                corporateUserId,
                status: 'CANCELLED',
                updatedAt: { [Op.gte]: thirtyDaysAgo },
            },
        }),
        eWaybill.count({ where: { corporateUserId, status: 'ACTIVE' } }),
    ]);

    return {
        totalCount,
        activeCount,
        activeTotalAmount: parseFloat(activeTotalAmount || 0),
        cancelledLast30,
        eWaybillActiveCount,
    };
});

exports.getEInvoiceUsage = asyncHandler(async ({ corporateUserId }) => {
    const activeGroup = await Subscription.findOne({
        include: [{
            model: Package,
            attributes: ['id', 'packageName', 'packageType', 'priorityLevel'],
            where: { packageType: 'GROUP' },
            required: true,
        }],
        where: {
            corporateUserId,
            status: 'ACTIVE',
            isCustom: false,
        },
        attributes: ['id', 'subscriptionStartDate', 'subscriptionEndDate', 'subscriptionPaymentRefId', 'subscriptionAmountPaid', 'billingType', 'status'],
        order: [[Package, 'priorityLevel', 'DESC']],
        raw: true,
        nest: true,
    });

    const isPaidPlan = !!activeGroup && activeGroup.subscriptionPaymentRefId !== null;
    let cycleStart;
    let cycleEnd;
    if (isPaidPlan && activeGroup.subscriptionStartDate && activeGroup.subscriptionEndDate) {
        cycleStart = new Date(activeGroup.subscriptionStartDate);
        cycleEnd = new Date(activeGroup.subscriptionEndDate);
    } else {
        cycleEnd = new Date();
        cycleStart = new Date();
        cycleStart.setDate(cycleStart.getDate() - 30);
    }

    // Resolve every serviceOperator id sharing the e-invoice accessKey — covers partner-
    // scoped duplicates. If none exist we'll naturally get zero quota.
    const operatorRows = await serviceOperators.findAll({
        where: { accessKey: E_INVOICE_ACCESS_KEY },
        attributes: ['id'],
        raw: true,
    });
    const operatorIds = operatorRows.map((row) => row.id);

    let freeBaseLimit = 0;
    if (activeGroup?.package?.id && operatorIds.length > 0) {
        const cashbackRow = await Cashback.findOne({
            where: {
                packageId: activeGroup.package.id,
                serviceOperatorId: { [Op.in]: operatorIds },
                serviceStatus: true,
            },
            attributes: ['baseLimit'],
            raw: true,
        });
        if (cashbackRow?.baseLimit != null) {
            freeBaseLimit = parseInt(cashbackRow.baseLimit, 10) || 0;
        }
    }

    let addonLimit = 0;
    if (operatorIds.length > 0) {
        const addonRows = await Subscription.findAll({
            where: {
                corporateUserId,
                status: 'ACTIVE',
                isCustom: true,
                isCancelled: false,
                serviceOperatorId: { [Op.in]: operatorIds },
            },
            attributes: ['maxLimit'],
            raw: true,
        });
        addonLimit = addonRows.reduce(
            (sum, row) => sum + (parseInt(row.maxLimit, 10) || 0),
            0,
        );
    }

    const maxLimit = freeBaseLimit + addonLimit;

    const [used, lastEInvoice] = await Promise.all([
        eInvoice.count({
            where: {
                corporateUserId,
                createdAt: { [Op.between]: [cycleStart, cycleEnd] },
            },
        }),
        eInvoice.findOne({
            where: { corporateUserId },
            order: [['createdAt', 'DESC']],
            attributes: ['createdAt'],
            raw: true,
        }),
    ]);

    return {
        used,
        freeBaseLimit,
        addonLimit,
        maxLimit,
        cycleStart: cycleStart.toISOString(),
        cycleEnd: cycleEnd.toISOString(),
        currentPlanName: activeGroup?.package?.packageName ?? null,
        currentPlanBillingType: activeGroup?.billingType ?? null,
        currentPlanAmountPaid: activeGroup?.subscriptionAmountPaid ?? null,
        currentPlanStatus: activeGroup?.status ?? null,
        lastEInvoiceCreatedAt: lastEInvoice?.createdAt
            ? new Date(lastEInvoice.createdAt).toISOString()
            : null,
    };
});

exports.getNextEInvoiceNumber = asyncHandler(async (corporateUserId) => {
    const result = await eInvoice.findOne({
        where: { corporateUserId },
        attributes: [[fn('MAX', cast(col('docNo'), 'UNSIGNED')), 'maxNumber']],
        raw: true,
    });
    const max = parseInt(result?.maxNumber || 0, 10);
    return max + 1;
});

exports.updateEInvoice = asyncHandler(async (id, data) => {
    return await eInvoice.update(data, { where: { id } });
});

exports.getEInvoiceDetailsById = asyncHandler(async (id) => {
    return await eInvoice.findOne({
        where: { id },
        include: [
            {
                model: eWaybill,
                as: 'eWaybill',
                required: false,
            },
            {
                model: SubCorporateUser,
                attributes: ['id', 'name'],
                required: false,
            },
        ],
        raw: true,
        nest: true,
    });
});
