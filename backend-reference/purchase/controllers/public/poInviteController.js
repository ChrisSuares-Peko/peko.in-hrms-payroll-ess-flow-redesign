'use strict';

const asyncHandler          = require('../../middlewares/async');
const ErrorResponse         = require('../../utils/error-response');
const PurchaseOrder         = require('../../models/entities/PurchaseOrder');
const PurchaseOrderLineItem = require('../../models/entities/PurchaseOrderLineItem');
const ProcureVendor         = require('../../models/entities/ProcureVendor');
const CorporateUser         = require('../../models/entities/corporateUser');
const Credential            = require('../../models/entities/credential');
const RFQ                   = require('../../models/entities/RFQ');
const Proposal              = require('../../models/entities/Proposal');
const ProcureInvoice        = require('../../models/entities/ProcureInvoice');
const emailer               = require('../../utils/emailer');
const { buildPoAcknowledgedSubject, poAcknowledgedTemplate } = require('../../utils/emailTemplate/rfqTemplate');
const { purchaseOrderTemplate }      = require('../../utils/emailTemplate/purchaseOrderTemplate');
const { puppeteerPdfBufferGenerator } = require('../../utils/puppeteer');
const { createNotification } = require('../../models/use-cases/notification');
const { customLog }         = require('../../utils/loggerHelper');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../utils/emailTemplate/sharedLayout');

// ─── GET PO BY TOKEN ──────────────────────────────────────────────────────────

exports.getByToken = asyncHandler(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) return next(new ErrorResponse('Token required', 400));

  const po = await PurchaseOrder.findOne({ where: { vendorToken: token } });
  customLog(null, 'info', { message: '[PO Invite] getByToken', poId: po ? po.id : 'NOT FOUND' });
  if (!po) return next(new ErrorResponse('Invalid or expired link', 404));

  // 2. Fetch all related data separately
  const [lineItems, vendor, corporate] = await Promise.all([
    PurchaseOrderLineItem.findAll({
      where: { purchaseOrderId: po.id },
      order: [['sortOrder', 'ASC']],
    }),
    ProcureVendor.findOne({
      where: { id: po.vendorId },
      attributes: ['id', 'businessName', 'contactPerson', 'email', 'phone'],
    }),
    CorporateUser.findOne({
      where: { id: po.corporateUserId },
      attributes: ['id', 'name', 'companyName', 'email', 'mobileNo'],
    }),
  ]);

  // 3. Optionally fetch RFQ via linked proposal
  let rfqInfo = null;
  if (po.proposalId) {
    const proposal = await Proposal.findOne({
      where: { id: po.proposalId },
      attributes: ['id', 'rfqId'],
    });
    if (proposal && proposal.rfqId) {
      const rfq = await RFQ.findOne({
        where: { id: proposal.rfqId },
        attributes: ['id', 'refNumber', 'title'],
      });
      if (rfq) rfqInfo = { refNumber: rfq.refNumber, title: rfq.title };
    }
  }

  return res.status(200).json({
    status: true,
    message: 'Purchase order fetched successfully',
    data: {
      po: {
        id:              po.id,
        refNumber:       po.refNumber,
        deliveryAddress: po.deliveryAddress,
        deliveryDate:    po.deliveryDate,
        paymentTerms:    po.paymentTerms,
        notesToVendor:   po.notesToVendor,
        currency:        po.currency,
        subtotal:        po.subtotal,
        taxAmount:       po.taxAmount,
        totalAmount:     po.totalAmount,
        sentAt:          po.sentAt,
        lineItems:       lineItems,
      },
      rfq:    rfqInfo,
      vendor: vendor,
      buyer: {
        companyName:          corporate ? (corporate.companyName || corporate.name || '') : '',
        contactEmail:         corporate ? corporate.email       : 'support@peko.one',
        contactPhone:         corporate ? corporate.mobileNo    : '',
        initiatorName:        corporate ? (corporate.companyName || corporate.name || '') : '',
        initiatorDesignation: '',
      },
      invite: {
        status:    po.acknowledgedAt ? 'acknowledged' : 'pending',
        expiresAt: null,
      },
    },
    responseCode: '000',
  });
});

// ─── ACKNOWLEDGE PO ───────────────────────────────────────────────────────────

