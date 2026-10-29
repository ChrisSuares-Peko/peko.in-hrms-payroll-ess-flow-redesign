'use strict';

const os             = require('os');
const path           = require('path');
const fs             = require('fs');
const crypto         = require('crypto');
const asyncHandler   = require('../../../middlewares/async');
const ErrorResponse  = require('../../../utils/error-response');
const { generate }   = require('../../../services/procure/refNumberService');
const { DEFAULT_FALLBACK_EMAIL } = require('../../../utils/constants');
const {
  createWithLineItems, convertPurchaseRequest, findByPkFull, findPurchaseRequestById,
  findAllSimple, findAll, findById, findByIdSimple,
  findCorporateUser, updateWithLineItems, updateStatus,
  destroy, findForJourney, findRfqById, findPurchaseRequestIdByProposal,
  findBilledTotals, cancel: cancelPo,
} = require('../../../models/use-cases/procure/purchaseOrder');
const { findVendorById } = require('../../../models/use-cases/procure/procureVendor');
const { hasOutstandingInvoices } = require('../../../models/use-cases/procure/procureInvoice');
const { purchaseOrderTemplate }               = require('../../../utils/emailTemplate/purchaseOrderTemplate');
const { poIssuedTemplate, buildPoIssuedSubject } = require('../../../utils/emailTemplate/poIssuedTemplate');
const { poCancelledTemplate, buildPoCancelledSubject } = require('../../../utils/emailTemplate/poCancelledTemplate');
const { customLog }                           = require('../../../utils/loggerHelper');
const { puppeteerPdfBufferGenerator }         = require('../../../utils/puppeteer');
const emailer                                 = require('../../../utils/emailer');
const { resolveEmailTemplate } = require('../../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../../utils/emailTemplate/sharedLayout');


function getCorporateId(req) {
  return req.user.corporateId;
}

function computeTotals(lineItems) {
  let total = 0;

  const computed = lineItems.map((item, idx) => {
    const qty       = parseFloat(item.qty);
    const unitPrice = parseFloat(item.unitPrice);
    const taxRate   = parseFloat(item.taxRate) || 0;
    const gstType   = item.gstType || 'exclusive';
    const base      = qty * unitPrice;
    const lineTotal = parseFloat((gstType === 'inclusive' ? base : base * (1 + taxRate / 100)).toFixed(2));
    total += lineTotal;
    return {
      proposalLineItemId: item.proposalLineItemId || null,
      description:        item.description,
      qty,
      unit:               item.unit || null,
      unitPrice,
      taxRate:            taxRate || null,
      gstType:            item.gstType || null,
      total:              lineTotal,
      sortOrder:          item.sortOrder ?? idx,
    };
  });

  return {
    lineItems:   computed,
    subtotal:    parseFloat(total.toFixed(2)),
    taxAmount:   0,
    totalAmount: parseFloat(total.toFixed(2)),
  };
}

// Receipts aren't tracked yet, so billing (invoices) is the only signal for what has happened against a PO.
function billingState(po, billed) {
  if (billed <= 0) return 'NONE';
  return billed >= parseFloat(po.totalAmount || 0) ? 'FULL' : 'PARTIAL';
}

function attachBilling(po, totals) {
  const billed = totals[po.id] || 0;
  po.dataValues.billedAmount = billed.toFixed(2);
  po.dataValues.billingState = billingState(po, billed);
  return po;
}

async function getBillingState(po) {
  const totals = await findBilledTotals([po.id]);
  return billingState(po, totals[po.id] || 0);
}

const ALLOWED_SORT = ['createdAt', 'updatedAt', 'status', 'totalAmount', 'refNumber'];

// ─── CREATE ──────────────────────────────────────────────────────────────────

