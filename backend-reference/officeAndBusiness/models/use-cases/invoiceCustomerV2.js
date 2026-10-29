const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const InvoiceCustomerV2 = require("../entities/invoiceCustomerV2");
const invoicingV2 = require("../entities/invoicingV2");
const sequelizeConfig = require("../../configs/database/index");

exports.createInvoiceCustomerV2 = asyncHandler(async (data) => {
  const created = await InvoiceCustomerV2.create(data);
  return created || false;
});

exports.checkEmailExistV2 = asyncHandler(async (email, corporateUserId, id = undefined) => {
  let whereClause = { email, corporateUserId };
  if (id) {
    whereClause.id = { [Op.ne]: id };
  }
  return await InvoiceCustomerV2.findOne({ where: whereClause });
});

exports.checkGstinExist = asyncHandler(async (gstin, corporateUserId, id = undefined) => {
  let whereClause = { gstin, corporateUserId };
  if (id) {
    whereClause.id = { [Op.ne]: id };
  }
  return await InvoiceCustomerV2.findOne({ where: whereClause });
});

exports.checkPhoneNumberExistV2 = asyncHandler(async (phoneNumber, corporateUserId, id = undefined) => {
  let whereClause = { phoneNumber, corporateUserId };
  if (id) {
    whereClause.id = { [Op.ne]: id };
  }
  return await InvoiceCustomerV2.findOne({ where: whereClause });
});

exports.getAllInvoiceCustomersV2 = asyncHandler(async ({ searchText, sort, sortField, limit, offset, corporateUserId, status, startDate, endDate }) => {
  const whereClause = {
    corporateUserId,
    [Op.or]: [
      { name: { [Op.like]: '%' + searchText + '%' } },
      { email: { [Op.like]: '%' + searchText + '%' } },
      { phoneNumber: { [Op.like]: '%' + searchText + '%' } },
      { gstin: { [Op.like]: '%' + searchText + '%' } },
    ],
  };

  // Filter by status (ACTIVE / INACTIVE)
  if (status) {
    whereClause.status = status;
  }

  // Filter by date range
  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [
        new Date(startDate),
        new Date(new Date(endDate).setHours(23, 59, 59, 999)),
      ],
    };
  } else if (startDate) {
    whereClause.createdAt = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    whereClause.createdAt = { [Op.lte]: new Date(new Date(endDate).setHours(23, 59, 59, 999)) };
  }

  const orderType = sort === 'ASC' ? 'ASC' : 'DESC';
  const orderField = sortField || 'id';

  const result = await InvoiceCustomerV2.findAndCountAll({
    where: whereClause,
    order: [[orderField, orderType]],
    limit,
    offset,
    distinct: true,
  });

  // Attach total transaction count and invoice count per customer
  const rows = await Promise.all(result.rows.map(async (customer) => {
    const [transactions, invoiceCount] = await Promise.all([
      invoicingV2.count({
        where: { customerId: customer.id, status: { [Op.ne]: 'CANCELLED' } },
      }),
      invoicingV2.count({
        where: { customerId: customer.id, documentType: 'INVOICE', status: { [Op.ne]: 'CANCELLED' } },
      }),
    ]);
    const plain = customer.toJSON();
    plain.transactions = transactions || 0;
    plain.invoiceCount = invoiceCount || 0;
    return plain;
  }));

  return { count: result.count, rows };
});

exports.updateInvoiceCustomerV2 = asyncHandler(async (id, corporateUserId, data, fetchOnly = false) => {
  const customer = await InvoiceCustomerV2.findOne({ where: { id, corporateUserId } });
  if (!customer) return null;
  if (fetchOnly) return customer;
  return await customer.update(data);
});

exports.deleteInvoiceCustomerV2 = asyncHandler(async (id, corporateUserId) => {
  const customer = await InvoiceCustomerV2.findOne({ where: { id, corporateUserId } });
  if (!customer) return null;
  await customer.destroy();
  return true;
});

