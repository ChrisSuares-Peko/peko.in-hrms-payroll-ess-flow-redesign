'use strict';

const asyncHandler  = require('../../../middlewares/async');
const ErrorResponse = require('../../../utils/error-response');
const { generate: generateRefNumber } = require('../../../services/procure/refNumberService');
const { uploadFile } = require('../../../utils/commonUploadFile');
const emailer = require('../../../utils/emailer');
const { rfqInviteTemplate, buildSubject, rfqReminderTemplate, buildReminderSubject } = require('../../../utils/emailTemplate/rfqTemplate');
const rfqUseCase          = require('../../../models/use-cases/procure/rfq');
const prUseCase           = require('../../../models/use-cases/procure/purchaseRequest');
const vendorUseCase       = require('../../../models/use-cases/procure/procureVendor');
const { customLog }       = require('../../../utils/loggerHelper');
const { resolveEmailTemplate } = require('../../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../../utils/emailTemplate/sharedLayout');


// ─── Helpers ──────────────────────────────────────────────────────────────────

function getCorporateId(req) {
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    return req.user.subCorporateId;
  }
  return req.user.corporateId;
}


async function uploadAttachmentsToS3(attachments = [], user) {
  if (!attachments.length) return [];
  const role     = user?.role?.toLowerCase() || 'corporate';
  const username = user?.username || 'unknown-user';
  const filePath = `${role}/${username}/procure/rfqs`;
  return Promise.all(
    attachments.map(async (f) => {
      const url = await uploadFile(f.fileBase64, filePath, f.fileFormat);
      return { fileName: f.fileName, url, uploadedAt: new Date().toISOString() };
    })
  );
}

// Shared helper for the 3 rfqInviteTemplate call sites below — one named helper per hard
// rule 4 (multiple call sites, same file, same key/template).
async function resolveRfqInviteEmail(rfq, vendor, invite, initiator, logTraceId) {
  const subject = buildSubject(rfq);
  const resolved = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.PROCURE_RFQ_INVITE,
    service: EMAIL_TEMPLATE_SERVICES.PROCURE,
    variables: {
      rfqRefNumber: rfq?.refNumber,
      rfqTitle: rfq?.title,
      vendorName: vendor?.contactPerson || vendor?.businessName || 'Vendor',
      initiatorName: initiator.name || '',
      initiatorCompany: initiator.companyName || '',
      branding: initiator?.branding || 'Peko',
      website: initiator?.website || 'https://www.peko.one',
      ...v2LayoutVariables(initiator),
    },
    fallback: () => rfqInviteTemplate({ rfq, vendor, invite, initiator }),
    fallbackSubject: subject,
    logTraceId,
  });
  return resolved;
}

async function sendRfqInviteEmails(rfq, vendorInvites, initiator = {}, logTraceId) {
  for (const invite of vendorInvites) {
    if (!invite.vendor || !invite.vendor.email) {
      customLog(logTraceId, 'info', { msg: 'RFQ invite skipped — no vendor email', vendorId: invite.vendor?.id, rfqId: rfq.id }, 'CONSOLE');
      continue;
    }
    const resolved = await resolveRfqInviteEmail(rfq, invite.vendor, invite, initiator, logTraceId);
    customLog(logTraceId, 'info', { msg: 'Sending RFQ invite email', to: invite.vendor.email, subject: resolved.subject, rfqId: rfq.id }, 'CONSOLE');
    emailer.emailWithSenderName(invite.vendor.email, resolved.subject, resolved.html, initiator.companyName, null, null, function (err) {
      if (err) {
        customLog(logTraceId, 'error', { msg: 'sendRfqInviteEmails: emailWithSenderName SMTP error', to: invite.vendor.email, rfqId: rfq.id, error: err?.message || err }, 'CONSOLE');
      } else {
        customLog(logTraceId, 'info', { msg: 'sendRfqInviteEmails: email delivered', to: invite.vendor.email, rfqId: rfq.id }, 'CONSOLE');
      }
    });
  }
}