exports.create = asyncHandler(async (req, res,next) => {
  const corporateUserId = getCorporateId(req);
  const {
    vendorId, title, proposalId, rfqId, purchaseRequestId,
    currency, deliveryAddress, deliveryDate,
    paymentTerms, notesToVendor, internalNotes,
    lineItems: rawItems,
  } = req.body;

  const vendor = await findVendorById({ id: vendorId, corporateUserId });
  if (!vendor) return next(new ErrorResponse('Vendor not found', 404));
  if (vendor.status !== 'Active') return next(new ErrorResponse('Cannot create a purchase order for an inactive vendor', 400));

  let resolvedPurchaseRequestId = purchaseRequestId || null;

  if (proposalId && !resolvedPurchaseRequestId) {
    resolvedPurchaseRequestId = await findPurchaseRequestIdByProposal(proposalId);
  }

  if (resolvedPurchaseRequestId) {
    const pr = await findPurchaseRequestById(resolvedPurchaseRequestId, corporateUserId);
    if (!pr) return next(new ErrorResponse('Purchase request not found', 404));
  }

  const { lineItems, subtotal, taxAmount, totalAmount } = computeTotals(rawItems);
  const refNumber = await generate('PO', corporateUserId);

  const po = await createWithLineItems({
    corporateUserId, refNumber, vendorId, title: title || null, proposalId, rfqId: rfqId || null,
    purchaseRequestId: resolvedPurchaseRequestId,
    currency, deliveryAddress, deliveryDate, paymentTerms, notesToVendor,
    internalNotes, subtotal, taxAmount, totalAmount, lineItems,
  });

  if (resolvedPurchaseRequestId) {
    await convertPurchaseRequest(resolvedPurchaseRequestId, corporateUserId);
  }

  const result = await findByPkFull(po.id);

  return res.status(201).json({
    status: true,
    message: 'Purchase order created successfully',
    data: result,
    responseCode: '000',
  });
});

// ─── LIST ALL (dropdown) ─────────────────────────────────────────────────────

exports.listAll = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const rows = await findAllSimple(corporateUserId);

  return res.status(200).json({
    status: true,
    message: 'Purchase orders fetched successfully',
    data: rows,
    responseCode: '000',
  });
});

// ─── LIST ────────────────────────────────────────────────────────────────────

exports.list = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { status, vendorId, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
  const searchText = (req.query.search || req.query.searchText || '').trim() || undefined;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const offset = (page - 1) * limit;

  const safeSortBy    = ALLOWED_SORT.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const { rows, count } = await findAll({
    corporateUserId, status, vendorId, searchText,
    safeSortBy, safeSortOrder, limit, offset,
  });

  const totals = await findBilledTotals(rows.map((r) => r.id));
  rows.forEach((r) => attachBilling(r, totals));

  return res.status(200).json({
    status: true,
    message: 'Purchase orders fetched successfully',
    data: { rows, count },
    responseCode: '000',
  });
});

// ─── GET BY ID ───────────────────────────────────────────────────────────────

exports.getById = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const po = await findById({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));

  attachBilling(po, await findBilledTotals([po.id]));

  return res.status(200).json({
    status: true,
    message: 'Purchase order fetched successfully',
    data: po,
    responseCode: '000',
  });
});

// ─── DOCUMENT ────────────────────────────────────────────────────────────────

exports.getDocument = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const [po, corporate] = await Promise.all([
    findById({ id, corporateUserId }),
    findCorporateUser(corporateUserId),
  ]);
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));

  return res.status(200).json({
    status: true,
    message: 'Purchase order document fetched successfully',
    data: { po, corporate },
    responseCode: '000',
  });
});

// ─── DOWNLOAD PDF ────────────────────────────────────────────────────────────

exports.downloadPdf = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const [po, corporate] = await Promise.all([
    findById({ id, corporateUserId }),
    findCorporateUser(corporateUserId),
  ]);
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));

  const html = purchaseOrderTemplate({ po, corporate });
  const { status, buffer, message } = await puppeteerPdfBufferGenerator({ html });

  if (!status || !buffer) return next(new ErrorResponse(message || 'Failed to generate PDF', 500));

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${po.refNumber}.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  return res.end(buffer);
});

// ─── UPDATE (Draft only) ──────────────────────────────────────────────────────

