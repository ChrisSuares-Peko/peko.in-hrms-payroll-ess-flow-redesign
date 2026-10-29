'use strict';

const asyncHandler     = require('../../../middlewares/async');
const dashboardUseCase = require('../../../models/use-cases/procure/dashboard');
const { customLog }    = require('../../../utils/loggerHelper');

function getCorporateId(req) {
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    return req.user.subCorporateId;
  }
  return req.user.corporateId;
}

function monthRange(monthsAgo = 0) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
// GET /procure/dashboard

exports.getDashboard = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const lastMonth       = monthRange(1);
  const activityLimit   = Math.min(20, parseInt(req.query.activityLimit) || 10);
  const rfqLimit        = Math.min(10, parseInt(req.query.rfqLimit)      || 5);
  const since           = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const now             = new Date();
  const closingSoonLimit = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  // ── KPI queries ──────────────────────────────────────────────────────────────
  const [
    activePOsNow, activePOsLastMonth,
    openRfqsNow,  openRfqsLastMonth,
    committedSpendRow, committedSpendLastMonthRow,
    unpaidInvoicesRow,
  ] = await dashboardUseCase.fetchKpiStats({ corporateUserId, lastMonth });

  const committedSpend        = parseFloat(committedSpendRow?.total)         || 0;
  const committedSpendLastMon = parseFloat(committedSpendLastMonthRow?.total) || 0;

  const stats = {
    activePurchaseOrders: { count: activePOsNow,  vsLastMonth: activePOsNow  - activePOsLastMonth },
    unpaidInvoices:       { count: parseInt(unpaidInvoicesRow?.count, 10) || 0, amount: parseFloat(unpaidInvoicesRow?.amount) || 0 },
    openRfqs:             { count: openRfqsNow,   vsLastMonth: openRfqsNow   - openRfqsLastMonth },
    committedSpend:       { amount: committedSpend, vsLastMonth: committedSpend - committedSpendLastMon, currency: 'INR' },
  };

  // ── RFQs closing soon ────────────────────────────────────────────────────────
  const rfqRows = await dashboardUseCase.fetchActiveRfqs({ corporateUserId, now, closingSoonLimit, rfqLimit });

  const activeRfqs = rfqRows.map((rfq) => {
    const deadline      = rfq.submissionDeadline ? new Date(rfq.submissionDeadline) : null;
    const daysRemaining = deadline ? Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))) : null;
    const invites       = rfq.vendorInvites || [];
    return {
      id:                 rfq.id,
      refNumber:          rfq.refNumber,
      title:              rfq.title,
      type:               rfq.type,
      submissionDeadline: rfq.submissionDeadline,
      estimatedTotal:     rfq.estimatedTotal,
      sentAt:             rfq.sentAt,
      daysRemaining,
      closingSoon:        deadline ? deadline <= closingSoonLimit : false,
      vendorInvites: {
        total:     invites.length,
        submitted: invites.filter((i) => i.status === 'Submitted').length,
        pending:   invites.filter((i) => i.status === 'Invited').length,
        declined:  invites.filter((i) => i.status === 'Declined').length,
      },
    };
  });

  // ── Activity feed ─────────────────────────────────────────────────────────────
  const [recentProposals, recentRfqs, recentPRs, recentPOs, recentInvoices] =
    await dashboardUseCase.fetchActivityFeed({ corporateUserId, since, activityLimit });

  const events = [];

  for (const p of recentProposals) {
    if (p.submittedAt) {
      const vendorLabel = p.vendor?.businessName || 'a vendor';
      const rfqLabel = `${p.rfq?.refNumber || 'RFQ #' + p.rfqId}${p.rfq?.title ? ' — ' + p.rfq.title : ''}`;
      const message = p.submissionMode === 'Offline'
        ? `New proposal uploaded for ${vendorLabel} for ${rfqLabel}`
        : `New proposal received from ${vendorLabel} for ${rfqLabel}`;
      events.push({ type: 'PROPOSAL_RECEIVED', message, date: p.submittedAt, refId: p.rfqId, refType: 'rfq' });
    }
  }
  for (const r of recentRfqs) {
    if (r.sentAt)    events.push({ type: 'RFQ_SENT',    message: `${r.refNumber} — ${r.title} sent to vendors`,        date: r.sentAt,    refId: r.id, refType: 'rfq' });
    if (r.closedAt)  events.push({ type: 'RFQ_CLOSED',  message: `${r.refNumber} — ${r.title} closed for submissions`, date: r.closedAt,  refId: r.id, refType: 'rfq' });
    if (r.awardedAt) events.push({ type: 'RFQ_AWARDED', message: `${r.refNumber} — ${r.title} awarded`,               date: r.awardedAt, refId: r.id, refType: 'rfq' });
  }
  for (const pr of recentPRs) {
    if (pr.submittedAt) events.push({ type: 'PR_SUBMITTED', message: `${pr.refNumber} — ${pr.title} submitted for approval`, date: pr.submittedAt, refId: pr.id, refType: 'purchase_request' });
    if (pr.approvedAt)  events.push({ type: 'PR_APPROVED',  message: `${pr.refNumber} — ${pr.title} approved`,              date: pr.approvedAt,  refId: pr.id, refType: 'purchase_request' });
    if (pr.rejectedAt)  events.push({ type: 'PR_REJECTED',  message: `${pr.refNumber} — ${pr.title} rejected`,              date: pr.rejectedAt,  refId: pr.id, refType: 'purchase_request' });
  }
  for (const po of recentPOs) {
    if (po.sentAt) events.push({ type: 'PO_SENT',    message: `${po.refNumber} sent to ${po.vendor?.businessName || 'vendor'}`, date: po.sentAt,    refId: po.id, refType: 'purchase_order' });
    else           events.push({ type: 'PO_CREATED', message: `Draft ${po.refNumber} created`,                                  date: po.createdAt, refId: po.id, refType: 'purchase_order' });
  }
  for (const inv of recentInvoices) {
    events.push({ type: 'INVOICE_RECEIVED', message: `Invoice ${inv.invoiceNumber} received and queued for review`, date: inv.createdAt, refId: inv.id, refType: 'invoice' });
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  return res.status(200).json({
    status: true,
    message: 'Dashboard fetched successfully',
    data: {
      stats,
      activeRfqs,
      activity: events.slice(0, activityLimit),
    },
    responseCode: '000',
  });
});

