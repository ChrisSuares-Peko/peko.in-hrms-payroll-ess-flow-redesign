'use strict';
const sequelize        = require('../../configs/database/index');
const RFQ              = require('../../models/entities/RFQ');
const RFQLineItem      = require('../../models/entities/RFQLineItem');
const RFQVendorInvite  = require('../../models/entities/RFQVendorInvite');
const ProcureVendor    = require('../../models/entities/ProcureVendor');
const Proposal         = require('../../models/entities/Proposal');
const ProposalLineItem = require('../../models/entities/ProposalLineItem');
const CorporateUser    = require('../../models/entities/corporateUser');
const asyncHandler     = require('../../middlewares/async');
const ErrorResponse    = require('../../utils/error-response');
const { uploadFile }   = require('../../utils/commonUploadFile');
const { generate: generateRefNumber } = require('../../services/procure/refNumberService');
const emailer          = require('../../utils/emailer');
const { proposalReceivedTemplate, buildProposalReceivedSubject, proposalUpdatedTemplate, buildProposalUpdatedSubject } = require('../../utils/emailTemplate/rfqTemplate');
const { createNotification } = require('../../models/use-cases/notification');
const { customLog } = require('../../utils/loggerHelper');
const { resolveEmailTemplate } = require('../../services/emailTemplateResolver');
const { EMAIL_TEMPLATE_KEYS, EMAIL_TEMPLATE_SERVICES } = require('../../utils/emailTemplateKeys');
const { v2LayoutVariables } = require('../../utils/emailTemplate/sharedLayout');


// ─── GET BY TOKEN ─────────────────────────────────────────────────────────────

exports.getByToken = asyncHandler(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) return next(new ErrorResponse('Token required', 400));

  const invite = await RFQVendorInvite.findOne({
    where: { vendorToken: token },
    include: [
      {
        model: RFQ,
        as: 'rfq',
        include: [{ model: RFQLineItem, as: 'lineItems', order: [['sortOrder', 'ASC']] }],
      },
      {
        model: ProcureVendor,
        as: 'vendor',
        attributes: ['id', 'businessName', 'contactPerson', 'email', 'phone', 'paymentTerms'],
      },
    ],
  });

  if (!invite)                                return next(new ErrorResponse('Invalid or expired link', 404));
  if (invite.tokenExpiresAt && invite.tokenExpiresAt < new Date()) return next(new ErrorResponse('This link has expired', 410));
  if (invite.status === 'Submitted')          return next(new ErrorResponse('Proposal already submitted', 409));
  if (!invite.rfq || invite.rfq.status !== 'Active') return next(new ErrorResponse('This RFQ is no longer accepting proposals', 400));

  const vendor = invite.vendor || (invite.externalEmail
    ? { email: invite.externalEmail, businessName: '', contactPerson: null }
    : null);

  const cu = await CorporateUser.findOne({
    where: { id: invite.rfq.corporateUserId },
    attributes: ['id', 'name', 'companyName', 'email', 'mobileNo', 'gstNumber', 'city', 'state', 'country'],
  });
  const addressParts = [cu?.city, cu?.state, cu?.country].filter(Boolean);

  return res.status(200).json({
    status: true,
    message: 'RFQ details fetched successfully',
    data: {
      rfq: {
        id:                 invite.rfq.id,
        refNumber:          invite.rfq.refNumber,
        title:              invite.rfq.title,
        type:               invite.rfq.type,
        submissionDeadline: invite.rfq.submissionDeadline,
        termsAndConditions: invite.rfq.termsAndConditions,
        buyerNotes:         invite.rfq.buyerNotes,
        attachments:        invite.rfq.attachments,
        lineItems:          invite.rfq.lineItems,
      },
      vendor,
      company: cu ? {
        name:       cu.companyName || cu.name || null,
        address:    addressParts.length ? addressParts.join(', ') : null,
        email:      cu.email          || null,
        phone:      cu.mobileNo           || null,
        gstin:      cu.gstNumber      || null,
      } : null,
      invite: { status: invite.status, expiresAt: invite.tokenExpiresAt },
    },
    responseCode: '000',
  });
});