exports.update = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const po = await findByIdSimple({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));
  if (po.status !== 'Draft') return next(new ErrorResponse('Only Draft purchase orders can be edited', 400));

  const { lineItems: rawItems, ...fields } = req.body;

  const updates = {};
  if (fields.title              !== undefined) updates.title              = fields.title;
  if (fields.vendorId           !== undefined) updates.vendorId           = fields.vendorId;
  if (fields.rfqId              !== undefined) updates.rfqId              = fields.rfqId;
  if (fields.purchaseRequestId  !== undefined) updates.purchaseRequestId  = fields.purchaseRequestId;
  if (fields.currency           !== undefined) updates.currency           = fields.currency;
  if (fields.deliveryAddress    !== undefined) updates.deliveryAddress    = fields.deliveryAddress;
  if (fields.deliveryDate       !== undefined) updates.deliveryDate       = fields.deliveryDate;
  if (fields.paymentTerms       !== undefined) updates.paymentTerms       = fields.paymentTerms;
  if (fields.notesToVendor      !== undefined) updates.notesToVendor      = fields.notesToVendor;
  if (fields.internalNotes      !== undefined) updates.internalNotes      = fields.internalNotes;

  let lineItems;
  if (rawItems) {
    const totals = computeTotals(rawItems);
    updates.subtotal    = totals.subtotal;
    updates.taxAmount   = totals.taxAmount;
    updates.totalAmount = totals.totalAmount;
    lineItems = totals.lineItems;
  }

  await updateWithLineItems({ po, updates, lineItems });

  const result = await findByPkFull(po.id);

  return res.status(200).json({
    status: true,
    message: 'Purchase order updated successfully',
    data: result,
    responseCode: '000',
  });
});