// ─── ACTIVITY (paginated + filterable) ───────────────────────────────────────

exports.getActivity = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);

  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.min(100, parseInt(req.query.limit) || 20);
  const search    = (req.query.search || '').trim().toLowerCase();
  const startDate = req.query.startDate || null;
  const endDate   = req.query.endDate   || null;
  const since     = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year default window

  const [recentProposals, recentRfqs, recentPRs, recentPOs, recentInvoices] =
    await dashboardUseCase.fetchActivityPage({ corporateUserId, since, search, startDate, endDate });

  const events = [];

  for (const p of recentProposals) {
    if (p.submittedAt) {
      const vendorLabel = p.vendor?.businessName || 'a vendor';
      const rfqLabel    = `${p.rfq?.refNumber || 'RFQ #' + p.rfqId}${p.rfq?.title ? ' — ' + p.rfq.title : ''}`;
      const message     = p.submissionMode === 'Offline'
        ? `New proposal uploaded for ${vendorLabel} for ${rfqLabel}`
        : `New proposal received from ${vendorLabel} for ${rfqLabel}`;
      events.push({ type: 'PROPOSAL_RECEIVED', message, date: p.submittedAt, refId: p.rfqId, refType: 'rfq' });
    }
  }
  for (const r of recentRfqs) {
    if (r.sentAt)    events.push({ type: 'RFQ_SENT',    message: `${r.refNumber} — ${r.title} sent to vendors`,        date: r.sentAt,    refId: r.id, refType: 'rfq' });
    if (r.closedAt)  events.push({ type: 'RFQ_CLOSED',  message: `${r.refNumber} — ${r.title} closed for submissions`, date: r.closedAt,  refId: r.id, refType: 'rfq' });
    if (r.awardedAt) events.push({ type: 'RFQ_AWARDED', message: `${r.refNumber} — ${r.title} awarded`,               date: r.awardedAt, refId: r.id, refType: 'rfq' });
  }
  for (const pr of recentPRs) {
    if (pr.submittedAt) events.push({ type: 'PR_SUBMITTED', message: `${pr.refNumber} — ${pr.title} submitted for approval`, date: pr.submittedAt, refId: pr.id, refType: 'purchase_request' });
    if (pr.approvedAt)  events.push({ type: 'PR_APPROVED',  message: `${pr.refNumber} — ${pr.title} approved`,              date: pr.approvedAt,  refId: pr.id, refType: 'purchase_request' });
    if (pr.rejectedAt)  events.push({ type: 'PR_REJECTED',  message: `${pr.refNumber} — ${pr.title} rejected`,              date: pr.rejectedAt,  refId: pr.id, refType: 'purchase_request' });
  }
  for (const po of recentPOs) {
    if (po.sentAt) events.push({ type: 'PO_SENT',    message: `${po.refNumber} sent to ${po.vendor?.businessName || 'vendor'}`, date: po.sentAt,    refId: po.id, refType: 'purchase_order' });
    else           events.push({ type: 'PO_CREATED', message: `Draft ${po.refNumber} created`,                                  date: po.createdAt, refId: po.id, refType: 'purchase_order' });
  }
  for (const inv of recentInvoices) {
    events.push({ type: 'INVOICE_RECEIVED', message: `Invoice ${inv.invoiceNumber} received and queued for review`, date: inv.createdAt, refId: inv.id, refType: 'invoice' });
  }

  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Apply search filter
  const filtered = search
    ? events.filter(e => e.message.toLowerCase().includes(search))
    : events;

  // Apply date range filter
  const dateFiltered = filtered.filter(e => {
    const d = new Date(e.date);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate   && d > new Date(new Date(endDate).setHours(23, 59, 59, 999))) return false;
    return true;
  });

  const total  = dateFiltered.length;
  const offset = (page - 1) * limit;
  const data   = dateFiltered.slice(offset, offset + limit);

  return res.status(200).json({
    status: true,
    message: 'Activity fetched successfully',
    data: { data, total, page, limit },
    responseCode: '000',
  });
});

