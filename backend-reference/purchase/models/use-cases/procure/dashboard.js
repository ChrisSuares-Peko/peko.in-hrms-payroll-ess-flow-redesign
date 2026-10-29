'use strict';

const { Op, fn, col, QueryTypes } = require('sequelize');
const sequelize       = require('../../../configs/database/index');
const RFQ             = require('../../entities/RFQ');
const RFQVendorInvite = require('../../entities/RFQVendorInvite');
const ProcureVendor   = require('../../entities/ProcureVendor');
const PurchaseRequest = require('../../entities/PurchaseRequest');
const PurchaseOrder   = require('../../entities/PurchaseOrder');
const ProcureInvoice  = require('../../entities/ProcureInvoice');
const Proposal        = require('../../entities/Proposal');

const ACTIVE_PO_STATUSES  = ['Draft', 'PO Issued'];
const OPEN_RFQ_STATUSES   = ['Draft', 'Sent', 'Closed'];
const UNPAID_INV_STATUSES = ['Pending', 'Verified', 'Approved'];

// ─── KPI Stats ────────────────────────────────────────────────────────────────

exports.fetchKpiStats = async ({ corporateUserId, lastMonth }) => {
  return Promise.all([
    PurchaseOrder.count({ where: { corporateUserId, status: { [Op.in]: ACTIVE_PO_STATUSES } } }),
    PurchaseOrder.count({ where: { corporateUserId, status: { [Op.in]: ACTIVE_PO_STATUSES }, createdAt: { [Op.between]: [lastMonth.start, lastMonth.end] } } }),
    RFQ.count({ where: { corporateUserId, status: { [Op.in]: OPEN_RFQ_STATUSES } } }),
    RFQ.count({ where: { corporateUserId, status: { [Op.in]: OPEN_RFQ_STATUSES }, createdAt: { [Op.between]: [lastMonth.start, lastMonth.end] } } }),
    ProcureInvoice.findOne({ where: { corporateUserId, status: 'Paid' }, attributes: [[fn('SUM', col('amount')), 'total']], raw: true }),
    ProcureInvoice.findOne({ where: { corporateUserId, status: 'Paid', createdAt: { [Op.between]: [lastMonth.start, lastMonth.end] } }, attributes: [[fn('SUM', col('amount')), 'total']], raw: true }),
    ProcureInvoice.findOne({ where: { corporateUserId, status: { [Op.in]: UNPAID_INV_STATUSES } }, attributes: [[fn('COUNT', col('id')), 'count'], [fn('SUM', col('amount')), 'amount']], raw: true }),
  ]);
};

// ─── Active RFQs (closing soon) ───────────────────────────────────────────────

exports.fetchActiveRfqs = async ({ corporateUserId, now, closingSoonLimit, rfqLimit }) => {
  // First try RFQs closing within 5 days
  const closingSoon = await RFQ.findAll({
    where: {
      corporateUserId,
      status:             'Sent',
      submissionDeadline: { [Op.between]: [now, closingSoonLimit] },
    },
    attributes: ['id', 'refNumber', 'title', 'type', 'submissionDeadline', 'estimatedTotal', 'sentAt'],
    include: [{ model: RFQVendorInvite, as: 'vendorInvites', attributes: ['id', 'status'] }],
    order: [['submissionDeadline', 'ASC']],
    limit: rfqLimit,
  });

  if (closingSoon.length > 0) return closingSoon;

  // Fallback: return next upcoming open RFQs even if beyond 5 days
  return RFQ.findAll({
    where: {
      corporateUserId,
      status:             'Sent',
      submissionDeadline: { [Op.gt]: now },
    },
    attributes: ['id', 'refNumber', 'title', 'type', 'submissionDeadline', 'estimatedTotal', 'sentAt'],
    include: [{ model: RFQVendorInvite, as: 'vendorInvites', attributes: ['id', 'status'] }],
    order: [['submissionDeadline', 'ASC']],
    limit: rfqLimit,
  });
};

// ─── Activity Feed ────────────────────────────────────────────────────────────