exports.send = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;
  const { invitedEmails } = req.body;

  const po = await findByIdSimple({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));
  if (!['Draft', 'PO Issued', 'Closed'].includes(po.status)) return next(new ErrorResponse(`This purchase order cannot be issued from status "${po.status}"`, 400));
  if (po.status !== 'Draft' && await getBillingState(po) === 'FULL') {
    return next(new ErrorResponse('This purchase order is fully billed and locked. Corrections go through returns or debit notes.', 400));
  }

  const poVendor = await findVendorById({ id: po.vendorId, corporateUserId });
  if (!poVendor || !poVendor.email || !poVendor.email.trim()) {
    return res.status(400).json({
      status: false,
      message: `Please add an email address for the vendor before issuing this purchase order`,
      responseCode: '003',
      data: { vendorsWithoutEmail: [{ id: po.vendorId, businessName: poVendor?.businessName || `Vendor ID ${po.vendorId}` }] },
    });
  }

  // Generate a unique token for the vendor acknowledgement link before updating status
  const vendorToken = crypto.randomBytes(32).toString('hex');
  customLog(req?.LogTraceId, 'info', { message: '[PO Send] vendorToken generated', hasVendorToken: !!vendorToken });
  try {
    const updateResult = await po.update({ vendorToken });
    customLog(req?.LogTraceId, 'info', { message: '[PO Send] po.update result', hasVendorToken: !!(updateResult && updateResult.vendorToken) });
    // Re-fetch from DB to confirm it was actually persisted
    const verify = await findByIdSimple({ id: po.id, corporateUserId });
    customLog(req?.LogTraceId, 'info', { message: '[PO Send] DB verify', hasVendorToken: verify ? !!verify.vendorToken : 'NOT FOUND' });
  } catch (err) {
    customLog(req?.LogTraceId, 'error', { message: '[PO Send] ERROR saving vendorToken', error: err.message });
    return next(new ErrorResponse('Something went wrong while processing this purchase order. Please try again.', 500));
  }

  await updateStatus({ po, status: 'PO Issued', timestampField: 'sentAt' });

  const [fullPo, corporate] = await Promise.all([
    findByPkFull(id),
    findCorporateUser(corporateUserId),
  ]);

  const initiator = {
    name:        req.user.name        || '',
    designation: req.user.designation || req.user.role || '',
    email:       req.user.email       || corporate.email   || DEFAULT_FALLBACK_EMAIL,
    phone:       req.user.phone       || corporate.mobileNo || '',
  };

  // Linked RFQ details (may be null for manual POs)
  const rfqInfo = fullPo.proposal?.rfq
    ? { refNumber: fullPo.proposal.rfq.refNumber, title: fullPo.proposal.rfq.title }
    : null;

  const fallbackSubject = buildPoIssuedSubject({ po: fullPo, rfq: rfqInfo, corporate });
  customLog(req?.LogTraceId, 'info', { message: '[PO Send] email subject', subject: fallbackSubject });

  customLog(req?.LogTraceId, 'info', { message: '[PO Send] building email body HTML' });
  let subject, bodyHtml;
  try {
    const resolvedPoIssued = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.PROCURE_PO_ISSUED,
      service: EMAIL_TEMPLATE_SERVICES.PROCURE,
      variables: {
        poNumber: fullPo?.refNumber,
        rfqTitle: rfqInfo ? rfqInfo.title : (fullPo?.title || fullPo?.refNumber),
        buyerName: corporate?.companyName || corporate?.name || '',
        vendorName: fullPo?.vendor?.contactPerson || fullPo?.vendor?.businessName || 'Vendor',
        initiatorName: initiator.name || 'Procurement Team',
        buyerEmail: initiator.email || 'support@peko.one',
        buyerPhone: initiator.phone || '',
        branding: corporate?.branding || 'Peko',
        website: corporate?.website || 'https://www.peko.one',
        ...v2LayoutVariables(corporate),
      },
      fallback: () => poIssuedTemplate({ po: fullPo, rfq: rfqInfo, corporate, initiator, token: vendorToken }),
      fallbackSubject,
      logTraceId: req?.LogTraceId,
    });
    subject = resolvedPoIssued.subject;
    bodyHtml = resolvedPoIssued.html;
    customLog(req?.LogTraceId, 'info', { message: '[PO Send] email body HTML built', htmlLength: bodyHtml?.length || 0 });
  } catch (tmplErr) {
    customLog(req?.LogTraceId, 'error', { message: '[PO Send] poIssuedTemplate threw', error: tmplErr?.message, stack: tmplErr?.stack });
    return next(new ErrorResponse('Something went wrong while sending this purchase order. Please try again.', 500));
  }

  // Generate the PO PDF once, reuse for all recipients
  customLog(req?.LogTraceId, 'info', { message: '[PO Send] building PDF HTML template' });
  const pdfHtml = purchaseOrderTemplate({ po: fullPo, corporate });
  customLog(req?.LogTraceId, 'info', { message: '[PO Send] PDF HTML built', htmlLength: pdfHtml?.length || 0 });

  let pdfOk = false;
  let buffer = null;
  try {
    const pdfResult = await puppeteerPdfBufferGenerator({ html: pdfHtml });
    pdfOk  = pdfResult.status;
    buffer = pdfResult.buffer;
    customLog(req?.LogTraceId, 'info', { message: '[PO Send] PDF generation', status: pdfOk ? 'success' : 'failed — sending without attachment', bufferSize: buffer?.length || 0 });
  } catch (pdfErr) {
    customLog(req?.LogTraceId, 'error', { message: '[PO Send] PDF generation threw unexpectedly', error: pdfErr?.message });
  }

  const senderName = corporate?.companyName || corporate?.name || 'Peko';
  customLog(req?.LogTraceId, 'info', { message: '[PO Send] senderName resolved', senderName });

  let tmpPdfPath = null;
  if (pdfOk && buffer) {
    try {
      // Unique on disk: refNumbers repeat across corporates. The attachment keeps `${refNumber}.pdf`.
      tmpPdfPath = path.join(os.tmpdir(), `${fullPo.refNumber}-${crypto.randomUUID()}.pdf`);
      fs.writeFileSync(tmpPdfPath, buffer);
      customLog(req?.LogTraceId, 'info', { message: '[PO Send] PDF written to tmp', path: tmpPdfPath });
    } catch (fsErr) {
      customLog(req?.LogTraceId, 'error', { message: '[PO Send] failed to write PDF to tmp', error: fsErr?.message });
      tmpPdfPath = null;
    }
  }

  // Recipients: the registered vendor plus any additional invited emails (excluding the vendor's own)
  const vendorEmail = fullPo.vendor?.email;
  customLog(req?.LogTraceId, 'info', { message: '[PO Send] vendor email', email: vendorEmail || 'NOT FOUND' });
  const recipients = [];
  if (vendorEmail) recipients.push(vendorEmail);
  if (Array.isArray(invitedEmails)) {
    customLog(req?.LogTraceId, 'info', { message: '[PO Send] invited emails', count: invitedEmails.length });
    for (const email of invitedEmails) {
      if (email && email !== vendorEmail) recipients.push(email);
    }
  }

  // The temp PDF is deleted once the last email has finished (sent or failed)
  let pendingEmails = recipients.length;
  const removeTmpPdf = () => {
    if (tmpPdfPath) fs.unlink(tmpPdfPath, () => {});
  };
  if (pendingEmails === 0) removeTmpPdf();

  const sendToEmail = (toEmail) => {
    if (!toEmail) return;
    const smtpCb = (err) => {
      if (err) customLog(req?.LogTraceId, 'error', { message: '[PO Send] SMTP error', to: toEmail, error: err.message });
      else     customLog(req?.LogTraceId, 'info',  { message: '[PO Send] email delivered', to: toEmail });
      if (--pendingEmails === 0) removeTmpPdf();
    };
    if (tmpPdfPath) {
      customLog(req?.LogTraceId, 'info', { message: '[PO Send] sending email with PDF', to: toEmail });
      emailer.emailWithSenderName(toEmail, subject, bodyHtml, senderName, `${fullPo.refNumber}.pdf`, tmpPdfPath, smtpCb);
    } else {
      customLog(req?.LogTraceId, 'info', { message: '[PO Send] sending email without PDF', to: toEmail });
      emailer.emailWithSenderName(toEmail, subject, bodyHtml, senderName, null, null, smtpCb);
    }
  };

  for (const email of recipients) sendToEmail(email);

  customLog(req?.LogTraceId, 'info', { message: '[PO Send] response sent successfully' });
  return res.status(200).json({
    status: true,
    message: 'Purchase order issued to vendor',
    data:    fullPo,
    responseCode: '000',
  });
});

