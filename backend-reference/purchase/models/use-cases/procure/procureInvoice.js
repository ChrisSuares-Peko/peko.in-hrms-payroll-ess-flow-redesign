'use strict';

const { Op, Sequelize, fn, col } = require('sequelize');
const ProcureInvoice = require('../../entities/ProcureInvoice');
const PurchaseOrder  = require('../../entities/PurchaseOrder');
const ProcureVendor  = require('../../entities/ProcureVendor');

const INVOICE_INCLUDE = [
  {
    model: PurchaseOrder,
    as: 'purchaseOrder',
    attributes: ['id', 'refNumber', 'currency', 'totalAmount', 'status'],
    include: [{ model: ProcureVendor, as: 'vendor', attributes: ['id', 'businessName', 'email', 'phone', 'bankName', 'accountNumber', 'ifscCode', 'payoutBeneficiaryId'] }],
  },
];

exports.findPurchaseOrder = async ({ id, corporateUserId }) => {
  return PurchaseOrder.findOne({ where: { id, corporateUserId } });
};

exports.createInvoice = async ({ corporateUserId, purchaseOrderId, vendorId, data }) => {
  return ProcureInvoice.create({ corporateUserId, purchaseOrderId, vendorId, ...data });
};

exports.listInvoices = async ({ corporateUserId, purchaseOrderId, status, paymentStatus, searchText, page, limit }) => {
  const where = { corporateUserId };
  if (purchaseOrderId) where.purchaseOrderId = purchaseOrderId;
  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (searchText) {
    const search = `%${searchText.toLowerCase()}%`;
    where[Op.or] = [
      Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('procureInvoice.invoiceNumber')), { [Op.like]: search }),
      { invoiceDate: { [Op.like]: `%${searchText}%` } },
      Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('purchaseOrder.refNumber')), { [Op.like]: search }),
      Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('purchaseOrder->vendor.businessName')), { [Op.like]: search }),
      Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('procureInvoice.status')), { [Op.like]: search }),
      Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('procureInvoice.paymentStatus')), { [Op.like]: search }),
      Sequelize.where(Sequelize.cast(Sequelize.col('procureInvoice.amount'), 'CHAR'), { [Op.like]: search }),
    ];
  }

  const offset = (page - 1) * limit;

  const result = await ProcureInvoice.findAndCountAll({
    where,
    include: INVOICE_INCLUDE,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    subQuery: false,
  });

  return { rows: result.rows, count: result.count };
};

exports.getInvoiceById = async ({ id, corporateUserId }) => {
  return ProcureInvoice.findOne({ where: { id, corporateUserId }, include: INVOICE_INCLUDE });
};

exports.updateInvoice = async ({ id, corporateUserId, data }) => {
  const invoice = await ProcureInvoice.findOne({ where: { id, corporateUserId } });
  if (!invoice) return null;
  return invoice.update(data);
};

exports.deleteInvoice = async ({ id, corporateUserId }) => {
  const invoice = await ProcureInvoice.findOne({ where: { id, corporateUserId } });
  if (!invoice) return null;
  await invoice.destroy();
  return true;
};

exports.sumInvoiceAmounts = async ({ purchaseOrderId, corporateUserId }) => {
  const result = await ProcureInvoice.findOne({
    where: { purchaseOrderId, corporateUserId, status: { [Op.notIn]: ['Rejected'] } },
    attributes: [[fn('SUM', col('amount')), 'total']],
    raw: true,
  });
  return parseFloat(result?.total) || 0;
};

exports.hasOutstandingInvoices = async ({ purchaseOrderId, corporateUserId }) => {
  const count = await ProcureInvoice.count({
    where: { purchaseOrderId, corporateUserId, status: { [Op.in]: ['Pending', 'Verified', 'Approved'] } },
  });
  return count > 0;
};

exports.closePoIfFullyPaid = async ({ purchaseOrderId, corporateUserId }) => {
  const [paidCount, unpaidCount] = await Promise.all([
    ProcureInvoice.count({ where: { purchaseOrderId, corporateUserId, status: 'Paid' } }),
    ProcureInvoice.count({ where: { purchaseOrderId, corporateUserId, status: { [Op.in]: ['Pending', 'Verified', 'Approved'] } } }),
  ]);
  if (paidCount === 0 || unpaidCount > 0) return false;
  const po = await PurchaseOrder.findOne({ where: { id: purchaseOrderId, corporateUserId, status: { [Op.in]: ['Draft', 'PO Issued'] } } });
  if (!po) return false;
  await po.update({ status: 'Closed', completedAt: new Date() });
  return true;
};
