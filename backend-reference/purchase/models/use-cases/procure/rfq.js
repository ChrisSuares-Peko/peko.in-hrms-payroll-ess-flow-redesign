'use strict';

const { Op, fn, col } = require('sequelize');
const sequelize       = require('../../../configs/database/index');
const crypto          = require('crypto');
const RFQ             = require('../../entities/RFQ');
const RFQLineItem     = require('../../entities/RFQLineItem');
const RFQVendorInvite = require('../../entities/RFQVendorInvite');
const ProcureVendor   = require('../../entities/ProcureVendor');
const PurchaseRequest = require('../../entities/PurchaseRequest');
const Proposal        = require('../../entities/Proposal');

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'submissionDeadline', 'estimatedTotal', 'refNumber'];

const VENDOR_ATTRS = ['id', 'businessName', 'contactPerson', 'email', 'phone'];

const RFQ_FULL_INCLUDE = [
  { model: RFQLineItem, as: 'lineItems', order: [['sortOrder', 'ASC']] },
  {
    model:   RFQVendorInvite,
    as:      'vendorInvites',
    include: [{ model: ProcureVendor, as: 'vendor', attributes: [...VENDOR_ATTRS, 'status'] }],
  },
  { model: PurchaseRequest, as: 'purchaseRequest', attributes: ['id', 'status', 'requestedBy'] },
];

function generateVendorToken() {
  return crypto.randomBytes(32).toString('hex');
}

function computeLineItemTotal(qty, estUnitCost) {
  if (qty == null || estUnitCost == null) return null;
  return Math.round(parseFloat(qty) * parseFloat(estUnitCost) * 100) / 100;
}

function computeEstimatedTotal(lineItems) {
  const sum = lineItems.reduce((acc, li) => acc + (parseFloat(li.total) || 0), 0);
  return Math.round(sum * 100) / 100;
}

// ─── Validation ───────────────────────────────────────────────────────────────

exports.validateVendors = async ({ vendorIds, corporateUserId }) => {
  return ProcureVendor.findAll({
    where:      { id: { [Op.in]: vendorIds }, corporateUserId },
    attributes: ['id', 'email', 'businessName'],
  });
};

// ─── Create ───────────────────────────────────────────────────────────────────

exports.createRfqTransaction = async ({
  corporateUserId, refNumber, title, type, submissionDeadline,
  termsAndConditions, buyerNotes, attachments, purchaseRequestId,
  send, now, lineItems, invitedVendors,
}) => {
  return sequelize.transaction(async (t) => {
    const newRfq = await RFQ.create({
      corporateUserId, refNumber, title,
      type:               type || 'RFQ',
      submissionDeadline: submissionDeadline || null,
      termsAndConditions: termsAndConditions || null,
      buyerNotes:         buyerNotes         || null,
      attachments,
      purchaseRequestId:  purchaseRequestId  || null,
      status:             send ? 'Active' : 'Draft',
      sentAt:             send ? now : null,
    }, { transaction: t });

    const lineItemsToCreate = lineItems.map((li, idx) => ({
      rfqId:       newRfq.id,
      description: li.description,
      qty:         li.qty,
      unit:        li.unit        || null,
      estUnitCost: li.estUnitCost != null ? li.estUnitCost : null,
      total:       computeLineItemTotal(li.qty, li.estUnitCost),
      sortOrder:   li.sortOrder   != null ? li.sortOrder : idx,
    }));
    const createdItems = await RFQLineItem.bulkCreate(lineItemsToCreate, { transaction: t });

    const estimatedTotal = computeEstimatedTotal(createdItems);
    await newRfq.update({ estimatedTotal }, { transaction: t });

    if (invitedVendors.length > 0) {
      const tokenExpiry = submissionDeadline
        ? new Date(submissionDeadline)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const invites = invitedVendors.map((vendorId) => ({
        rfqId:          newRfq.id,
        vendorId,
        status:         'Invited',
        invitedAt:      send ? now : null,
        vendorToken:    send ? generateVendorToken() : null,
        tokenExpiresAt: send ? tokenExpiry : null,
      }));
      await RFQVendorInvite.bulkCreate(invites, { ignoreDuplicates: true, transaction: t });
    }

    return newRfq;
  });
};