async function sendEmailsToExternalInvites(rfq, invites = [], initiator = {}, logTraceId) {
  for (const invite of invites) {
    if (!invite.externalEmail) {
      customLog(logTraceId, 'info', { msg: 'External RFQ invite skipped — no externalEmail', rfqId: rfq.id }, 'CONSOLE');
      continue;
    }
    const vendor = { email: invite.externalEmail, businessName: invite.externalEmail, contactPerson: 'Vendor' };
    const resolved = await resolveRfqInviteEmail(rfq, vendor, invite, initiator, logTraceId);
    customLog(logTraceId, 'info', { msg: 'Sending RFQ invite email to external', to: invite.externalEmail, subject: resolved.subject, rfqId: rfq.id }, 'CONSOLE');
    emailer.emailWithSenderName(invite.externalEmail, resolved.subject, resolved.html, initiator.companyName, null, null, function (err) {
      if (err) {
        customLog(logTraceId, 'error', { msg: 'sendEmailsToExternalInvites: emailWithSenderName SMTP error', to: invite.externalEmail, rfqId: rfq.id, error: err?.message || err }, 'CONSOLE');
      } else {
        customLog(logTraceId, 'info', { msg: 'sendEmailsToExternalInvites: email delivered', to: invite.externalEmail, rfqId: rfq.id }, 'CONSOLE');
      }
    });
  }
}

async function sendRfqInviteEmailsToAddresses(rfq, emails = [], initiator = {}, logTraceId) {
  const tokenExpiry = rfq.submissionDeadline
    ? new Date(rfq.submissionDeadline)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  for (const email of emails) {
    const invite = await rfqUseCase.createEmailInvite({ rfqId: rfq.id, email, tokenExpiry });
    const vendor = { email, businessName: email, contactPerson: 'Vendor' };
    const resolved = await resolveRfqInviteEmail(rfq, vendor, invite, initiator, logTraceId);
    customLog(logTraceId, 'info', { msg: 'Sending RFQ invite email to address', to: email, subject: resolved.subject, rfqId: rfq.id }, 'CONSOLE');
    emailer.emailWithSenderName(email, resolved.subject, resolved.html, initiator.companyName, null, null, function (err) {
      if (err) {
        customLog(logTraceId, 'error', { msg: 'sendRfqInviteEmailsToAddresses: emailWithSenderName SMTP error', to: email, rfqId: rfq.id, error: err?.message || err }, 'CONSOLE');
      } else {
        customLog(logTraceId, 'info', { msg: 'sendRfqInviteEmailsToAddresses: email delivered', to: email, rfqId: rfq.id }, 'CONSOLE');
      }
    });
  }
}

// ─── SAVE DRAFT (partial, no required-field validation) ──────────────────────

exports.saveDraft = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const {
    title, type, submissionDeadline, termsAndConditions, buyerNotes,
    purchaseRequestId, invitedVendors = [], invitedEmails = [],
    lineItems = [], attachments: rawAttachments = [], prAttachments: clientPrAttachments,
  } = req.body;

  const refNumber           = await generateRefNumber(type || 'RFQ', corporateUserId);
  const uploadedAttachments = await uploadAttachmentsToS3(rawAttachments, req.user);

  let prAttachments = [];
  if (Array.isArray(clientPrAttachments)) {
    prAttachments = clientPrAttachments;
  } else if (purchaseRequestId) {
    const pr = await prUseCase.findPRById({ id: purchaseRequestId, corporateUserId });
    if (pr && Array.isArray(pr.attachments) && pr.attachments.length > 0) {
      prAttachments = pr.attachments;
    }
  }

  const rfq = await rfqUseCase.createDraftRfq({
    corporateUserId,
    refNumber,
    title:              title              || null,
    type:               type               || 'RFQ',
    submissionDeadline: submissionDeadline || null,
    termsAndConditions: termsAndConditions || null,
    buyerNotes:         buyerNotes         || null,
    attachments:        [...prAttachments, ...uploadedAttachments],
    purchaseRequestId:  purchaseRequestId  || null,
    lineItems,
    invitedVendors,
    invitedEmails,
  });

  return res.status(201).json({
    status: true,
    message: 'RFQ draft saved successfully',
    data: rfq,
    responseCode: '000',
  });
});

// ─── CREATE ───────────────────────────────────────────────────────────────────

