const invoicingV2 = require("../entities/invoicingV2");
const { Op,cast, col, fn} = require("sequelize");
const Sequelize = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const SubCorporateUser = require("../entities/subCorporateUsers");
const corporateUser = require("../entities/corporateUser");
const manualPayment = require("../entities/manualPayment");
const InvoiceCustomerV2 = require("../entities/invoiceCustomerV2");
const agreement = require("../entities/agreement");
const invoiceRecurring = require("../entities/invoiceRecurring");

exports.createInvoice = asyncHandler(async (params) => {
    return await invoicingV2.create(params);
});

exports.findInvoice = asyncHandler(async (params) => {
    return await invoicingV2.findOne({
        where: params,
        include: [
            {
                model: corporateUser,
                // credentialId is needed to look up the corporate's saved bank account
                attributes: ["name", "companyName", "email", "mobileNo", "gstNumber", "logo", "city", "state", "poBox", "credentialId"],
            },
        ],
        raw: true,
        nest: true,
    });
});

exports.findAllInvoicesAndCount = asyncHandler(async (params) => {
    let { from, to, limit, offset, searchText, sort, sortField, userId, subCorporateUserId, status, documentType, customerId, invoiceType, hasEInvoice, linkedInvoiceId } = params;

    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    let whereClause = {};

    if (searchText) {
        whereClause[Op.or] = [
            { invoiceNumber: { [Op.like]: "%" + searchText + "%" } },
            Sequelize.where(fn('CONCAT', col('prefix'), col('invoiceNumber')), { [Op.like]: "%" + searchText + "%" }),
            { name: { [Op.like]: "%" + searchText + "%" } },
            { email: { [Op.like]: "%" + searchText + "%" } },
            { phoneNumber: { [Op.like]: "%" + searchText + "%" } },
            { gstNumber: { [Op.like]: "%" + searchText + "%" } },
            { city: { [Op.like]: "%" + searchText + "%" } },
            { state: { [Op.like]: "%" + searchText + "%" } },
            { country: { [Op.like]: "%" + searchText + "%" } },
            { status: { [Op.like]: "%" + searchText + "%" } },
        ];
    }

    if (userId) {
        whereClause.corporateUserId = userId;
    }

    // Never show CANCELLED invoices in the listing
    whereClause.status = { [Op.ne]: 'CANCELLED' };

    if (status) {
        whereClause.status = Array.isArray(status)
            ? { [Op.in]: status.filter(s => s !== 'CANCELLED') }
            : status !== 'CANCELLED' ? status : { [Op.ne]: 'CANCELLED' };
    }

    if (subCorporateUserId) {
        whereClause.subCorporateUserId = subCorporateUserId;
    }

    if (customerId) {
        whereClause.customerId = customerId;
    }

    if (invoiceType) {
        whereClause.invoiceType = invoiceType;
    }

    if (linkedInvoiceId) {
        whereClause.linkedInvoiceId = linkedInvoiceId;
    }

    whereClause.documentType = documentType || 'INVOICE';

    if (hasEInvoice === true || hasEInvoice === 'true') {
        whereClause.eInvoiceId = { [Op.ne]: null };
    } else if (hasEInvoice === false || hasEInvoice === 'false') {
        whereClause.eInvoiceId = null;
    }

    if (from && to) {
        whereClause.createdAt = {
            [Op.between]: [from, tomorrow],
        };
    }
    const orderType = sort === "ASC" ? "ASC" : "DESC";
    const orderField = sortField || 'id';

    return await invoicingV2.findAndCountAll({
        include: [
            {
                model: SubCorporateUser,
                attributes: ["id", "name"],
                required: false,
            },
            {
                model: invoiceRecurring,
                as: "recurring",
                attributes: ["id", "status"],
                required: false,
            },
        ],
        where: whereClause,
        order: [[orderField, orderType]],
        limit,
        offset,
        raw: true,
        nest: true,
    });
});

exports.createManualPaymentRecord = asyncHandler(async ({ invoiceId, corporateUserId, amount, originalAmount, paymentMethod, paymentDate, referenceId, notes }) => {
    return await manualPayment.create({
        invoiceId,
        corporateUserId,
        amount,
        originalAmount: originalAmount ?? null,
        paymentMethod,
        paymentDate,
        referenceId: referenceId || null,
        notes: notes || null,
    })
})

exports.findAllInvoicePayments = asyncHandler(async (invoiceId) => {
    return await manualPayment.findAll({
        where: { invoiceId },
        order: [["id", "DESC"]],
    })
})