exports.createDraftRfq = async ({
  corporateUserId, refNumber, title, type, submissionDeadline,
  termsAndConditions, buyerNotes, attachments, purchaseRequestId,
  lineItems, invitedVendors, invitedEmails = [],
}) => {
  return sequelize.transaction(async (t) => {
    const newRfq = await RFQ.create({
      corporateUserId, refNumber,
      title:              title              || 'Untitled Draft',
      type:               type               || 'RFQ',
      submissionDeadline: submissionDeadline || null,
      termsAndConditions: termsAndConditions || null,
      buyerNotes:         buyerNotes         || null,
      attachments,
      purchaseRequestId:  purchaseRequestId  || null,
      status: 'Draft',
      sentAt: null,
    }, { transaction: t });

    let estimatedTotal = 0;
    if (lineItems && lineItems.length > 0) {
      const lineItemsToCreate = lineItems.map((li, idx) => ({
        rfqId:       newRfq.id,
        description: li.description,
        qty:         li.qty,
        unit:        li.unit        || null,
        estUnitCost: li.estUnitCost != null ? li.estUnitCost : null,
        total:       computeLineItemTotal(li.qty, li.estUnitCost),
        sortOrder:   li.sortOrder   != null ? li.sortOrder : idx,
      }));
      const createdItems = await RFQLineItem.bulkCreate(lineItemsToCreate, { transaction: t });
      estimatedTotal = computeEstimatedTotal(createdItems);
    }

    await newRfq.update({ estimatedTotal }, { transaction: t });

    const emailInvites = invitedEmails.map((e) => ({ rfqId: newRfq.id, externalEmail: e, vendorId: null, status: 'Draft' }));
    const vendorInvites = (invitedVendors || []).map((vendorId) => ({ rfqId: newRfq.id, vendorId, status: 'Draft' }));
    const allInvites = [...vendorInvites, ...emailInvites];
    if (allInvites.length > 0) {
      await RFQVendorInvite.bulkCreate(allInvites, { ignoreDuplicates: true, transaction: t });
    }

    return newRfq;
  });
};

exports.updatePurchaseRequestStatus = async ({ purchaseRequestId, corporateUserId, rfqId }) => {
  return PurchaseRequest.update(
    { status: 'Converted to RFQ', rfqId },
    { where: { id: purchaseRequestId, corporateUserId } }
  );
};

// ─── Read ─────────────────────────────────────────────────────────────────────

exports.findRfqById = async ({ id, corporateUserId }) => {
  return RFQ.findOne({ where: { id, corporateUserId } });
};

exports.findRfqWithFull = async ({ id }) => {
  return RFQ.findOne({ where: { id }, include: RFQ_FULL_INCLUDE });
};

exports.findRfqByIdWithFull = async ({ id, corporateUserId }) => {
  return RFQ.findOne({ where: { id, corporateUserId }, include: RFQ_FULL_INCLUDE });
};

exports.findRfqWithVendorInvites = async ({ id, corporateUserId }) => {
  return RFQ.findOne({
    where:   { id, corporateUserId },
    include: [{ model: RFQVendorInvite, as: 'vendorInvites' }],
  });
};

exports.findRfqWithLineItems = async ({ id, corporateUserId }) => {
  return RFQ.findOne({
    where:   { id, corporateUserId },
    include: [{ model: RFQLineItem, as: 'lineItems' }],
  });
};

exports.findRfqLineItemsOnly = async ({ id }) => {
  return RFQ.findOne({
    where:   { id },
    include: [{ model: RFQLineItem, as: 'lineItems' }],
  });
};

exports.listAllRfqs = async ({ corporateUserId, status, type, search }) => {
  const where = { corporateUserId };
  if (status) where.status = status;
  if (type)   where.type   = type;
  if (search) {
    where[Op.or] = [
      { refNumber: { [Op.like]: `%${search}%` } },
      { title:     { [Op.like]: `%${search}%` } },
    ];
  }

  return RFQ.findAll({
    where,
    attributes: [
      'id', 'refNumber', 'title', 'type', 'status', 'submissionDeadline',
      [fn('COUNT', col('proposals.id')), 'proposalCount'],
    ],
    include: [{
      model:    Proposal,
      as:       'proposals',
      attributes: [],
      required: false,
    }],
    group:    ['rfqs.id'],
    order:    [['createdAt', 'DESC']],
    subQuery: false,
  });
};