exports.create = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const {
    title, type, submissionDeadline, termsAndConditions, buyerNotes,
    purchaseRequestId, invitedVendors = [], invitedEmails = [], invitedEmailsCategory,
    lineItems, send = false, prAttachments: clientPrAttachments,
  } = req.body;

  if (send && invitedVendors.length === 0 && invitedEmails.length === 0) {
    return next(new ErrorResponse('At least one vendor must be invited before sending', 400));
  }

  const refNumber        = await generateRefNumber(type, corporateUserId);
  const uploadedAttachments = await uploadAttachmentsToS3(req.body.attachments || [], req.user);

  let prAttachments = [];
  let prCategory = invitedEmailsCategory || null;
  if (Array.isArray(clientPrAttachments)) {
    prAttachments = clientPrAttachments;
    if (purchaseRequestId && !prCategory) {
      const pr = await prUseCase.findPRById({ id: purchaseRequestId, corporateUserId });
      if (pr && pr.category) prCategory = pr.category;
    }
  } else if (purchaseRequestId) {
    const pr = await prUseCase.findPRById({ id: purchaseRequestId, corporateUserId });
    if (pr) {
      if (Array.isArray(pr.attachments) && pr.attachments.length > 0) prAttachments = pr.attachments;
      if (!prCategory && pr.category) prCategory = pr.category;
    }
  }

  // Auto-create vendor records for invited emails not already in the vendor table
  if (invitedEmails.length > 0) {
    for (const email of invitedEmails) {
      const normalised = email.trim().toLowerCase();
      const existing = await vendorUseCase.findVendorByEmail({ email: normalised, corporateUserId });
      if (!existing) {
        await vendorUseCase.createVendor({
          corporateUserId,
          businessName:  '',
          email:         normalised,
          contactPerson: '',
          phone:         '',
          tags:          prCategory ? [prCategory] : [],
          paymentTerms:  'Net 30',
          status:        'Active',
        });
      }
    }
  }

  const attachments = [...prAttachments, ...uploadedAttachments];

  if (invitedVendors.length > 0) {
    const foundVendors = await rfqUseCase.validateVendors({ vendorIds: invitedVendors, corporateUserId });
    if (foundVendors.length !== invitedVendors.length) {
      return next(new ErrorResponse('One or more vendor IDs are invalid', 400));
    }
    if (send) {
      const vendorsWithoutEmail = foundVendors.filter((v) => !v.email || !v.email.trim());
      if (vendorsWithoutEmail.length > 0) {
        const names = vendorsWithoutEmail.map((v) => v.businessName || `Vendor ID ${v.id}`).join(', ');
        return res.status(400).json({
          status: false,
          message: `Please add an email address for the following vendor(s) before sending the RFQ: ${names}`,
          responseCode: '003',
          data: { vendorsWithoutEmail: vendorsWithoutEmail.map((v) => ({ id: v.id, businessName: v.businessName || `Vendor ID ${v.id}` })) },
        });
      }
    }
  }

  const now = new Date();

  const rfq = await rfqUseCase.createRfqTransaction({
    corporateUserId, refNumber, title, type, submissionDeadline,
    termsAndConditions, buyerNotes, attachments, purchaseRequestId,
    send, now, lineItems, invitedVendors,
  });

  const result = await rfqUseCase.findRfqWithFull({ id: rfq.id });

  if (purchaseRequestId) {
    await rfqUseCase.updatePurchaseRequestStatus({ purchaseRequestId, corporateUserId, rfqId: rfq.id });
  }

  if (send) {
    const initiator = { name: req.user.name, designation: req.user.designation || '', companyName: req.user.companyName || req.user.name, email: req.user.email };
    customLog(req?.LogTraceId, 'info', { msg: `RFQ created and sent`, rfqId: rfq.id, by: initiator.name, company: initiator.companyName }, 'CONSOLE');
    if (result.vendorInvites && result.vendorInvites.length > 0) {
      sendRfqInviteEmails(result, result.vendorInvites, initiator, req?.LogTraceId).catch((err) => customLog(req?.LogTraceId, 'error', { msg: 'RFQ invite email error', error: err?.message }, 'CONSOLE'));
    }
    if (invitedEmails.length > 0) {
      sendRfqInviteEmailsToAddresses(result, invitedEmails, initiator, req?.LogTraceId).catch((err) => customLog(req?.LogTraceId, 'error', { msg: 'RFQ email invite error', error: err?.message }, 'CONSOLE'));
    }
  }

  return res.status(201).json({
    status: true,
    message: send ? 'RFQ created and sent to vendors' : 'RFQ created successfully',
    data: result,
    responseCode: '000',
  });
});

