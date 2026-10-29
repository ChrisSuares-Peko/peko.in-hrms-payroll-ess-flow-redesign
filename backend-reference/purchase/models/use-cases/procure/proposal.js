'use strict';
const { Op }           = require('sequelize');
const sequelize        = require('../../../configs/database/index');
const RFQ              = require('../../entities/RFQ');
const RFQLineItem      = require('../../entities/RFQLineItem');
const RFQVendorInvite  = require('../../entities/RFQVendorInvite');
const ProcureVendor    = require('../../entities/ProcureVendor');
const Proposal         = require('../../entities/Proposal');
const ProposalLineItem = require('../../entities/ProposalLineItem');
const PurchaseRequest  = require('../../entities/PurchaseRequest');
const PurchaseOrder    = require('../../entities/PurchaseOrder');

const VENDOR_ATTRS = ['id', 'businessName', 'contactPerson', 'email', 'phone', 'paymentTerms'];

const PROPOSAL_INCLUDE = [
  { model: ProposalLineItem, as: 'lineItems' },
  { model: ProcureVendor,   as: 'vendor',         attributes: VENDOR_ATTRS },
  { model: PurchaseOrder,   as: 'purchaseOrder',  attributes: ['id', 'refNumber', 'status'], required: false },
];

exports.findRfqByCorporate = async ({ rfqId, corporateUserId }) => {
  return RFQ.findOne({ where: { id: rfqId, corporateUserId } });
};

exports.findRfqWithLineItems = async ({ rfqId, corporateUserId }) => {
  return RFQ.findOne({
    where: { id: rfqId, corporateUserId },
    include: [
      { model: RFQLineItem,      as: 'lineItems',       order: [['sortOrder', 'ASC']] },
      { model: PurchaseRequest,  as: 'purchaseRequest', attributes: ['id', 'status'], required: false },
    ],
  });
};

exports.findVendorByCorporate = async ({ vendorId, corporateUserId }) => {
  return ProcureVendor.findOne({ where: { id: vendorId, corporateUserId } });
};

exports.findVendorByEmail = async ({ email, corporateUserId }) => {
  return ProcureVendor.findOne({ where: { email, corporateUserId } });
};

exports.findVendorInvite = async ({ rfqId, vendorId }) => {
  const byVendorId = await RFQVendorInvite.findOne({ where: { rfqId, vendorId } });
  if (byVendorId) return byVendorId;

  const vendor = await ProcureVendor.findOne({ where: { id: vendorId }, attributes: ['email'] });
  if (!vendor?.email) return null;

  return RFQVendorInvite.findOne({ where: { rfqId, externalEmail: vendor.email } });
};

exports.findExistingProposal = async ({ rfqId, vendorId }) => {
  return Proposal.findOne({ where: { rfqId, vendorId } });
};

exports.createProposalWithItems = async ({ rfqId, vendorId, externalEmail, corporateUserId, refNumber, submissionMode, totalAmount, validUntil, paymentTerms, contactPerson, contactEmail, contactMobile, deliveryTimeline, warranty, coverNote, pdfAttachment, lineItems, invite }) => {
  return sequelize.transaction(async (t) => {
    const now = new Date();
    const newProposal = await Proposal.create({
      rfqId,
      vendorId,
      externalEmail:    externalEmail || null,
      corporateUserId,
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
      status:      'Under Review',
      submittedAt: now,
    }, { transaction: t });

    if (lineItems && lineItems.length > 0) {
      const items = lineItems.map((li) => ({
        proposalId:    newProposal.id,
        rfqLineItemId: li.rfqLineItemId || null,
        description:   li.description,
        unitPrice:     li.unitPrice != null ? li.unitPrice : null,
        qty:           li.qty       != null ? li.qty       : null,
        total:         li.total     != null ? li.total     : null,
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
};

exports.findProposalById = async ({ proposalId, rfqId }) => {
  return Proposal.findOne({
    where: { id: proposalId, rfqId },
    include: PROPOSAL_INCLUDE,
  });
};

exports.findProposalWithIncludes = async ({ proposalId }) => {
  return Proposal.findOne({ where: { id: proposalId }, include: PROPOSAL_INCLUDE });
};

exports.findProposalsByRfq = async ({ rfqId }) => {
  return Proposal.findAll({
    where: { rfqId },
    include: PROPOSAL_INCLUDE,
    order: [['submittedAt', 'ASC']],
  });
};

exports.acceptProposal = async ({ proposal, rfq }) => {
  return sequelize.transaction(async (t) => {
    await proposal.update({ status: 'Accepted' }, { transaction: t });
    await rfq.update({ awardedAt: new Date() }, { transaction: t });
  });
};

exports.undoAcceptProposal = async ({ proposal, rfq }) => {
  const previousRfqStatus = rfq.closedAt ? 'Closed' : 'Active';
  return sequelize.transaction(async (t) => {
    await proposal.update({ status: 'Under Review' }, { transaction: t });
    await rfq.update({ status: previousRfqStatus, awardedAt: null }, { transaction: t });
  });
};

exports.updateVendorInviteStatus = async ({ rfqId, vendorId, status }) => {
  return RFQVendorInvite.update({ status }, { where: { rfqId, vendorId } });
};

exports.listAllProposals = async ({ corporateUserId, status, search, page, limit }) => {
  const offset = (page - 1) * limit;

  const rfqWhere = { corporateUserId };
  if (search) {
    rfqWhere[Op.or] = [
      { refNumber: { [Op.like]: `%${search}%` } },
      { title:     { [Op.like]: `%${search}%` } },
    ];
  }

  const proposalWhere = {};
  if (status) proposalWhere.status = status;

  return Proposal.findAndCountAll({
    where: proposalWhere,
    distinct: true,
    include: [
      { model: ProcureVendor, as: 'vendor', attributes: VENDOR_ATTRS },
      { model: RFQ, as: 'rfq', attributes: ['id', 'refNumber', 'title', 'type', 'status'], where: rfqWhere, required: true },
    ],
    order: [['submittedAt', 'DESC']],
    limit,
    offset,
  });
};