// Global (cross-invoice) manual payments listing, for the "Invoice Payments" tab.
exports.findAllManualPaymentsAndCount = asyncHandler(async (params) => {
    let { userId, searchText, from, to, limit, offset, sort, sortField } = params;

    let whereClause = { corporateUserId: userId, isDeleted: false };

    if (from && to) {
        whereClause.paymentDate = { [Op.between]: [from, to] };
    }

    if (searchText) {
        whereClause[Op.or] = [
            { paymentMethod: { [Op.like]: "%" + searchText + "%" } },
            { amount: { [Op.like]: "%" + searchText + "%" } },
            Sequelize.where(
                fn('CONCAT', col('invoicing.prefix'), col('invoicing.invoiceNumber')),
                { [Op.like]: "%" + searchText + "%" }
            ),
        ];
    }

    // These fields live on the joined invoicingV2 row, not on manualPayment itself —
    // ordering by them needs an association-qualified column reference.
    const INVOICE_SORT_FIELDS = ['invoiceDate', 'invoiceNumber', 'totalAmount'];
    const orderColumn = INVOICE_SORT_FIELDS.includes(sortField)
        ? col(`invoicing.${sortField}`)
        : (sortField || 'paymentDate');

    const { count, rows } = await manualPayment.findAndCountAll({
        where: whereClause,
        include: [{
            model: invoicingV2,
            where: { documentType: 'INVOICE' },
            attributes: ['id', 'prefix', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'currency', 'name', 'email', 'phoneNumber', 'cashSale'],
            required: true,
        }],
        order: [[orderColumn, sort || 'DESC']],
        limit,
        offset,
        subQuery: false,
    });

    return { count, rows };
})

exports.findManualPaymentById = asyncHandler(async ({ id, invoiceId }) => {
    return await manualPayment.findOne({
        where: { id, invoiceId },
        raw: true,
    })
})

exports.deleteManualPaymentRecord = asyncHandler(async ({ id, invoiceId }) => {
    return await manualPayment.update(
        { isDeleted: true },
        { where: { id, invoiceId, isDeleted: false } }
    )
})

const INVOICE_JOIN_ATTRS = ['id', 'prefix', 'invoiceNumber', 'invoiceDate', 'totalAmount', 'originalTotalAmount', 'currency', 'name', 'email', 'phoneNumber', 'cashSale'];

// Centralized, cross-invoice ledger for the "Payments Received" page: every manual payment,
// across all invoices, in one list — with the total received the page needs.
exports.findAllReceiptsAndCount = asyncHandler(async (params) => {
    const { userId, mode, customerName, from, to, limit, offset, sort } = params;

    const invoiceWhere = { documentType: 'INVOICE' };
    if (customerName) {
        invoiceWhere.name = { [Op.like]: `%${customerName}%` };
    }

    const paymentWhere = { corporateUserId: userId, isDeleted: false };
    if (from && to) paymentWhere.paymentDate = { [Op.between]: [from, to] };
    if (mode) paymentWhere.paymentMethod = mode;

    const includeInvoice = { model: invoicingV2, where: invoiceWhere, attributes: INVOICE_JOIN_ATTRS, required: true };

    const paymentRows = await manualPayment.findAll({
        where: paymentWhere,
        include: [includeInvoice],
        order: [['paymentDate', sort === 'ASC' ? 'ASC' : 'DESC']],
    });

    const totalReceived = paymentRows.reduce((sum, r) => sum + Number(r.amount), 0);

    const combined = paymentRows.map(r => ({
        id: r.id,
        date: r.paymentDate,
        amount: r.amount,
        originalAmount: r.originalAmount,
        mode: r.paymentMethod,
        referenceId: r.referenceId,
        notes: r.notes,
        receiptNo: r.receiptNo,
        invoice: r.invoicing,
    }));

    const count = combined.length;
    const rows = combined.slice(offset, offset + limit);

    return { count, rows, totalReceived };
})

exports.updateCreditNoteStatus = asyncHandler(async ({ id, corporateUserId, status }) => {
    return await invoicingV2.update(
        { status },
        { where: { id, corporateUserId, documentType: 'CREDIT_NOTE' } }
    )
})

exports.findQuotationByToken = asyncHandler(async (quotationToken) => {
    return await invoicingV2.findOne({
        where: { quotationToken, documentType: 'QUOTATION' },
        raw: true,
    });
});