// ─── LIST ALL (dropdown) ──────────────────────────────────────────────────────

exports.listAll = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { status, type, search } = req.query;

  const rfqs = await rfqUseCase.listAllRfqs({ corporateUserId, status, type, search });

  return res.status(200).json({
    status: true,
    message: 'RFQs fetched successfully',
    data: rfqs,
    responseCode: '000',
  });
});

// ─── CLOSING SOON ─────────────────────────────────────────────────────────────

exports.closingSoon = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const now = new Date();

  const rfqs = await rfqUseCase.listClosingSoonRfqs({ corporateUserId });

  const data = rfqs.map((rfq) => {
    const daysRemaining  = Math.max(0, Math.ceil((new Date(rfq.submissionDeadline) - now) / (1000 * 60 * 60 * 24)));
    const invites        = rfq.vendorInvites || [];
    return {
      id:                 rfq.id,
      refNumber:          rfq.refNumber,
      title:              rfq.title,
      type:               rfq.type,
      status:             rfq.status,
      submissionDeadline: rfq.submissionDeadline,
      estimatedTotal:     rfq.estimatedTotal,
      daysRemaining,
      totalVendors:   invites.length,
      pendingVendors: invites.filter((i) => i.status === 'Invited').length,
    };
  });

  return res.status(200).json({
    status: true,
    message: 'RFQs closing soon fetched successfully',
    data,
    responseCode: '000',
  });
});

// ─── LIST ─────────────────────────────────────────────────────────────────────

exports.list = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);
  const { status, type, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

  const { rows, count } = await rfqUseCase.listRfqs({
    corporateUserId, status, type, search, startDate, endDate, sortBy, sortOrder, page, limit,
  });

  return res.status(200).json({
    status: true,
    message: 'RFQs fetched successfully',
    data: { rows, count, page, totalPages: Math.ceil(count / limit), limit },
    responseCode: '000',
  });
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────

exports.getById = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqByIdWithFull({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));

  return res.status(200).json({
    status: true,
    message: 'RFQ fetched successfully',
    data: rfq,
    responseCode: '000',
  });
});

// ─── SAVE EXISTING DRAFT (partial update, no validation) ─────────────────────

exports.saveExistingDraft = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));

  const {
    title, type, submissionDeadline, termsAndConditions, buyerNotes,
    lineItems, attachments: rawAttachments = [], prAttachments: clientPrAttachments,
    invitedVendors, invitedEmails, invitedEmailsCategory,
  } = req.body;

  // Auto-create vendors for any new invited emails not already in the vendor table
  if (Array.isArray(invitedEmails) && invitedEmails.length > 0) {
    let category = invitedEmailsCategory || null;
    if (!category && rfq.purchaseRequestId) {
      const pr = await prUseCase.findPRById({ id: rfq.purchaseRequestId, corporateUserId });
      if (pr && pr.category) category = pr.category;
    }
    for (const email of invitedEmails) {
      const normalised = email.trim().toLowerCase();
      const existing = await vendorUseCase.findVendorByEmail({ email: normalised, corporateUserId });
      if (!existing) {
        await vendorUseCase.createVendor({
          corporateUserId,
          businessName:  '',
          email:         normalised,
          contactPerson: '',
          phone:         '',
          tags:          category ? [category] : [],
          paymentTerms:  'Net 30',
          status:        'Active',
        });
      }
    }
  }

  const headerUpdates = {};
  if (title              != null) headerUpdates.title              = title              || rfq.title;
  if (type               != null) headerUpdates.type               = type;
  if (submissionDeadline != null) headerUpdates.submissionDeadline = submissionDeadline || null;
  if (termsAndConditions != null) headerUpdates.termsAndConditions = termsAndConditions || null;
  if (buyerNotes         != null) headerUpdates.buyerNotes         = buyerNotes         || null;

  const existingDraftAttachments = Array.isArray(clientPrAttachments) ? clientPrAttachments : (rfq.attachments || []);
  if (rawAttachments.length > 0) {
    const newAttachments = await uploadAttachmentsToS3(rawAttachments, req.user);
    headerUpdates.attachments = [...existingDraftAttachments, ...newAttachments];
  } else if (Array.isArray(clientPrAttachments)) {
    headerUpdates.attachments = clientPrAttachments;
  }

  const validLineItems = lineItems
    ? lineItems.filter((li) => li.description)
    : undefined;

  await rfqUseCase.updateRfqTransaction({ rfq, headerUpdates, lineItems: validLineItems, rfqId: id });

  // Sync vendor invites: replace existing list with the new one (status Draft — not yet sent)
  if (Array.isArray(invitedVendors)) {
    await rfqUseCase.syncVendorInvites({ rfqId: id, vendorIds: invitedVendors, corporateUserId, status: 'Draft' });
  }

  if (Array.isArray(invitedEmails)) {
    await rfqUseCase.syncEmailInvites({ rfqId: id, emails: invitedEmails, tokenExpiry: null, status: 'Draft' });
  }

  const result = await rfqUseCase.findRfqWithFull({ id });

  return res.status(200).json({
    status: true,
    message: 'RFQ draft saved successfully',
    data: result,
    responseCode: '000',
  });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