exports.listClosingSoonRfqs = async ({ corporateUserId }) => {
  const now   = new Date();
  const limit = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

  return RFQ.findAll({
    where: {
      corporateUserId,
      status:             'Active',
      submissionDeadline: { [Op.between]: [now, limit] },
    },
    attributes: ['id', 'refNumber', 'title', 'type', 'status', 'submissionDeadline', 'estimatedTotal'],
    include: [
      { model: RFQVendorInvite, as: 'vendorInvites', attributes: ['id', 'vendorId', 'status'] },
    ],
    order: [['submissionDeadline', 'ASC']],
  });
};

exports.listRfqs = async ({ corporateUserId, status, type, search, startDate, endDate, sortBy, sortOrder, page, limit }) => {
  const offset = (page - 1) * limit;

  const safeSortBy    = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = (sortOrder || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const where = { corporateUserId };
  if (status) where.status = status;
  if (type)   where.type   = type;
  if (search) {
    where[Op.or] = [
      { refNumber: { [Op.like]: `%${search}%` } },
      { title:     { [Op.like]: `%${search}%` } },
    ];
  }
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = end;
    }
  }

  return RFQ.findAndCountAll({
    where,
    order:    [[safeSortBy, safeSortOrder]],
    limit,
    offset,
    distinct: true,
    attributes: [
      'id', 'refNumber', 'title', 'type', 'status',
      'submissionDeadline', 'estimatedTotal', 'purchaseRequestId',
      'sentAt', 'closedAt', 'createdAt', 'updatedAt',
      [sequelize.literal('(SELECT COUNT(*) FROM proposals WHERE proposals.rfqId = `rfqs`.`id`)'), 'proposalCount'],
    ],
    include: [
      {
        model:   RFQVendorInvite,
        as:      'vendorInvites',
        attributes: ['id', 'vendorId', 'status'],
        include: [{ model: ProcureVendor, as: 'vendor', attributes: ['id', 'businessName', 'email'] }],
      },
    ],
  });
};

// ─── Update ───────────────────────────────────────────────────────────────────

exports.updateRfq = async ({ rfq, fields }) => {
  return rfq.update(fields);
};

exports.updateRfqTransaction = async ({ rfq, headerUpdates, lineItems, rfqId }) => {
  return sequelize.transaction(async (t) => {
    if (Object.keys(headerUpdates).length) {
      await rfq.update(headerUpdates, { transaction: t });
    }

    if (lineItems !== undefined) {
      const existingItems = await RFQLineItem.findAll({ where: { rfqId }, transaction: t });
      const existingIds   = existingItems.map((li) => li.id);
      const incomingIds   = lineItems.filter((li) => li.id).map((li) => li.id);

      const toDelete = existingIds.filter((eid) => !incomingIds.includes(eid));
      if (toDelete.length) {
        await RFQLineItem.destroy({ where: { id: toDelete }, transaction: t });
      }

      for (const [idx, li] of lineItems.entries()) {
        const total = computeLineItemTotal(li.qty, li.estUnitCost);
        if (li.id) {
          await RFQLineItem.update(
            {
              description: li.description,
              qty:         li.qty,
              unit:        li.unit        || null,
              estUnitCost: li.estUnitCost != null ? li.estUnitCost : null,
              total,
              sortOrder:   li.sortOrder   != null ? li.sortOrder : idx,
            },
            { where: { id: li.id, rfqId }, transaction: t }
          );
        } else {
          await RFQLineItem.create(
            {
              rfqId,
              description: li.description,
              qty:         li.qty,
              unit:        li.unit        || null,
              estUnitCost: li.estUnitCost != null ? li.estUnitCost : null,
              total,
              sortOrder:   li.sortOrder   != null ? li.sortOrder : idx,
            },
            { transaction: t }
          );
        }
      }

      const allItems = await RFQLineItem.findAll({ where: { rfqId }, transaction: t });
      await rfq.update({ estimatedTotal: computeEstimatedTotal(allItems) }, { transaction: t });
    }
  });
};

// ─── Send to vendors ──────────────────────────────────────────────────────────