// ─── SUBMIT BY TOKEN ──────────────────────────────────────────────────────────

exports.submitByToken = asyncHandler(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) return next(new ErrorResponse('Token required', 400));

  const invite = await RFQVendorInvite.findOne({
    where: { vendorToken: token },
    include: [{ model: RFQ, as: 'rfq' }],
  });

  if (!invite)                                return next(new ErrorResponse('Invalid link', 404));
  if (invite.tokenExpiresAt && invite.tokenExpiresAt < new Date()) return next(new ErrorResponse('Link expired', 410));
  if (invite.status === 'Submitted')          return next(new ErrorResponse('Proposal already submitted', 409));
  if (!invite.rfq || invite.rfq.status !== 'Active') return next(new ErrorResponse('RFQ is not accepting proposals', 400));

  const { submissionMode, totalAmount, validUntil, paymentTerms, contactPerson, contactEmail, contactMobile, deliveryTimeline, warranty, coverNote, lineItems, attachment, pdfAttachment: pdfAttachmentInput, businessName } = req.body;
  const attachmentData = attachment || (Array.isArray(pdfAttachmentInput) ? pdfAttachmentInput[0] : pdfAttachmentInput);

  let pdfAttachment = null;
  if (submissionMode === 'Online' && attachmentData) {
    const url = await uploadFile(attachmentData.fileBase64, `vendor/procure/proposals/${invite.rfqId}`, attachmentData.fileFormat);
    pdfAttachment = { fileName: attachmentData.fileName, url, uploadedAt: new Date().toISOString() };
  }

  const refNumber = await generateRefNumber('PROP', invite.rfq.corporateUserId);

  // Auto-resolve vendorId from externalEmail if the invite was sent to an external email
  let resolvedVendorId = invite.vendorId || null;
  if (!resolvedVendorId && invite.externalEmail) {
    const matched = await ProcureVendor.findOne({
      where: { email: invite.externalEmail, corporateUserId: invite.rfq.corporateUserId },
      attributes: ['id'],
    });
    if (matched) resolvedVendorId = matched.id;
  }

  const proposal = await sequelize.transaction(async (t) => {
    const now         = new Date();
    const newProposal = await Proposal.create({
      rfqId:            invite.rfqId,
      vendorId:         resolvedVendorId,
      externalEmail:    invite.externalEmail || null,
      refNumber,
      submissionMode,
      totalAmount:      totalAmount      || null,
      validUntil:       validUntil       || null,
      paymentTerms:     paymentTerms     || null,
      contactPerson:    contactPerson    || null,
      contactEmail:     contactEmail     || null,
      contactMobile:    contactMobile    || null,
      deliveryTimeline: deliveryTimeline || null,
      warranty:         warranty         || null,
      coverNote:        coverNote        || null,
      pdfAttachment,
      status:       'Under Review',
      submittedAt:  now,
    }, { transaction: t });

    if (submissionMode === 'Online' && lineItems && lineItems.length > 0) {
      const items = lineItems.map((li) => ({
        proposalId:    newProposal.id,
        rfqLineItemId: li.rfqLineItemId || null,
        description:   li.description,
        unitPrice:     li.unitPrice != null ? li.unitPrice : null,
        qty:           li.qty       != null ? li.qty       : null,
        total:         li.total     != null ? li.total     : null,
        taxRate:       li.taxRate   != null ? li.taxRate   : null,
        gstType:       li.gstType   || null,
      }));
      await ProposalLineItem.bulkCreate(items, { transaction: t });

      if (!totalAmount) {
        const sum = items.reduce((acc, li) => acc + (parseFloat(li.total) || 0), 0);
        await newProposal.update({ totalAmount: Math.round(sum * 100) / 100 }, { transaction: t });
      }
    }

    await invite.update({ status: 'Submitted' }, { transaction: t });

    return newProposal;
  });

  // Update vendor record with details submitted in the proposal
  if (resolvedVendorId) {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const vendorUpdates = {};
    if (businessName && !EMAIL_RE.test(businessName.trim())) vendorUpdates.businessName  = businessName;
    if (contactPerson)                                        vendorUpdates.contactPerson = contactPerson;
    if (contactMobile)                                        vendorUpdates.phone         = contactMobile;
    if (Object.keys(vendorUpdates).length > 0) {
      await ProcureVendor.update(vendorUpdates, { where: { id: resolvedVendorId } });
    }
  }

  const [result, corporate] = await Promise.all([
    Proposal.findOne({
      where: { id: proposal.id },
      include: [
        { model: ProposalLineItem, as: 'lineItems' },
        { model: ProcureVendor,   as: 'vendor', attributes: ['id', 'businessName', 'contactPerson', 'email', 'phone'] },
      ],
    }),
    CorporateUser.findOne({
      where: { id: invite.rfq.corporateUserId },
      attributes: ['id', 'companyName', 'email'],
      include: [{ model: require('../../models/entities/credential'), attributes: ['username'] }],
    }),
  ]);

  // Fire-and-forget: email + notification to corporate user
  try {
    if (corporate && corporate.email) {
      const vendor  = result.vendor || null;
      const subject = buildProposalReceivedSubject({ rfq: invite.rfq, vendorName: vendor ? vendor.businessName : (invite.externalEmail || 'Vendor') });
      const resolvedProposalReceived = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.PROCURE_PROPOSAL_RECEIVED,
        service: EMAIL_TEMPLATE_SERVICES.PROCURE,
        variables: {
          rfqRefNumber: invite.rfq?.refNumber,
          rfqTitle: invite.rfq?.title,
          vendorName: vendor?.businessName || '',
          buyerName: corporate?.companyName || corporate?.name || '',
          proposedAmount: result?.totalAmount,
          branding: corporate?.branding || 'Peko',
          website: corporate?.website || 'https://www.peko.one',
          ...v2LayoutVariables(corporate),
        },
        fallback: () => proposalReceivedTemplate({ rfq: invite.rfq, proposal: result, vendor, corporate }),
        fallbackSubject: subject,
      });
      emailer.email(corporate.email, resolvedProposalReceived.subject, resolvedProposalReceived.html, function (err) {
        if (err) {
          customLog(req?.LogTraceId, 'error', { msg: 'submitByToken: proposalReceived email SMTP error', to: corporate.email, rfqId: invite.rfq.id, error: err?.message || err }, 'CONSOLE');
        } else {
          customLog(req?.LogTraceId, 'info', { msg: 'submitByToken: proposalReceived email delivered', to: corporate.email, rfqId: invite.rfq.id }, 'CONSOLE');
        }
      });
    }
    const username = corporate && corporate.credential && corporate.credential.username;
    if (username) {
      createNotification({
        notificationTitle: 'Proposal Received',
        notificationBrief: `${result.vendor ? result.vendor.businessName : (invite.externalEmail || 'A vendor')} has submitted a proposal for ${invite.rfq.refNumber} - ${invite.rfq.title}.`,
        notificationTo:    username,
        notificationCategory: 'CORPORATE',
        notificationBy:    'SYSTEM',
      });
    }
  } catch (notifErr) {
    console.error('[RFQ Proposal] notification/email error:', notifErr);
  }

  return res.status(201).json({
    status: true,
    message: 'Proposal submitted successfully',
    data: result,
    responseCode: '000',
  });
});