exports.update = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (!['Draft', 'Active'].includes(rfq.status)) return next(new ErrorResponse('Only Draft or Active RFQs can be edited', 400));

  const {
    title, type, submissionDeadline, termsAndConditions, buyerNotes,
    lineItems, invitedVendors, invitedEmails, invitedEmailsCategory,
    attachments: rawAttachments = [], prAttachments: clientPrAttachments,
  } = req.body;

  const headerUpdates = {};
  if (title              !== undefined) headerUpdates.title              = title;
  if (type               !== undefined) headerUpdates.type               = type;
  if (submissionDeadline !== undefined) headerUpdates.submissionDeadline = submissionDeadline || null;
  if (termsAndConditions !== undefined) headerUpdates.termsAndConditions = termsAndConditions || null;
  if (buyerNotes         !== undefined) headerUpdates.buyerNotes         = buyerNotes || null;

  const existingAttachments = Array.isArray(clientPrAttachments) ? clientPrAttachments : (rfq.attachments || []);
  if (rawAttachments.length > 0) {
    const newAttachments = await uploadAttachmentsToS3(rawAttachments, req.user);
    headerUpdates.attachments = [...existingAttachments, ...newAttachments];
  } else if (Array.isArray(clientPrAttachments)) {
    headerUpdates.attachments = clientPrAttachments;
  }

  if (rfq.status === 'Draft') headerUpdates.status = 'Active';

  // Auto-create vendors for any new invited emails not already in the vendor table
  if (Array.isArray(invitedEmails) && invitedEmails.length > 0) {
    let category = invitedEmailsCategory || null;
    if (!category && rfq.purchaseRequestId) {
      const pr = await prUseCase.findPRById({ id: rfq.purchaseRequestId, corporateUserId });
      if (pr && pr.category) category = pr.category;
    }
    for (const email of invitedEmails) {
      const normalised = email.trim().toLowerCase();
      const existing = await vendorUseCase.findVendorByEmail({ email: normalised, corporateUserId });
      if (!existing) {
        await vendorUseCase.createVendor({
          corporateUserId,
          businessName:  '',
          email:         normalised,
          contactPerson: '',
          phone:         '',
          tags:          category ? [category] : [],
          paymentTerms:  'Net 30',
          status:        'Active',
        });
      }
    }
  }

  const willBeActive = rfq.status === 'Active' || headerUpdates.status === 'Active';

  if (Array.isArray(invitedVendors) && willBeActive && invitedVendors.length > 0) {
    const foundVendors = await rfqUseCase.validateVendors({ vendorIds: invitedVendors, corporateUserId });
    const vendorsWithoutEmail = foundVendors.filter((v) => !v.email || !v.email.trim());
    if (vendorsWithoutEmail.length > 0) {
      const names = vendorsWithoutEmail.map((v) => v.businessName || `Vendor ID ${v.id}`).join(', ');
      return res.status(400).json({
        status: false,
        message: `Please add an email address for the following vendor(s) before sending the RFQ: ${names}`,
        responseCode: '003',
        data: { vendorsWithoutEmail: vendorsWithoutEmail.map((v) => ({ id: v.id, businessName: v.businessName || `Vendor ID ${v.id}` })) },
      });
    }
  }

  await rfqUseCase.updateRfqTransaction({ rfq, headerUpdates, lineItems, rfqId: id });

  if (Array.isArray(invitedVendors)) {
    const vendorTokenExpiry = (headerUpdates.submissionDeadline || rfq.submissionDeadline)
      ? new Date(headerUpdates.submissionDeadline || rfq.submissionDeadline)
      : null;
    await rfqUseCase.syncVendorInvites({ rfqId: id, vendorIds: invitedVendors, corporateUserId, tokenExpiry: vendorTokenExpiry });
  }

  if (Array.isArray(invitedEmails)) {
    const tokenExpiry = (headerUpdates.submissionDeadline || rfq.submissionDeadline)
      ? new Date(headerUpdates.submissionDeadline || rfq.submissionDeadline)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await rfqUseCase.syncEmailInvites({ rfqId: id, emails: invitedEmails, tokenExpiry: willBeActive ? tokenExpiry : null });
  }

  const result = await rfqUseCase.findRfqWithFull({ id });

  if (willBeActive) {
    const initiator = { name: req.user.name, designation: req.user.designation || '', companyName: req.user.companyName || req.user.name, email: req.user.email };

    if (Array.isArray(invitedVendors) && invitedVendors.length > 0 && result.vendorInvites && result.vendorInvites.length > 0) {
      const vendorInvitesOnly = result.vendorInvites.filter((i) => i.vendorId && !i.externalEmail);
      sendRfqInviteEmails(result, vendorInvitesOnly, initiator, req?.LogTraceId).catch((err) => customLog(req?.LogTraceId, 'error', { msg: 'RFQ update vendor invite email error', error: err?.message }, 'CONSOLE'));
    }

    if (Array.isArray(invitedEmails) && invitedEmails.length > 0) {
      const emailInvites = await rfqUseCase.findEmailInvitesByEmails({ rfqId: id, emails: invitedEmails });
      sendEmailsToExternalInvites(result, emailInvites, initiator, req?.LogTraceId).catch((err) => customLog(req?.LogTraceId, 'error', { msg: 'RFQ update email invite error', error: err?.message }, 'CONSOLE'));
    }
  }

  return res.status(200).json({
    status: true,
    message: 'RFQ updated successfully',
    data: result,
    responseCode: '000',
  });
});