exports.sendRfqToVendorsTransaction = async ({ rfq, now, tokenExpiry }) => {
  return sequelize.transaction(async (t) => {
    await rfq.update({ status: 'Active', sentAt: now }, { transaction: t });
    await Promise.all(
      rfq.vendorInvites.map((invite) =>
        invite.update({
          status:         'Invited',
          invitedAt:      now,
          vendorToken:    generateVendorToken(),
          tokenExpiresAt: tokenExpiry,
        }, { transaction: t })
      )
    );
  });
};

exports.findInvitesWithVendors = async ({ rfqId }) => {
  return RFQVendorInvite.findAll({
    where:   { rfqId },
    include: [{ model: ProcureVendor, as: 'vendor', attributes: ['businessName', 'contactPerson', 'email'] }],
  });
};

exports.markReminderSent = async ({ rfq }) => {
  return rfq.update({ reminderSentAt: new Date() });
};

exports.findPendingInvites = async ({ rfqId }) => {
  return RFQVendorInvite.findAll({
    where:   { rfqId, status: 'Invited' },
    include: [{ model: ProcureVendor, as: 'vendor', attributes: ['id', 'businessName', 'contactPerson', 'email'], required: false }],
  });
};

exports.syncVendorInvites = async ({ rfqId, vendorIds, status = 'Invited', tokenExpiry = null }) => {
  await RFQVendorInvite.destroy({ where: { rfqId, externalEmail: null } });
  if (vendorIds.length > 0) {
    const now = new Date();
    const expiry = tokenExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RFQVendorInvite.bulkCreate(vendorIds.map((vendorId) => ({
      rfqId,
      vendorId,
      status,
      invitedAt:      status === 'Invited' ? now    : null,
      vendorToken:    status === 'Invited' ? generateVendorToken() : null,
      tokenExpiresAt: status === 'Invited' ? expiry : null,
    })));
  }
};

exports.findEmailInvites = async ({ rfqId }) => {
  return RFQVendorInvite.findAll({ where: { rfqId, vendorId: { [Op.is]: null } } });
};

exports.findEmailInvitesByEmails = async ({ rfqId, emails }) => {
  return RFQVendorInvite.findAll({
    where: { rfqId, externalEmail: { [Op.in]: emails }, vendorId: { [Op.is]: null } },
  });
};

exports.syncEmailInvites = async ({ rfqId, emails, tokenExpiry, status = 'Invited' }) => {
  await RFQVendorInvite.destroy({ where: { rfqId, vendorId: { [Op.is]: null } } });
  if (emails.length > 0) {
    const expiry = tokenExpiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await RFQVendorInvite.bulkCreate(emails.map((e) => ({
      rfqId,
      externalEmail:  e,
      vendorId:       null,
      status,
      invitedAt:      status !== 'Draft' ? new Date() : null,
      vendorToken:    status !== 'Draft' ? generateVendorToken() : null,
      tokenExpiresAt: status !== 'Draft' ? expiry : null,
    })));
  }
};

// ─── Vendor management ────────────────────────────────────────────────────────

exports.findVendor = async ({ vendorId, corporateUserId }) => {
  return ProcureVendor.findOne({ where: { id: vendorId, corporateUserId } });
};

exports.findExistingInvite = async ({ rfqId, vendorId }) => {
  return RFQVendorInvite.findOne({ where: { rfqId, vendorId } });
};

exports.createInvite = async ({ rfqId, vendorId }) => {
  return RFQVendorInvite.create({ rfqId, vendorId });
};

exports.createEmailInvite = async ({ rfqId, email, tokenExpiry }) => {
  return RFQVendorInvite.create({
    rfqId,
    externalEmail:  email,
    vendorId:       null,
    status:         'Invited',
    invitedAt:      new Date(),
    vendorToken:    generateVendorToken(),
    tokenExpiresAt: tokenExpiry,
  });
};

exports.findInviteWithVendor = async ({ inviteId }) => {
  return RFQVendorInvite.findOne({
    where:   { id: inviteId },
    include: [{ model: ProcureVendor, as: 'vendor', attributes: VENDOR_ATTRS }],
  });
};

exports.destroyInvite = async ({ invite }) => {
  return invite.destroy();
};

// ─── Delete ───────────────────────────────────────────────────────────────────

exports.deleteRfq = async ({ rfq }) => {
  return rfq.destroy();
};