exports.close = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const po = await findByIdSimple({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));

  if (!['Draft', 'PO Issued'].includes(po.status))
    return next(new ErrorResponse(`Cannot close a purchase order with status "${po.status}"`, 400));

  if (po.status === 'PO Issued' && await getBillingState(po) === 'NONE')
    return next(new ErrorResponse('Nothing has been billed against this purchase order yet. Cancel it instead.', 400));

  const outstanding = await hasOutstandingInvoices({ purchaseOrderId: Number(id), corporateUserId });
  if (outstanding)
    return next(new ErrorResponse('Cannot close PO with invoices that are still pending payment', 400));

  await updateStatus({ po, status: 'Closed', timestampField: 'completedAt' });

  return res.status(200).json({
    status: true,
    message: 'Purchase order marked as Closed',
    data: po,
    responseCode: '000',
  });
});

// ─── CANCEL (Issued, nothing billed) ─────────────────────────────────────────

exports.cancel = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;

  const po = await findByIdSimple({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));
  if (po.status !== 'PO Issued') return next(new ErrorResponse('Only issued purchase orders can be cancelled', 400));
  if (await getBillingState(po) !== 'NONE') {
    return next(new ErrorResponse('This purchase order has already been billed and cannot be cancelled. Close it instead.', 400));
  }

  const cancelledBy = req.user.name || req.user.email || null;
  await cancelPo({ po, reason: req.body.reason, cancelledBy });
  customLog(req?.LogTraceId, 'info', { message: '[PO Cancel] cancelled', poId: po.id, cancelledBy });

  const [fullPo, corporate] = await Promise.all([findByPkFull(id), findCorporateUser(corporateUserId)]);
  const vendorEmail = fullPo.vendor?.email;
  if (vendorEmail) {
    const initiator = {
      email: req.user.email || corporate?.email || DEFAULT_FALLBACK_EMAIL,
      phone: req.user.phone || corporate?.mobileNo || '',
    };
    const senderName = corporate?.companyName || corporate?.name || 'Peko';
    emailer.emailWithSenderName(
      vendorEmail,
      buildPoCancelledSubject({ po: fullPo, corporate }),
      poCancelledTemplate({ po: fullPo, corporate, initiator }),
      senderName, null, null,
      (err) => {
        if (err) customLog(req?.LogTraceId, 'error', { message: '[PO Cancel] vendor email failed', to: vendorEmail, error: err.message });
      }
    );
  }

  return res.status(200).json({
    status: true,
    message: 'Purchase order cancelled',
    data: fullPo,
    responseCode: '000',
  });
});