exports.updateInvoice = asyncHandler(async (where, data) => {
    const doc = await invoicingV2.findOne({ where });
    if (!doc) return null
    return await doc.update(data)
})

exports.getInvoiceDashboard = asyncHandler(async (corporateUserId) => {
    const whereClause = {
        corporateUserId,
        documentType: 'INVOICE',
        status: { [Op.ne]: 'CANCELLED' },
    };

    // Everything below is derived from these two fetches, not separate SUM queries per figure,
    // so the numbers can never drift apart from each other.
    const invoices = await invoicingV2.findAll({
        where: whereClause,
        attributes: ['id', 'totalAmount', 'amountPaid', 'createdAt'],
        raw: true,
    });
    const invoiceIds = invoices.map(inv => inv.id);
    const creditNotes = invoiceIds.length
        ? await invoicingV2.findAll({
            where: { corporateUserId, documentType: 'CREDIT_NOTE', linkedInvoiceId: { [Op.in]: invoiceIds } },
            attributes: ['linkedInvoiceId', 'totalAmount', 'createdAt'],
            raw: true,
        })
        : [];

    const creditTotalByInvoiceId = {};
    creditNotes.forEach(cn => {
        creditTotalByInvoiceId[cn.linkedInvoiceId] =
            (creditTotalByInvoiceId[cn.linkedInvoiceId] || 0) + (parseFloat(cn.totalAmount) || 0);
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd      = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const inRange = (date, start, end) => date >= start && date <= end;

    let totalInvoiceAmount = 0;
    let totalReceived = 0;
    // Summed per invoice (each clamped at 0 individually), not pooled then clamped once —
    // otherwise a credit surplus on one invoice could cancel out real, unrelated debt still
    // owed on a different invoice.
    let outstandingAmount = 0;
    let currentMonthAmount = 0;
    let lastMonthAmount = 0;
    let currentMonthReceived = 0;
    let lastMonthReceived = 0;

    invoices.forEach(inv => {
        const total = parseFloat(inv.totalAmount) || 0;
        const paid = parseFloat(inv.amountPaid) || 0;
        const credited = creditTotalByInvoiceId[inv.id] || 0;

        totalInvoiceAmount += total;
        totalReceived += paid;
        outstandingAmount += Math.max(0, total - credited - paid);

        const createdAt = new Date(inv.createdAt);
        if (inRange(createdAt, currentMonthStart, currentMonthEnd)) {
            currentMonthAmount += total;
            currentMonthReceived += paid;
        } else if (inRange(createdAt, lastMonthStart, lastMonthEnd)) {
            lastMonthAmount += total;
            lastMonthReceived += paid;
        }
    });

    let totalCreditNoteAmount = 0;
    let currentMonthCreditNote = 0;
    let lastMonthCreditNote = 0;

    creditNotes.forEach(cn => {
        const amount = parseFloat(cn.totalAmount) || 0;
        totalCreditNoteAmount += amount;

        const createdAt = new Date(cn.createdAt);
        if (inRange(createdAt, currentMonthStart, currentMonthEnd)) currentMonthCreditNote += amount;
        else if (inRange(createdAt, lastMonthStart, lastMonthEnd)) lastMonthCreditNote += amount;
    });

    const currentSales = currentMonthAmount - currentMonthCreditNote;
    const lastSales     = lastMonthAmount - lastMonthCreditNote;
    let salesVsLastMonthPercent = 0;
    if (lastSales > 0) {
        const raw = parseFloat((((currentSales - lastSales) / lastSales) * 100).toFixed(2));
        salesVsLastMonthPercent = Math.max(-100, Math.min(100, raw));
    } else if (currentSales > 0) {
        salesVsLastMonthPercent = 100;
    }

    let receivedVsLastMonthPercent = 0;
    if (lastMonthReceived > 0) {
        const raw = parseFloat((((currentMonthReceived - lastMonthReceived) / lastMonthReceived) * 100).toFixed(2));
        receivedVsLastMonthPercent = Math.max(-100, Math.min(100, raw));
    } else if (currentMonthReceived > 0) {
        receivedVsLastMonthPercent = 100;
    }

    return {
        totalInvoices: invoices.length,
        totalSales: totalInvoiceAmount - totalCreditNoteAmount,
        totalReceived,
        outstandingAmount,
        salesVsLastMonthPercent,
        receivedVsLastMonthPercent,
    };
});

exports.getNextInvoiceNumber = asyncHandler(async (corporateUserId) => {
    const result = await invoicingV2.findOne({
        where: { corporateUserId },
        attributes: [[fn('MAX', cast(col('invoiceNumber'), 'UNSIGNED')), 'maxNumber']],
        raw: true,
    });
    const max = parseInt(result?.maxNumber || 0, 10);
    return max + 1;
});

exports.getNextCreditNoteNumber = asyncHandler(async (corporateUserId) => {
    const result = await invoicingV2.findOne({
        where: { corporateUserId, documentType: 'CREDIT_NOTE' },
        attributes: [[fn('MAX', cast(col('invoiceNumber'), 'UNSIGNED')), 'maxNumber']],
        raw: true,
    });
    const max = parseInt(result?.maxNumber || 0, 10);
    return max + 1;
});

exports.getCreditNoteStats = asyncHandler(async (corporateUserId) => {
    const [totalCreditNotes, totalValue] = await Promise.all([
        invoicingV2.count({ where: { corporateUserId, documentType: 'CREDIT_NOTE' } }),
        invoicingV2.sum('totalAmount', { where: { corporateUserId, documentType: 'CREDIT_NOTE' } }),
    ]);
    return {
        totalCreditNotes: totalCreditNotes || 0,
        totalValue: parseFloat(totalValue || 0).toFixed(2),
    };
});

exports.getSalesOrderDashboard = asyncHandler(async (corporateUserId) => {
    const baseWhere = {
        corporateUserId,
        documentType: 'SALES_ORDER',
        status: { [Op.ne]: 'CANCELLED' },
    };

    const [totalOrders, pending, completed] = await Promise.all([
        invoicingV2.count({ where: baseWhere }),
        invoicingV2.count({ where: { ...baseWhere, status: 'PENDING' } }),
        invoicingV2.count({ where: { ...baseWhere, status: 'COMPLETED' } }),
    ]);

    return {
        totalOrders:  totalOrders || 0,
        pending:      pending || 0,
        completed:    completed || 0,
    };
});

exports.getQuotationDashboard = asyncHandler(async (corporateUserId) => {
    const baseWhere = {
        corporateUserId,
        documentType: 'QUOTATION',
        status: { [Op.ne]: 'CANCELLED' },
    };

    const [totalQuotations, accepted, pending] = await Promise.all([
        invoicingV2.count({ where: baseWhere }),
        invoicingV2.count({ where: { ...baseWhere, status: 'ACCEPTED' } }),
        invoicingV2.count({ where: { ...baseWhere, status: 'PENDING' } }),
    ]);

    return {
        totalQuotations: totalQuotations || 0,
        accepted:        accepted || 0,
        pending:         pending || 0,
    };
});

exports.fetchAllCustomersForInvoice = asyncHandler(async (corporateUserId) => {
    return await InvoiceCustomerV2.findAll({
        where: { corporateUserId },
        attributes: ['id', 'name', 'gstin', 'primaryAddress', 'primaryCity', 'primaryState', 'primaryPincode', 'primaryCountry', 'email', 'phoneNumber', 'currency'],
        order: [['name', 'ASC']],
    });
});

// GET /invoicing/v2/payments/dashboard
// All figures are scoped to the CURRENT MONTH only, documentType = INVOICE
exports.getPaymentsDashboardOverview = asyncHandler(async (corporateUserId) => {
    const baseWhere = {
        corporateUserId,
        documentType: 'INVOICE',
        status: { [Op.ne]: 'CANCELLED' },
    };

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const lastMonthStart    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd      = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);


    const [
        totalReceived,
        lastMonthReceived,
        outstanding,
        outstandingCount,
        overdue,
        overdueCount,
        thisMonthReceived,
        totalInvoiced,
    ] = await Promise.all([
        // Total Received — all-time: PAID + partial paid invoices
        invoicingV2.sum('amountPaid', { where: { ...baseWhere, amountPaid: { [Op.gt]: 0 }, status: { [Op.in]: ['PAID', 'PENDING', 'OVERDUE'] } } }),

        // Last month received — payments received last month (by paymentDate) for vsLastMonth %
        invoicingV2.sum('amountPaid', { where: { ...baseWhere, amountPaid: { [Op.gt]: 0 }, paymentDate: { [Op.between]: [lastMonthStart, lastMonthEnd] } } }),

        // Outstanding — all PENDING invoices all-time
        invoicingV2.sum('amountDue', { where: { ...baseWhere, status: 'PENDING' } }),
        invoicingV2.count(           { where: { ...baseWhere, status: 'PENDING' } }),

        // Overdue — all OVERDUE invoices all-time
        invoicingV2.sum('amountDue', { where: { ...baseWhere, status: 'OVERDUE' } }),
        invoicingV2.count(           { where: { ...baseWhere, status: 'OVERDUE' } }),

        // This Month — payments received this month by paymentDate (PAID + partial)
        invoicingV2.sum('amountPaid', { where: { ...baseWhere, amountPaid: { [Op.gt]: 0 }, status: { [Op.in]: ['PAID', 'PENDING', 'OVERDUE'] }, paymentDate: { [Op.between]: [currentMonthStart, currentMonthEnd] } } }),

        // Total Invoiced all-time — for Revenue Collection Health
        invoicingV2.sum('totalAmount', { where: { ...baseWhere } }),
    ]);

    const received     = parseFloat(totalReceived     || 0);
    const prevReceived = parseFloat(lastMonthReceived || 0);
    const currInv      = parseFloat(thisMonthReceived || 0);

    // vsLastMonthReceived — undefined if either this month or last month is 0
    const vsLastMonthReceived = (currInv === 0 || prevReceived === 0)
        ? undefined
        : parseFloat((((currInv - prevReceived) / prevReceived) * 100).toFixed(2));

    // Collection Health — based on all-time total invoiced
    const clamp100 = (val) => Math.max(0, Math.min(100, val));
    const total          = parseFloat(totalInvoiced || 0);
    const outstandingAmt = parseFloat(outstanding   || 0);
    const overdueAmt     = parseFloat(overdue       || 0);

    let collectedPercent = 0, outstandingPercent = 0, overduePercent = 0;
    if (total > 0) {
        collectedPercent   = clamp100(parseFloat(((received       / total) * 100).toFixed(2)));
        outstandingPercent = clamp100(parseFloat(((outstandingAmt / total) * 100).toFixed(2)));
        overduePercent     = clamp100(parseFloat(((overdueAmt     / total) * 100).toFixed(2)));
    }

    return {
        totalReceived:       received,
        vsLastMonthReceived,
        outstanding:         outstandingAmt,
        outstandingCount:    outstandingCount || 0,
        overdue:             overdueAmt,
        overdueCount:        overdueCount    || 0,
        thisMonth:           currInv,
        collectionHealth: {
            total,
            collectedPercent,
            outstandingPercent,
            overduePercent,
        },
    };
});

// GET /invoicing/v2/sales/dashboard
// One-call stats for the Sales dashboard home page
exports.getSalesDashboard = asyncHandler(async (corporateUserId) => {
    const baseInvoice   = { corporateUserId, documentType: 'INVOICE',     status: { [Op.ne]: 'CANCELLED' } };
    const baseSO        = { corporateUserId, documentType: 'SALES_ORDER', status: { [Op.ne]: 'CANCELLED' } };
    const baseQuotation = { corporateUserId, documentType: 'QUOTATION',   status: { [Op.ne]: 'CANCELLED' } };

    const [
        customersCount,
        invoicesCount,
        salesOrdersCount,
        quotationsCount,
        agreementsCount,
        totalPaymentsAmount,
    ] = await Promise.all([
        InvoiceCustomerV2.count({ where: { corporateUserId, status: 'ACTIVE' } }),
        invoicingV2.count({ where: baseInvoice }),
        invoicingV2.count({ where: baseSO }),
        invoicingV2.count({ where: baseQuotation }),
        // agreements from the dedicated agreements table
        agreement.count({ where: { corporateUserId } }),
        // total amount across ALL non-cancelled invoices (created, not just paid)
        invoicingV2.sum('totalAmount', { where: baseInvoice }),
    ]);

    return {
        customersCount:      customersCount      || 0,
        quotationsCount:     quotationsCount     || 0,
        agreementsCount:     agreementsCount     || 0,
        salesOrdersCount:    salesOrdersCount    || 0,
        totalPaymentsAmount: totalPaymentsAmount || 0,
        invoicesCount:       invoicesCount       || 0,
    };
});

// GET /invoicing/v2/recent-transactions
// Returns recent non-cancelled documents across all document types, newest first
// limit is passed from frontend (default 10)
exports.getRecentTransactions = asyncHandler(async (corporateUserId, page = 1, itemsPerPage = 5) => {
    const { count, rows } = await invoicingV2.findAndCountAll({
        where: {
            corporateUserId,
            status: { [Op.ne]: 'CANCELLED' },
        },
        attributes: ['id', 'documentType', 'invoiceNumber', 'prefix', 'name', 'cashSale', 'totalAmount', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC'], ['updatedAt', 'DESC']],
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        raw: true,
    });

    return {
        count,
        rows: rows.map(r => ({
            id:            r.id,
            documentType:  r.documentType,
            invoiceNumber: r.prefix ? `${r.prefix}${r.invoiceNumber}` : r.invoiceNumber,
            customerName:  r.name || (r.cashSale ? 'Cash Sale' : 'N/A'),
            totalAmount:   parseFloat(r.totalAmount),
            createdAt:     r.createdAt,
            updatedAt:     r.updatedAt,
        })),
    };
});

// GET /invoicing/v2/payments/overview
// Returns all 3 sections in one call:
//   - dueThisWeek   : PENDING/OVERDUE invoices due Mon–Sun this week
//   - topCustomers  : top 5 customers by total paid amount
//   - recentActivity: last 10 events (Payment Received + Invoice Overdue)
exports.getPaymentsDashboardTopCustomers = asyncHandler(async (corporateUserId) => {
    const { fn, col, literal } = Sequelize;

    const topCustomers = await invoicingV2.findAll({
        where: {
            corporateUserId,
            documentType: 'INVOICE',
            status: 'PAID',
        },
        attributes: [
            'name',
            [fn('SUM', col('totalAmount')), 'totalPaid'],
        ],
        group: ['name'],
        order: [[literal('totalPaid'), 'DESC']],
        limit: 5,
        raw: true,
    });

    return { topCustomers };
});

exports.getPaymentsDashboardDueThisWeek = asyncHandler(async (corporateUserId, page = 1, itemsPerPage = 5) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysSinceMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMon);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const toDateStr = (d) => d.toISOString().split('T')[0];

    const { count, rows } = await invoicingV2.findAndCountAll({
        where: {
            corporateUserId,
            documentType: 'INVOICE',
            status: { [Op.in]: ['PENDING', 'OVERDUE'] },
            dueDate: { [Op.between]: [toDateStr(monday), toDateStr(sunday)] },
        },
        attributes: ['id', 'invoiceNumber', 'name', 'dueDate', 'amountDue', 'status'],
        order: [['dueDate', 'ASC']],
        limit: itemsPerPage,
        offset: (page - 1) * itemsPerPage,
        raw: true,
    });

    return { dueThisWeek: rows, recordsTotal: count };
});