exports.fetchActivityFeed = async ({ corporateUserId, since, activityLimit }) => {
  return Promise.all([
    Proposal.findAll({
      where: { submittedAt: { [Op.gte]: since } },
      include: [
        { model: ProcureVendor, as: 'vendor', attributes: ['businessName'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'refNumber', 'title'], where: { corporateUserId }, required: true },
      ],
      order: [['submittedAt', 'DESC']],
      limit: activityLimit * 2,
    }).catch(() => []),

    RFQ.findAll({
      where: { corporateUserId, [Op.or]: [{ sentAt: { [Op.gte]: since } }, { closedAt: { [Op.gte]: since } }, { awardedAt: { [Op.gte]: since } }] },
      attributes: ['id', 'refNumber', 'title', 'sentAt', 'closedAt', 'awardedAt'],
      order: [['updatedAt', 'DESC']],
      limit: activityLimit * 2,
    }).catch(() => []),

    PurchaseRequest.findAll({
      where: { corporateUserId, status: { [Op.in]: ['Submitted', 'Approved', 'Rejected'] }, updatedAt: { [Op.gte]: since } },
      attributes: ['id', 'refNumber', 'title', 'submittedAt', 'approvedAt', 'rejectedAt'],
      order: [['updatedAt', 'DESC']],
      limit: activityLimit * 2,
    }).catch(() => []),

    PurchaseOrder.findAll({
      where: { corporateUserId, updatedAt: { [Op.gte]: since } },
      attributes: ['id', 'refNumber', 'status', 'sentAt', 'createdAt'],
      include: [{ model: ProcureVendor, as: 'vendor', attributes: ['businessName'] }],
      order: [['updatedAt', 'DESC']],
      limit: activityLimit * 2,
    }).catch(() => []),

    ProcureInvoice.findAll({
      where: { corporateUserId, createdAt: { [Op.gte]: since } },
      attributes: ['id', 'invoiceNumber', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: activityLimit * 2,
    }).catch(() => []),
  ]);
};

// ─── Activity Feed (paginated, filterable) ────────────────────────────────────

exports.fetchActivityPage = async ({ corporateUserId, since, startDate, endDate }) => {
  const dateFilter = (field) => {
    const cond = {};
    if (since) cond[Op.gte] = since;
    if (startDate) cond[Op.gte] = new Date(startDate);
    if (endDate)   cond[Op.lte] = new Date(endDate);
    return Object.keys(cond).length ? { [field]: cond } : {};
  };

  const BIG = 500;

  return Promise.all([
    Proposal.findAll({
      where: { submittedAt: { [Op.ne]: null }, ...dateFilter('submittedAt') },
      include: [
        { model: ProcureVendor, as: 'vendor', attributes: ['businessName'] },
        { model: RFQ, as: 'rfq', attributes: ['id', 'refNumber', 'title'], where: { corporateUserId }, required: true },
      ],
      order: [['submittedAt', 'DESC']],
      limit: BIG,
    }).catch(() => []),

    RFQ.findAll({
      where: {
        corporateUserId,
        [Op.or]: [{ sentAt: { [Op.ne]: null } }, { closedAt: { [Op.ne]: null } }, { awardedAt: { [Op.ne]: null } }],
      },
      attributes: ['id', 'refNumber', 'title', 'sentAt', 'closedAt', 'awardedAt'],
      order: [['updatedAt', 'DESC']],
      limit: BIG,
    }).catch(() => []),

    PurchaseRequest.findAll({
      where: { corporateUserId, status: { [Op.in]: ['Submitted', 'Approved', 'Rejected'] } },
      attributes: ['id', 'refNumber', 'title', 'submittedAt', 'approvedAt', 'rejectedAt'],
      order: [['updatedAt', 'DESC']],
      limit: BIG,
    }).catch(() => []),

    PurchaseOrder.findAll({
      where: { corporateUserId },
      attributes: ['id', 'refNumber', 'status', 'sentAt', 'createdAt'],
      include: [{ model: ProcureVendor, as: 'vendor', attributes: ['businessName'] }],
      order: [['updatedAt', 'DESC']],
      limit: BIG,
    }).catch(() => []),

    ProcureInvoice.findAll({
      where: { corporateUserId },
      attributes: ['id', 'invoiceNumber', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: BIG,
    }).catch(() => []),
  ]);
};

// ─── Charts ───────────────────────────────────────────────────────────────────

exports.fetchCharts = async ({ corporateUserId }) => {
  return Promise.all([
    sequelize.query(
      `SELECT COALESCE(pr.category, 'Uncategorized') AS category, SUM(pi.amount) AS amount, COUNT(DISTINCT po.id) AS \`count\`
       FROM procure_invoices pi
       INNER JOIN purchase_orders po ON pi.purchaseOrderId = po.id AND po.deletedAt IS NULL
       LEFT JOIN purchase_requests pr ON po.purchaseRequestId = pr.id AND pr.deletedAt IS NULL
       WHERE pi.corporateUserId = :corporateUserId
         AND pi.deletedAt IS NULL
         AND pi.status = 'Paid'
       GROUP BY COALESCE(pr.category, 'Uncategorized')
       ORDER BY amount DESC`,
      { replacements: { corporateUserId }, type: QueryTypes.SELECT },
    ),

    PurchaseOrder.findAll({
      where: { corporateUserId },
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      group: ['status'],
      raw: true,
    }),
  ]);
};