// ─── CHARTS ───────────────────────────────────────────────────────────────────
// GET /procure/dashboard/charts

exports.getCharts = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);

  customLog(req?.LogTraceId, "info", { message: "fetchCharts called", corporateUserId });

  let categoryRows, poStatusRows;
  try {
    [categoryRows, poStatusRows] = await dashboardUseCase.fetchCharts({ corporateUserId });
    customLog(req?.LogTraceId, "info", { message: "fetchCharts success", corporateUserId });
  } catch (err) {
    customLog(req?.LogTraceId, "error", { message: "fetchCharts failed", corporateUserId, errMsg: err?.message, stack: err?.stack });
    throw err;
  }

  const totalSpend = categoryRows.reduce((acc, r) => acc + (parseFloat(r.amount) || 0), 0);
  const totalPOs   = poStatusRows.reduce((acc, r) => acc + parseInt(r.count, 10), 0);

  return res.status(200).json({
    status: true,
    message: 'Dashboard charts fetched successfully',
    data: {
      spendByCategory: {
        total: totalSpend,
        categories: categoryRows.map((r) => ({
          category:   r.category,
          amount:     parseFloat(r.amount) || 0,
          count:      parseInt(r.count, 10),
          percentage: totalSpend > 0 ? Math.round((parseFloat(r.amount) / totalSpend) * 100) : 0,
        })),
      },
      poStatus: {
        total: totalPOs,
        statuses: poStatusRows.map((r) => ({
          status:     r.status,
          count:      parseInt(r.count, 10),
          percentage: totalPOs > 0 ? Math.round((parseInt(r.count, 10) / totalPOs) * 100) : 0,
        })),
      },
    },
    responseCode: '000',
  });
});