// ─── DELETE ATTACHMENT ────────────────────────────────────────────────────────

exports.deleteAttachment = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;
  const { fileName } = req.body;

  if (!fileName) return next(new ErrorResponse('fileName is required', 400));

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));

  const filtered = (rfq.attachments || []).filter((a) => a.fileName !== fileName);
  await rfqUseCase.updateRfq({ rfq, fields: { attachments: filtered } });

  return res.status(200).json({
    status: true,
    message: 'Attachment removed',
    data: { attachments: filtered },
    responseCode: '000',
  });
});

// ─── SEND TO VENDORS ──────────────────────────────────────────────────────────

exports.sendToVendors = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqWithVendorInvites({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (rfq.status !== 'Draft') return next(new ErrorResponse(`Cannot send an RFQ with status "${rfq.status}"`, 400));
  if (!rfq.vendorInvites || rfq.vendorInvites.length === 0) {
    return next(new ErrorResponse('At least one vendor must be invited before sending', 400));
  }

  const vendorInviteIds = rfq.vendorInvites.map((i) => i.vendorId).filter(Boolean);
  if (vendorInviteIds.length > 0) {
    const foundVendors = await rfqUseCase.validateVendors({ vendorIds: vendorInviteIds, corporateUserId });
    const vendorsWithoutEmail = foundVendors.filter((v) => !v.email || !v.email.trim());
    if (vendorsWithoutEmail.length > 0) {
      const names = vendorsWithoutEmail.map((v) => v.businessName || `Vendor ID ${v.id}`).join(', ');
      return res.status(400).json({
        status: false,
        message: `Please add an email address for the following vendor(s) before sending the RFQ: ${names}`,
        responseCode: '003',
        data: { vendorsWithoutEmail: vendorsWithoutEmail.map((v) => ({ id: v.id, businessName: v.businessName || `Vendor ID ${v.id}` })) },
      });
    }
  }

  const now         = new Date();
  const tokenExpiry = rfq.submissionDeadline
    ? new Date(rfq.submissionDeadline)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await rfqUseCase.sendRfqToVendorsTransaction({ rfq, now, tokenExpiry });

  const invitesWithVendors = await rfqUseCase.findInvitesWithVendors({ rfqId: id });
  const rfqWithItems       = await rfqUseCase.findRfqLineItemsOnly({ id });
  const initiator          = { name: req.user.name, designation: req.user.designation || '', companyName: req.user.companyName || req.user.name };
  customLog(req?.LogTraceId, 'info', { msg: 'Sending RFQ to vendors', rfqId: id, vendorCount: invitesWithVendors.length }, 'CONSOLE');
  sendRfqInviteEmails(rfqWithItems, invitesWithVendors, initiator, req?.LogTraceId).catch((err) => customLog(req?.LogTraceId, 'error', { msg: 'RFQ invite email error', error: err?.message }, 'CONSOLE'));

  return res.status(200).json({
    status: true,
    message: 'RFQ sent to vendors',
    data: rfq,
    responseCode: '000',
  });
});

