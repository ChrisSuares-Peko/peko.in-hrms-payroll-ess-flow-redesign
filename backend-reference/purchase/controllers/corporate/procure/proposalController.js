'use strict';
const asyncHandler          = require('../../../middlewares/async');
const ErrorResponse         = require('../../../utils/error-response');
const { uploadFile }        = require('../../../utils/commonUploadFile');
const proposalUseCase       = require('../../../models/use-cases/procure/proposal');
const { generate: generateRefNumber } = require('../../../services/procure/refNumberService');


function getCorporateId(req) {
  if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
    return req.user.subCorporateId;
  }
  return req.user.corporateId;
}

// ─── SUBMIT ───────────────────────────────────────────────────────────────────

exports.submit = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const { rfqId, submissionMode, totalAmount, validUntil, paymentTerms, contactPerson, contactEmail, contactMobile, deliveryTimeline, warranty, coverNote, lineItems, attachment } = req.body;
  let { vendorId, externalEmail } = req.body;

  const rfq = await proposalUseCase.findRfqByCorporate({ rfqId, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (rfq.status !== 'Active') {
    return next(new ErrorResponse(`Proposals can only be submitted for Active RFQs. Current status: "${rfq.status}"`, 400));
  }

  if (!vendorId && externalEmail) {
    const resolved = await proposalUseCase.findVendorByEmail({ email: externalEmail, corporateUserId });
    if (resolved) vendorId = resolved.id;
  }

  if (!vendorId) return next(new ErrorResponse('vendorId is required (or provide externalEmail to auto-resolve)', 400));

  const vendor = await proposalUseCase.findVendorByCorporate({ vendorId, corporateUserId });
  if (!vendor) return next(new ErrorResponse('Vendor not found', 404));

  const invite = await proposalUseCase.findVendorInvite({ rfqId, vendorId });
  if (!invite) return next(new ErrorResponse('This vendor was not invited to this RFQ', 400));

  let pdfAttachment = null;
  if (submissionMode === 'Offline' && attachment) {
    const role     = req.user?.role?.toLowerCase() || 'corporate';
    const username = req.user?.username || 'unknown-user';
    const url = await uploadFile(attachment.fileBase64, `${role}/${username}/procure/proposals`, attachment.fileFormat);
    pdfAttachment = { fileName: attachment.fileName, url, uploadedAt: new Date().toISOString() };
  }

  const refNumber = await generateRefNumber('PROP', corporateUserId);

  const proposal = await proposalUseCase.createProposalWithItems({
    rfqId, vendorId, externalEmail: externalEmail || null, corporateUserId, refNumber, submissionMode, totalAmount, validUntil, paymentTerms, contactPerson, contactEmail, contactMobile, deliveryTimeline, warranty, coverNote, pdfAttachment, lineItems, invite,
  });

  const result = await proposalUseCase.findProposalWithIncludes({ proposalId: proposal.id });

  return res.status(201).json({
    status: true,
    message: 'Proposal submitted successfully',
    data: result,
    responseCode: '000',
  });
});

// ─── LIST ─────────────────────────────────────────────────────────────────────

exports.list = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const rfqId = req.query.rfqId;

  const rfq = await proposalUseCase.findRfqWithLineItems({ rfqId, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (!['Active', 'Closed'].includes(rfq.status)) {
    return next(new ErrorResponse('Proposals are not available while the RFQ is in Draft status.', 400));
  }

  const proposals = await proposalUseCase.findProposalsByRfq({ rfqId });

  return res.status(200).json({
    status: true,
    message: 'Proposals fetched successfully',
    data: {
      rfqLineItems: rfq.lineItems,
      purchaseRequestStatus: rfq.purchaseRequest ? rfq.purchaseRequest.status : null,
      proposals,
    },
    responseCode: '000',
  });
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────

exports.getById = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const rfqId      = req.query.rfqId;
  const proposalId = req.params.proposalId;

  if (!rfqId) return next(new ErrorResponse('rfqId query parameter is required', 400));

  const rfq = await proposalUseCase.findRfqWithLineItems({ rfqId, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));

  const proposal = await proposalUseCase.findProposalById({ proposalId, rfqId });
  if (!proposal) return next(new ErrorResponse('Proposal not found', 404));

  return res.status(200).json({
    status: true,
    message: 'Proposal fetched successfully',
    data: { rfqLineItems: rfq.lineItems, proposal },
    responseCode: '000',
  });
});

// ─── ACCEPT ───────────────────────────────────────────────────────────────────