exports.getCustomerDashboard = asyncHandler(async (corporateUserId) => {
  const { fn, col, literal } = sequelizeConfig.Sequelize;

  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const totalCustomers = await InvoiceCustomerV2.count({ where: { corporateUserId } });

  const activeCustomers = await InvoiceCustomerV2.count({
    where: { corporateUserId, status: 'ACTIVE' },
  });

  const revenueResult = await invoicingV2.findOne({
    where: { corporateUserId, status: 'PAID' },
    attributes: [
      [fn('SUM', col('totalAmount')), 'totalRevenue'],
      [fn('COUNT', col('id')), 'paidCount'],
    ],
    raw: true,
  });

  const totalRevenue = parseFloat(revenueResult?.totalRevenue || 0);
  const paidCount = parseInt(revenueResult?.paidCount || 0);
  const avgTransaction = paidCount > 0 ? totalRevenue / paidCount : 0;

  // ── Total invoice count for % of total calculation ─────────────────────────
  const totalInvoiceCount = await invoicingV2.count({
    where: { corporateUserId, status: { [Op.ne]: 'CANCELLED' } },
  });

  // ── Top 4 customers by revenue ─────────────────────────────────────────────
  const topByRevenue = await invoicingV2.findAll({
    where: { corporateUserId, customerId: { [Op.ne]: null }, status: { [Op.ne]: 'CANCELLED' } },
    attributes: [
      'customerId',
      [fn('SUM', col('invoicings.totalAmount')), 'totalRevenue'],
      [fn('COUNT', col('invoicings.id')), 'transactionCount'],
    ],
    include: [{
      model: InvoiceCustomerV2,
      attributes: ['name'],
      required: true,
    }],
    group: ['invoicings.customerId', 'invoiceCustomerV2.id'],
    order: [[literal('totalRevenue'), 'DESC']],
    limit: 4,
    subQuery: false,
    raw: true,
    nest: true,
  });

  // Compute % change vs last month per customer
  const topByRevenueWithChange = await Promise.all(topByRevenue.map(async (row) => {
    const thisMonth = await invoicingV2.sum('totalAmount', {
      where: {
        corporateUserId,
        customerId: row.customerId,
        status: { [Op.ne]: 'CANCELLED' },
        createdAt: { [Op.gte]: startOfThisMonth },
      },
    });
    const lastMonth = await invoicingV2.sum('totalAmount', {
      where: {
        corporateUserId,
        customerId: row.customerId,
        status: { [Op.ne]: 'CANCELLED' },
        createdAt: { [Op.gte]: startOfLastMonth, [Op.lt]: startOfThisMonth },
      },
    });
    const curr = parseFloat(thisMonth || 0);
    const prev = parseFloat(lastMonth || 0);
    let changePercent = 0;
    if (prev === 0 && curr > 0) changePercent = 100;
    else if (prev > 0) changePercent = Math.max(-100, Math.min(100, Math.round(((curr - prev) / prev) * 100)));

    return {
      customerId: row.customerId,
      name: row.invoiceCustomerV2?.name || '',
      totalRevenue: parseFloat(row.totalRevenue || 0),
      transactionCount: parseInt(row.transactionCount || 0),
      changePercent,
    };
  }));

  // ── Top 4 customers by transactions ───────────────────────────────────────
  const topByTransactions = await invoicingV2.findAll({
    where: { corporateUserId, customerId: { [Op.ne]: null }, status: { [Op.ne]: 'CANCELLED' } },
    attributes: [
      'customerId',
      [fn('COUNT', col('invoicings.id')), 'transactionCount'],
      [fn('SUM', col('invoicings.totalAmount')), 'totalRevenue'],
    ],
    include: [{
      model: InvoiceCustomerV2,
      attributes: ['name'],
      required: true,
    }],
    group: ['invoicings.customerId', 'invoiceCustomerV2.id'],
    order: [[literal('transactionCount'), 'DESC']],
    limit: 4,
    subQuery: false,
    raw: true,
    nest: true,
  });

  const topByTransactionsMapped = topByTransactions.map(row => {
    const count = parseInt(row.transactionCount || 0);
    return {
      customerId: row.customerId,
      name: row.invoiceCustomerV2?.name || '',
      totalRevenue: parseFloat(row.totalRevenue || 0),
      transactionCount: count,
      percentOfTotal: totalInvoiceCount > 0 ? Math.round((count / totalInvoiceCount) * 100) : 0,
    };
  });

  return {
    totalCustomers,
    activeCustomers,
    totalRevenue,
    avgTransaction: parseFloat(avgTransaction.toFixed(2)),
    topByRevenue: topByRevenueWithChange,
    topByTransactions: topByTransactionsMapped,
  };
});