// ─── CLOSE ────────────────────────────────────────────────────────────────────

exports.close = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (rfq.status !== 'Active') return next(new ErrorResponse(`Only Active RFQs can be closed. Current status: "${rfq.status}"`, 400));

  await rfqUseCase.updateRfq({ rfq, fields: { status: 'Closed', closedAt: new Date() } });

  return res.status(200).json({
    status: true,
    message: 'RFQ closed',
    data: rfq,
    responseCode: '000',
  });
});

// ─── REOPEN ───────────────────────────────────────────────────────────────────

exports.reopen = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (rfq.status !== 'Closed') return next(new ErrorResponse(`Only Closed RFQs can be re-opened. Current status: "${rfq.status}"`, 400));

  await rfqUseCase.updateRfq({ rfq, fields: { status: 'Active', closedAt: null } });

  return res.status(200).json({
    status: true,
    message: 'RFQ re-opened successfully',
    data: rfq,
    responseCode: '000',
  });
});

// ─── ADD VENDOR ───────────────────────────────────────────────────────────────

exports.addVendor = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;
  const { vendorId } = req.body;

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (!['Draft', 'Active'].includes(rfq.status)) {
    return next(new ErrorResponse(`Vendors can only be added to Draft or Active RFQs. Current status: "${rfq.status}"`, 400));
  }

  const vendor = await rfqUseCase.findVendor({ vendorId, corporateUserId });
  if (!vendor) return next(new ErrorResponse('Vendor not found', 404));

  const existing = await rfqUseCase.findExistingInvite({ rfqId: id, vendorId });
  if (existing) return next(new ErrorResponse('This vendor is already invited to this RFQ', 409));

  const invite = await rfqUseCase.createInvite({ rfqId: id, vendorId });
  const result = await rfqUseCase.findInviteWithVendor({ inviteId: invite.id });

  return res.status(201).json({
    status: true,
    message: 'Vendor added to RFQ',
    data: result,
    responseCode: '000',
  });
});

// ─── REMOVE VENDOR ────────────────────────────────────────────────────────────

exports.removeVendor = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id, vendorId } = req.params;

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (rfq.status !== 'Draft') return next(new ErrorResponse('Vendors can only be removed from Draft RFQs', 400));

  const invite = await rfqUseCase.findExistingInvite({ rfqId: id, vendorId });
  if (!invite) return next(new ErrorResponse('Vendor invite not found', 404));

  await rfqUseCase.destroyInvite({ invite });

  return res.status(200).json({
    status: true,
    message: 'Vendor removed from RFQ',
    data: {},
    responseCode: '000',
  });
});

// ─── SEND REMINDER ────────────────────────────────────────────────────────────