exports.acknowledgeByToken = asyncHandler(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) return next(new ErrorResponse('Token required', 400));

  const po = await PurchaseOrder.findOne({ where: { vendorToken: token } });
  if (!po)               return next(new ErrorResponse('Invalid link', 404));
  if (po.status === 'Cancelled') return next(new ErrorResponse('This purchase order has been cancelled by the buyer', 400));
  if (po.acknowledgedAt) return next(new ErrorResponse('Purchase Order already acknowledged', 409));

  const {
    invoiceNumber, invoiceAmount, invoiceDate, invoiceFile,
    notesForBuyer, bankAccountHolder, bankName, accountNumber, ifsc,
  } = req.body;

  // The invoice amount is vendor-supplied: it may be omitted, but never negative or non-numeric
  if (invoiceAmount !== undefined && invoiceAmount !== null && invoiceAmount !== ''
      && (!Number.isFinite(Number(invoiceAmount)) || Number(invoiceAmount) < 0)) {
    return next(new ErrorResponse('Invalid invoice amount', 400));
  }

  let invoiceFileUrl = null;
  if (invoiceFile && invoiceFile.fileBase64) {
    try {
      const { uploadFile } = require('../../utils/commonUploadFile');
      invoiceFileUrl = await uploadFile(
        invoiceFile.fileBase64,
        `procure/po-invoices/${po.id}`,
        invoiceFile.fileFormat
      );
    } catch (e) {
      console.error('[PO Acknowledge] file upload failed:', e.message);
    }
  }

  await ProcureInvoice.create({
    corporateUserId:  po.corporateUserId,
    purchaseOrderId:  po.id,
    vendorId:         po.vendorId,
    invoiceNumber:    invoiceNumber    || null,
    amount:           invoiceAmount    || 0,
    invoiceDate:      invoiceDate      || null,
    receivedDate:     new Date(),
    attachments:      invoiceFileUrl ? [{ fileName: invoiceFile?.fileName || 'invoice', url: invoiceFileUrl, uploadedAt: new Date().toISOString() }] : [],
    notes:            notesForBuyer   || null,
    bankAccountHolder: bankAccountHolder || null,
    bankName:          bankName         || null,
    accountNumber:     accountNumber    || null,
    ifscCode:          ifsc             || null,
  });

  await po.update({ acknowledgedAt: new Date() });

  // Update vendor bank details with whatever the vendor submits — always use latest
  if (bankName || accountNumber || ifsc) {
    const vendor = await ProcureVendor.findOne({ where: { id: po.vendorId } });
    if (vendor) {
      await vendor.update({
        ...(bankName      && { bankName }),
        ...(accountNumber && { accountNumber }),
        ...(ifsc          && { ifscCode: ifsc }),
      });
    }
  }

  // Fire-and-forget: notify corporate user
  try {
    const [corporate, vendor] = await Promise.all([
      CorporateUser.findOne({
        where: { id: po.corporateUserId },
        attributes: ['id', 'companyName', 'email'],
        include: [{ model: Credential, attributes: ['username'] }],
      }),
      ProcureVendor.findOne({
        where: { id: po.vendorId },
        attributes: ['id', 'businessName', 'contactPerson', 'email'],
      }),
    ]);

    if (corporate && corporate.email) {
      const vendorName = vendor ? vendor.businessName : 'Vendor';
      const subject    = buildPoAcknowledgedSubject({ po, vendorName });
      const invoice = { invoiceNumber, invoiceAmount };
      const resolvedPoAcknowledged = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.PROCURE_PO_ACKNOWLEDGED,
        service: EMAIL_TEMPLATE_SERVICES.PROCURE,
        variables: {
          poNumber: po?.refNumber,
          vendorName: vendor?.businessName || vendor?.contactPerson || 'Vendor',
          buyerName: corporate?.companyName || corporate?.name || '',
          invoiceNumber: invoice?.invoiceNumber || '',
          invoiceAmount: invoice?.invoiceAmount,
          branding: corporate?.branding || 'Peko',
          website: corporate?.website || 'https://www.peko.one',
          ...v2LayoutVariables(corporate),
        },
        fallback: () => poAcknowledgedTemplate({ po, vendor, corporate, invoice }),
        fallbackSubject: subject,
      });
      const html = resolvedPoAcknowledged.html;
      customLog(null, 'info', { message: '[PO Ack] sending acknowledgement email', to: corporate.email, poRef: po.refNumber });
      emailer.email(corporate.email, resolvedPoAcknowledged.subject, html, (err) => {
        if (err) customLog(null, 'error', { message: '[PO Ack] SMTP error', to: corporate.email, error: err.message });
        else     customLog(null, 'info',  { message: '[PO Ack] email delivered', to: corporate.email });
      });
    }

    const username = corporate && corporate.credential && corporate.credential.username;
    if (username) {
      createNotification({
        notificationTitle: 'Purchase Order Acknowledged',
        notificationBrief: `${vendor ? vendor.businessName : 'Your vendor'} has acknowledged PO ${po.refNumber}.`,
        notificationTo:    username,
        notificationCategory: 'CORPORATE',
        notificationBy:    'SYSTEM',
      });
    }
  } catch (notifErr) {
    console.error('[PO Acknowledge] notification/email error:', notifErr);
  }

  return res.status(200).json({
    status: true,
    message: 'Purchase Order acknowledged successfully',
    data: { acknowledgedAt: po.acknowledgedAt },
    responseCode: '000',
  });
});

// ─── DOWNLOAD PDF BY TOKEN ────────────────────────────────────────────────────

exports.downloadPdfByToken = asyncHandler(async (req, res, next) => {
  const token = req.query.token;
  if (!token) return next(new ErrorResponse('Token required', 400));

  const po = await PurchaseOrder.findOne({ where: { vendorToken: token } });
  if (!po) return next(new ErrorResponse('Invalid or expired link', 404));

  const [lineItems, corporate] = await Promise.all([
    PurchaseOrderLineItem.findAll({
      where: { purchaseOrderId: po.id },
      order: [['sortOrder', 'ASC']],
    }),
    CorporateUser.findOne({
      where: { id: po.corporateUserId },
    }),
  ]);

  po.dataValues.lineItems = lineItems;

  const html = purchaseOrderTemplate({ po, corporate });
  const { status, buffer, message } = await puppeteerPdfBufferGenerator({ html });

  if (!status || !buffer) return next(new ErrorResponse(message || 'Failed to generate PDF', 500));

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${po.refNumber}.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  return res.end(buffer);
});