exports.getPaymentsDashboardRecentActivity = asyncHandler(async (corporateUserId, page = 1, itemsPerPage = 5) => {
    const FETCH_LIMIT = 200;
    const now = new Date();
    const toDateStr = (d) => d.toISOString().split('T')[0];

    const [recentPayments, recentOverdue] = await Promise.all([
        manualPayment.findAll({
            where: { corporateUserId },
            include: [{
                model: invoicingV2,
                where: { documentType: 'INVOICE' },
                attributes: ['name', 'cashSale', 'invoiceNumber'],
                required: true,
            }],
            attributes: ['id', 'amount', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: FETCH_LIMIT,
        }),

        invoicingV2.findAll({
            where: {
                corporateUserId,
                documentType: 'INVOICE',
                [Op.or]: [
                    { status: 'OVERDUE' },
                    { status: 'PENDING', dueDate: { [Op.lt]: toDateStr(now) } },
                ],
            },
            attributes: ['id', 'invoiceNumber', 'name', 'amountDue', 'updatedAt'],
            order: [['updatedAt', 'DESC']],
            limit: FETCH_LIMIT,
            raw: true,
        }),
    ]);

    const paymentEvents = recentPayments.map(p => ({
        type:          'PAYMENT_RECEIVED',
        label:         'Payment Received',
        customerName:  p.invoicing?.name || (p.invoicing?.cashSale ? 'Cash Sale' : ''),
        invoiceNumber: p.invoicing?.invoiceNumber || '',
        amount:        parseFloat(p.amount),
        timestamp:     p.createdAt,
    }));

    const overdueEvents = recentOverdue.map(inv => ({
        type:          'INVOICE_OVERDUE',
        label:         'Invoice Overdue',
        customerName:  inv.name,
        invoiceNumber: inv.invoiceNumber,
        amount:        parseFloat(inv.amountDue),
        timestamp:     inv.updatedAt,
    }));

    const merged = [...paymentEvents, ...overdueEvents]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const recordsTotal = merged.length;
    const recentActivity = merged.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return { recentActivity, recordsTotal };
});