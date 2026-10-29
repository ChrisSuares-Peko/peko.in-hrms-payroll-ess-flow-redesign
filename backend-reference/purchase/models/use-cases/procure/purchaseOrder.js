'use strict';

const { Op }                = require('sequelize');
const sequelize             = require('../../../configs/database/index');
const PurchaseOrder         = require('../../entities/PurchaseOrder');
const PurchaseOrderLineItem = require('../../entities/PurchaseOrderLineItem');
const ProcureVendor         = require('../../entities/ProcureVendor');
const Proposal              = require('../../entities/Proposal');
const PurchaseRequest       = require('../../entities/PurchaseRequest');
const RFQ                   = require('../../entities/RFQ');
const CorporateUser         = require('../../entities/corporateUser');
const ProcureInvoice        = require('../../entities/ProcureInvoice');

const CORPORATE_ATTRS = [
  'id', 'name', 'companyName', 'logo', 'city', 'state', 'country',
  'poBox', 'trnNo', 'tradeLicenseNo', 'email', 'mobileNo',
];

const PO_INCLUDE = [
  {
    model:      ProcureVendor,
    as:         'vendor',
    attributes: ['id', 'businessName', 'contactPerson', 'email', 'phone', 'tradeLicenseNo'],
  },
  {
    model: PurchaseOrderLineItem,
    as:    'lineItems',
    order: [['sortOrder', 'ASC']],
  },
  {
    model:    Proposal,
    as:       'proposal',
    required: false,
  },
  {
    model:      RFQ,
    as:         'rfq',
    required:   false,
    attributes: ['id', 'refNumber', 'title'],
  },
];

exports.createWithLineItems = async ({
  corporateUserId, refNumber, vendorId, title, proposalId, rfqId, purchaseRequestId,
  currency, deliveryAddress, deliveryDate, paymentTerms, notesToVendor,
  internalNotes, subtotal, taxAmount, totalAmount, lineItems,
}) => {
  return sequelize.transaction(async (t) => {
    const order = await PurchaseOrder.create(
      {
        corporateUserId, refNumber, vendorId,
        title:             title             || null,
        proposalId:        proposalId        || null,
        rfqId:             rfqId             || null,
        purchaseRequestId: purchaseRequestId || null,
        currency, deliveryAddress, deliveryDate,
        paymentTerms:  paymentTerms  || null,
        notesToVendor: notesToVendor || null,
        internalNotes: internalNotes || null,
        subtotal, taxAmount, totalAmount,
      },
      { transaction: t }
    );

    const items = lineItems.map((li) => ({ ...li, purchaseOrderId: order.id }));
    await PurchaseOrderLineItem.bulkCreate(items, { transaction: t });

    return order;
  });
};

exports.findPurchaseRequestById = async (id, corporateUserId) => {
  return PurchaseRequest.findOne({ where: { id, corporateUserId } });
};

exports.convertPurchaseRequest = async (purchaseRequestId, corporateUserId) => {
  return PurchaseRequest.update(
    { status: 'Converted to PO' },
    { where: { id: purchaseRequestId, corporateUserId } }
  );
};

exports.findByPkFull = async (id) => {
  return PurchaseOrder.findByPk(id, { include: PO_INCLUDE });
};

exports.findAllSimple = async (corporateUserId) => {
  return PurchaseOrder.findAll({
    where:      { corporateUserId },
    attributes: ['id', 'refNumber', 'status', 'totalAmount', 'currency'],
    include: [{
      model:      ProcureVendor,
      as:         'vendor',
      attributes: ['id', 'businessName'],
    }],
    order: [['createdAt', 'DESC']],
  });
};

exports.findAll = async ({ corporateUserId, status, vendorId, searchText, safeSortBy, safeSortOrder, limit, offset }) => {
  const where = { corporateUserId };
  if (status)   where.status   = status;
  if (vendorId) where.vendorId = vendorId;
  if (searchText) {
    where[Op.or] = [
      { refNumber: { [Op.like]: `%${searchText}%` } },
      { '$vendor.businessName$': { [Op.like]: `%${searchText}%` } },
      {'status': { [Op.like]: `%${searchText}%` } },
    ];
  }

  return PurchaseOrder.findAndCountAll({
    where,
    include: [{
      model:      ProcureVendor,
      as:         'vendor',
      attributes: ['id', 'businessName', 'contactPerson', 'email'],
    }],
    order:    [[safeSortBy, safeSortOrder]],
    limit,
    offset,
    distinct: true,
    subQuery:  false,
  });
};

exports.findById = async ({ id, corporateUserId }) => {
  return PurchaseOrder.findOne({ where: { id, corporateUserId }, include: PO_INCLUDE });
};

exports.findByIdSimple = async ({ id, corporateUserId }) => {
  return PurchaseOrder.findOne({ where: { id, corporateUserId } });
};

exports.findCorporateUser = async (corporateUserId) => {
  return CorporateUser.findOne({ where: { id: corporateUserId }, attributes: CORPORATE_ATTRS });
};

exports.updateWithLineItems = async ({ po, updates, lineItems }) => {
  return sequelize.transaction(async (t) => {
    if (lineItems) {
      await PurchaseOrderLineItem.destroy({ where: { purchaseOrderId: po.id }, transaction: t });
      const items = lineItems.map((li) => ({ ...li, purchaseOrderId: po.id }));
      await PurchaseOrderLineItem.bulkCreate(items, { transaction: t });
    }
    await po.update(updates, { transaction: t });
  });
};

exports.updateStatus = async ({ po, status, timestampField }) => {
  return po.update({ status, [timestampField]: new Date() });
};

exports.destroy = async (po) => {
  return po.destroy();
};

// { [purchaseOrderId]: billed amount }; rejected invoices don't count as billed.
exports.findBilledTotals = async (poIds) => {
  if (!poIds.length) return {};
  const rows = await ProcureInvoice.findAll({
    where:      { purchaseOrderId: poIds, status: { [Op.ne]: 'Rejected' } },
    attributes: ['purchaseOrderId', [sequelize.fn('SUM', sequelize.col('amount')), 'billed']],
    group:      ['purchaseOrderId'],
    raw:        true,
  });
  return Object.fromEntries(rows.map((r) => [r.purchaseOrderId, parseFloat(r.billed) || 0]));
};

exports.cancel = async ({ po, reason, cancelledBy }) => {
  return po.update({ status: 'Cancelled', cancelledAt: new Date(), cancelReason: reason, cancelledBy });
};

exports.findForJourney = async ({ id, corporateUserId }) => {
  return PurchaseOrder.findOne({
    where:   { id, corporateUserId },
    include: [
      { model: PurchaseRequest, as: 'purchaseRequest', required: false },
      {
        model:    Proposal,
        as:       'proposal',
        required: false,
        include:  [{ model: ProcureVendor, as: 'vendor', attributes: ['id', 'businessName'] }],
      },
    ],
  });
};

exports.findRfqById = async (rfqId) => {
  return RFQ.findByPk(rfqId, {
    attributes: ['id', 'refNumber', 'title', 'createdAt', 'sentAt', 'status'],
  });
};

exports.findPurchaseRequestIdByProposal = async (proposalId) => {
  const proposal = await Proposal.findOne({ where: { id: proposalId }, attributes: ['rfqId'] });
  if (!proposal?.rfqId) return null;
  const rfq = await RFQ.findByPk(proposal.rfqId, { attributes: ['purchaseRequestId'] });
  return rfq?.purchaseRequestId || null;
};