// ─── UPDATE BY TOKEN ──────────────────────────────────────────────────────────

exports.updateByToken = asyncHandler(async (req, res, next) => {
  const token = req.params.token || req.query.token;
  if (!token) return next(new ErrorResponse('Token required', 400));

  const invite = await RFQVendorInvite.findOne({
    where: { vendorToken: token },
    include: [{ model: RFQ, as: 'rfq' }],
  });

  if (!invite)                                          return next(new ErrorResponse('Invalid link', 404));
  if (invite.tokenExpiresAt && invite.tokenExpiresAt < new Date()) return next(new ErrorResponse('Link expired', 410));
  if (invite.status !== 'Submitted')                    return next(new ErrorResponse('No submitted proposal to update', 400));
  if (!invite.rfq || invite.rfq.status !== 'Active')    return next(new ErrorResponse('RFQ is not accepting proposals', 400));

  const existing = await Proposal.findOne({
    where: { rfqId: invite.rfqId, ...(invite.vendorId ? { vendorId: invite.vendorId } : { externalEmail: invite.externalEmail }) },
    order: [['submittedAt', 'DESC']],
  });

  if (!existing) return next(new ErrorResponse('No existing proposal found to update', 404));

  // Backfill vendorId if it was null when the proposal was originally created
  if (!existing.vendorId && invite.externalEmail) {
    const matched = await ProcureVendor.findOne({
      where: { email: invite.externalEmail, corporateUserId: invite.rfq.corporateUserId },
      attributes: ['id'],
    });
    if (matched) {
      await existing.update({ vendorId: matched.id });
    }
  }

  // Capture previous values for the "What Changed" email section
  const previousAmount       = existing.totalAmount;
  const previousPaymentTerms = existing.paymentTerms;

  const { submissionMode, totalAmount, validUntil, paymentTerms, contactPerson, contactEmail, contactMobile, deliveryTimeline, warranty, coverNote, lineItems, attachment, pdfAttachment: pdfAttachmentInput, businessName } = req.body;
  const attachmentData = attachment || (Array.isArray(pdfAttachmentInput) ? pdfAttachmentInput[0] : pdfAttachmentInput);

  let pdfAttachment = existing.pdfAttachment || null;
  if (submissionMode === 'Online' && attachmentData) {
    const url = await uploadFile(attachmentData.fileBase64, `vendor/procure/proposals/${invite.rfqId}`, attachmentData.fileFormat);
    pdfAttachment = { fileName: attachmentData.fileName, url, uploadedAt: new Date().toISOString() };
  }

  const now = new Date();
  await sequelize.transaction(async (t) => {
    await existing.update({
      submissionMode:   submissionMode   || existing.submissionMode,
      totalAmount:      totalAmount      != null ? totalAmount      : existing.totalAmount,
      validUntil:       validUntil       != null ? validUntil       : existing.validUntil,
      paymentTerms:     paymentTerms     != null ? paymentTerms     : existing.paymentTerms,
      contactPerson:    contactPerson    != null ? contactPerson    : existing.contactPerson,
      contactEmail:     contactEmail     != null ? contactEmail     : existing.contactEmail,
      contactMobile:    contactMobile    != null ? contactMobile    : existing.contactMobile,
      deliveryTimeline: deliveryTimeline != null ? deliveryTimeline : existing.deliveryTimeline,
      warranty:         warranty         != null ? warranty         : existing.warranty,
      coverNote:        coverNote        != null ? coverNote        : existing.coverNote,
      pdfAttachment,
      submittedAt: now,
    }, { transaction: t });

    if (submissionMode === 'Online' && lineItems && lineItems.length > 0) {
      await ProposalLineItem.destroy({ where: { proposalId: existing.id }, transaction: t });
      const items = lineItems.map((li) => ({
        proposalId:    existing.id,
        rfqLineItemId: li.rfqLineItemId || null,
        description:   li.description,
        unitPrice:     li.unitPrice != null ? li.unitPrice : null,
        qty:           li.qty       != null ? li.qty       : null,
        total:         li.total     != null ? li.total     : null,
      }));
      await ProposalLineItem.bulkCreate(items, { transaction: t });

      if (!totalAmount) {
        const sum = items.reduce((acc, li) => acc + (parseFloat(li.total) || 0), 0);
        await existing.update({ totalAmount: Math.round(sum * 100) / 100 }, { transaction: t });
      }
    }
  });

  // Update vendor record with details submitted in the proposal
  const resolvedVendorId = existing.vendorId;
  if (resolvedVendorId) {
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const vendorUpdates = {};
    if (businessName && !EMAIL_RE.test(businessName.trim())) vendorUpdates.businessName  = businessName;
    if (contactPerson)                                        vendorUpdates.contactPerson = contactPerson;
    if (contactMobile)                                        vendorUpdates.phone         = contactMobile;
    if (Object.keys(vendorUpdates).length > 0) {
      await ProcureVendor.update(vendorUpdates, { where: { id: resolvedVendorId } });
    }
  }

  const [result, corporate] = await Promise.all([
    Proposal.findOne({
      where: { id: existing.id },
      include: [
        { model: ProposalLineItem, as: 'lineItems' },
        { model: ProcureVendor,   as: 'vendor', attributes: ['id', 'businessName', 'contactPerson', 'email', 'phone'] },
      ],
    }),
    CorporateUser.findOne({
      where: { id: invite.rfq.corporateUserId },
      attributes: ['id', 'companyName', 'email'],
      include: [{ model: require('../../models/entities/credential'), attributes: ['username'] }],
    }),
  ]);

  // Fire-and-forget: email + notification to corporate user
  try {
    if (corporate && corporate.email) {
      const vendor  = result.vendor || null;
      const subject = buildProposalUpdatedSubject({ rfq: invite.rfq, vendorName: vendor ? vendor.businessName : (invite.externalEmail || 'Vendor') });
      const resolvedProposalUpdated = await resolveEmailTemplate({
        key: EMAIL_TEMPLATE_KEYS.PROCURE_PROPOSAL_UPDATED,
        service: EMAIL_TEMPLATE_SERVICES.PROCURE,
        variables: {
          rfqRefNumber: invite.rfq?.refNumber,
          rfqTitle: invite.rfq?.title,
          vendorName: vendor?.businessName || '',
          buyerName: corporate?.companyName || corporate?.name || '',
          proposedAmount: result?.totalAmount,
          previousAmount,
          previousPaymentTerms: previousPaymentTerms || '',
          branding: corporate?.branding || 'Peko',
          website: corporate?.website || 'https://www.peko.one',
          ...v2LayoutVariables(corporate),
        },
        fallback: () => proposalUpdatedTemplate({ rfq: invite.rfq, proposal: result, vendor, corporate, previousAmount, previousPaymentTerms }),
        fallbackSubject: subject,
      });
      emailer.email(corporate.email, resolvedProposalUpdated.subject, resolvedProposalUpdated.html, function (err) {
        if (err) {
          customLog(req?.LogTraceId, 'error', { msg: 'updateByToken: proposalUpdated email SMTP error', to: corporate.email, rfqId: invite.rfq.id, error: err?.message || err }, 'CONSOLE');
        } else {
          customLog(req?.LogTraceId, 'info', { msg: 'updateByToken: proposalUpdated email delivered', to: corporate.email, rfqId: invite.rfq.id }, 'CONSOLE');
        }
      });
    }
    const username = corporate && corporate.credential && corporate.credential.username;
    if (username) {
      createNotification({
        notificationTitle: 'Proposal Updated',
        notificationBrief: `${result.vendor ? result.vendor.businessName : (invite.externalEmail || 'A vendor')} has revised their proposal for ${invite.rfq.refNumber} - ${invite.rfq.title}.`,
        notificationTo:    username,
        notificationCategory: 'CORPORATE',
        notificationBy:    'SYSTEM',
      });
    }
  } catch (notifErr) {
    console.error('[RFQ Proposal Update] notification/email error:', notifErr);
  }

  return res.status(200).json({
    status: true,
    message: 'Proposal updated successfully',
    data: result,
    responseCode: '000',
  });
});