exports.sendReminder = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqWithLineItems({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (rfq.status !== 'Active') {
    return next(new ErrorResponse(`Reminders can only be sent for Active RFQs. Current status: "${rfq.status}"`, 400));
  }

  const { invitedEmails } = req.body;
  let pendingInvites = await rfqUseCase.findPendingInvites({ rfqId: id });
  if (invitedEmails && invitedEmails.length > 0) {
    pendingInvites = pendingInvites.filter(invite => {
      const email = invite.vendor ? invite.vendor.email : invite.externalEmail;
      return invitedEmails.includes(email);
    });
  }

  if (pendingInvites.length === 0) {
    return res.status(200).json({
      status: true,
      message: 'All vendors have already submitted their proposals. No reminders sent.',
      data: { remindersSent: 0, vendors: [] },
      responseCode: '000',
    });
  }

  const initiator = { name: req.user.name, designation: req.user.designation || '', companyName: req.user.companyName || req.user.name, email: req.user.email };
  const subject   = buildReminderSubject(rfq);

  customLog(req?.LogTraceId, 'info', { msg: 'sendReminder: pendingInvites found', rfqId: id, count: pendingInvites.length, subject }, 'CONSOLE');

  const reminded = [];
  for (const invite of pendingInvites) {
    const email      = invite.vendor ? invite.vendor.email : invite.externalEmail;
    const vendorData = invite.vendor || { email: invite.externalEmail, businessName: invite.externalEmail, contactPerson: 'Vendor' };
    if (!email) {
      customLog(req?.LogTraceId, 'info', { msg: 'sendReminder: skipped invite — no email', inviteId: invite.id, vendorId: invite.vendorId }, 'CONSOLE');
      continue;
    }
    const resolvedReminder = await resolveEmailTemplate({
      key: EMAIL_TEMPLATE_KEYS.PROCURE_RFQ_REMINDER,
      service: EMAIL_TEMPLATE_SERVICES.PROCURE,
      variables: {
        rfqRefNumber: rfq?.refNumber,
        rfqTitle: rfq?.title,
        vendorName: vendorData?.contactPerson || vendorData?.businessName || 'Vendor',
        initiatorName: initiator.name || '',
        initiatorCompany: initiator.companyName || '',
        branding: initiator?.branding || 'Peko',
        website: initiator?.website || 'https://www.peko.one',
        ...v2LayoutVariables(initiator),
      },
      fallback: () => rfqReminderTemplate({ rfq, vendor: vendorData, invite, initiator }),
      fallbackSubject: subject,
      logTraceId: req?.LogTraceId,
    });
    const html = resolvedReminder.html;
    customLog(req?.LogTraceId, 'info', { msg: 'sendReminder: calling emailWithSenderName', to: email, subject: resolvedReminder.subject, rfqId: id, vendorId: invite.vendorId, senderName: initiator.companyName }, 'CONSOLE');
    emailer.emailWithSenderName(email, resolvedReminder.subject, html, initiator.companyName, null, null, function (err) {
      if (err) {
        customLog(req?.LogTraceId, 'error', { msg: 'sendReminder: emailWithSenderName SMTP error', to: email, rfqId: id, error: err?.message || err }, 'CONSOLE');
      } else {
        customLog(req?.LogTraceId, 'info', { msg: 'sendReminder: email delivered', to: email, rfqId: id }, 'CONSOLE');
      }
    });
    reminded.push({ vendorId: invite.vendorId || null, businessName: vendorData.businessName, email });
  }

  await rfqUseCase.markReminderSent({ rfq });

  return res.status(200).json({
    status: true,
    message: 'Reminder sent',
    data: { remindersSent: reminded.length, vendors: reminded },
    responseCode: '000',
  });
});

// ─── SOFT DELETE ──────────────────────────────────────────────────────────────

exports.softDelete = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { id } = req.params;

  const rfq = await rfqUseCase.findRfqById({ id, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (rfq.status !== 'Draft') return next(new ErrorResponse('Only Draft RFQs can be deleted', 400));

  await rfqUseCase.deleteRfq({ rfq });

  return res.status(200).json({
    status: true,
    message: 'RFQ deleted',
    data: {},
    responseCode: '000',
  });
});