exports.accept = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const rfqId      = req.query.rfqId;
  const proposalId = req.params.proposalId;

  const rfq = await proposalUseCase.findRfqByCorporate({ rfqId, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  const proposal = await proposalUseCase.findProposalById({ proposalId, rfqId });
  if (!proposal) return next(new ErrorResponse('Proposal not found', 404));
  if (proposal.status !== 'Under Review') {
    return next(new ErrorResponse(`Only Under Review proposals can be accepted. Current status: "${proposal.status}"`, 400));
  }

  await proposalUseCase.acceptProposal({ proposal, rfq });

  const result = await proposalUseCase.findProposalWithIncludes({ proposalId });

  return res.status(200).json({
    status: true,
    message: 'Proposal accepted. RFQ awarded.',
    data: result,
    responseCode: '000',
  });
});

// ─── DECLINE ──────────────────────────────────────────────────────────────────

exports.decline = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const rfqId      = req.query.rfqId;
  const proposalId = req.params.proposalId;

  const rfq = await proposalUseCase.findRfqByCorporate({ rfqId, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));

  const proposal = await proposalUseCase.findProposalById({ proposalId, rfqId });
  if (!proposal) return next(new ErrorResponse('Proposal not found', 404));
  if (proposal.status !== 'Under Review') {
    return next(new ErrorResponse(`Only Under Review proposals can be rejected. Current status: "${proposal.status}"`, 400));
  }

  const updates = { status: 'Rejected' };
  if (req.body.reason) updates.coverNote = req.body.reason;
  await proposal.update(updates);

  const result = await proposalUseCase.findProposalWithIncludes({ proposalId });

  return res.status(200).json({
    status: true,
    message: 'Proposal declined',
    data: result,
    responseCode: '000',
  });
});

// ─── UNDO ACCEPT ──────────────────────────────────────────────────────────────

exports.undoAccept = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const rfqId      = req.query.rfqId;
  const proposalId = req.params.proposalId;

  const rfq = await proposalUseCase.findRfqByCorporate({ rfqId, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  // if (!rfq.awardedAt) {
  //   return next(new ErrorResponse(`Only awarded RFQs can have their acceptance undone.`, 400));
  // }

  const proposal = await proposalUseCase.findProposalById({ proposalId, rfqId });
  if (!proposal) return next(new ErrorResponse('Proposal not found', 404));
  if (proposal.status !== 'Accepted') {
    return next(new ErrorResponse(`Only Accepted proposals can have their acceptance undone. Current status: "${proposal.status}"`, 400));
  }

  await proposalUseCase.undoAcceptProposal({ proposal, rfq });

  const result = await proposalUseCase.findProposalWithIncludes({ proposalId });

  return res.status(200).json({
    status: true,
    message: 'Proposal acceptance undone. RFQ restored.',
    data: result,
    responseCode: '000',
  });
});

// ─── UNDO DECLINE ─────────────────────────────────────────────────────────────

exports.undoDecline = asyncHandler(async (req, res, next) => {
  const corporateUserId = getCorporateId(req);
  const rfqId      = req.query.rfqId;
  const proposalId = req.params.proposalId;

  const rfq = await proposalUseCase.findRfqByCorporate({ rfqId, corporateUserId });
  if (!rfq) return next(new ErrorResponse('RFQ not found', 404));
  if (!['Sent', 'Closed', 'Active'].includes(rfq.status)) {
    return next(new ErrorResponse(`Cannot undo decline on an ${rfq.status} RFQ`, 400));
  }

  const proposal = await proposalUseCase.findProposalById({ proposalId, rfqId });
  if (!proposal) return next(new ErrorResponse('Proposal not found', 404));
  if (proposal.status !== 'Rejected') {
    return next(new ErrorResponse(`Only Rejected proposals can be restored. Current status: "${proposal.status}"`, 400));
  }

  await proposal.update({ status: 'Under Review' });
  await proposalUseCase.updateVendorInviteStatus({ rfqId, vendorId: proposal.vendorId, status: 'Submitted' });

  const result = await proposalUseCase.findProposalWithIncludes({ proposalId });

  return res.status(200).json({
    status: true,
    message: 'Proposal restored to Submitted',
    data: result,
    responseCode: '000',
  });
});

// ─── LIST ALL ─────────────────────────────────────────────────────────────────

exports.listAll = asyncHandler(async (req, res) => {
  const corporateUserId = getCorporateId(req);

  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
  const { status, search } = req.query;

  const { rows, count } = await proposalUseCase.listAllProposals({ corporateUserId, status, search, page, limit });

  return res.status(200).json({
    status: true,
    message: 'Proposals fetched successfully',
    data: { rows, count, page, totalPages: Math.ceil(count / limit), limit },
    responseCode: '000',
  });
});