// ─── SOFT DELETE (Draft only) ─────────────────────────────────────────────────

exports.softDelete = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const po = await findByIdSimple({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));
  if (po.status !== 'Draft') return next(new ErrorResponse('Only Draft purchase orders can be deleted', 400));

  await destroy(po);

  return res.status(200).json({
    status: true,
    message: 'Purchase order deleted successfully',
    data: {},
    responseCode: '000',
  });
});

// ─── JOURNEY ─────────────────────────────────────────────────────────────────

exports.getJourney = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id }          = req.params;

  const po = await findForJourney({ id, corporateUserId });
  if (!po) return next(new ErrorResponse('Purchase order not found', 404));

  const events = [];

  if (po.purchaseRequest) {
    const pr = po.purchaseRequest;
    events.push({
      key:       'purchase_request_raised',
      title:     'Purchase request raised',
      date:      pr.createdAt,
      completed: true,
      details: {
        refNumber:       pr.refNumber,
        requestedBy:     pr.requestedBy,
        department:      pr.department      || null,
        estimatedBudget: pr.estimatedBudget || null,
        category:        pr.category        || null,
        recordId:        pr.id,
      },
    });

    if (pr.rfqId) {
      const rfq = await findRfqById(pr.rfqId);
      if (rfq) {
        events.push({
          key:       'rfq_raised',
          title:     'RFQ raised',
          date:      rfq.createdAt,
          completed: true,
          details:   { refNumber: rfq.refNumber, title: rfq.title, recordId: rfq.id },
        });
      }
    }
  }

  if (po.proposal) {
    events.push({
      key:       'proposals_evaluated',
      title:     'Proposals received & evaluated',
      date:      po.proposal.submittedAt || po.proposal.createdAt,
      completed: true,
      details: {
        vendor:      po.proposal.vendor?.businessName || null,
        totalAmount: po.proposal.totalAmount,
        recordId:    po.proposal.id,
      },
    });
  }

  events.push({
    key:       'po_created',
    title:     'Purchase order created',
    date:      po.createdAt,
    completed: true,
    details:   { refNumber: po.refNumber, totalAmount: po.totalAmount, currency: po.currency },
  });

  events.push({
    key:       'po_sent',
    title:     'PO sent to vendor',
    date:      po.sentAt || null,
    completed: !!po.sentAt,
    details:   po.sentAt ? { sentAt: po.sentAt } : null,
  });

  if (po.status === 'Cancelled') {
    events.push({
      key:       'po_cancelled',
      title:     'Purchase order cancelled',
      date:      po.cancelledAt,
      completed: true,
      details:   { reason: po.cancelReason, cancelledBy: po.cancelledBy },
    });
  }

  return res.status(200).json({
    status: true,
    message: 'Journey fetched successfully',
    data:    events,
    responseCode: '000',
  });
});
