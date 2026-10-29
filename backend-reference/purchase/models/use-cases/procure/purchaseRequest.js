'use strict';

const { Op }          = require('sequelize');
const PurchaseRequest = require('../../entities/PurchaseRequest');
const PurchaseOrder   = require('../../entities/PurchaseOrder');
const ProcureEmployee = require('../../entities/ProcureEmployee');

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'neededBy', 'estimatedBudget', 'refNumber'];

// ─── Purchase Request ─────────────────────────────────────────────────────────

exports.createPR = async (data) => {
  return PurchaseRequest.create(data);
};

exports.listAllPRs = async ({ corporateUserId, status }) => {
  const where = { corporateUserId };
  if (status) where.status = status;

  return PurchaseRequest.findAll({
    where,
    attributes: ['id', 'refNumber', 'status', 'estimatedBudget', 'currency'],
    order:      [['createdAt', 'DESC']],
  });
};

exports.listPRs = async ({ corporateUserId, status, search, startDate, endDate, sortBy, sortOrder, page, limit }) => {
  const offset = (page - 1) * limit;

  const safeSortBy    = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
  const safeSortOrder = (sortOrder || '').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const where = { corporateUserId };
  if (status) where.status = status;
  if (search) where[Op.or] = [{ refNumber: { [Op.like]: `%${search}%` } }, { status: { [Op.like]: `%${search}%` } }];
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt[Op.gte] = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = end;
    }
  }

  return PurchaseRequest.findAndCountAll({
    where,
    distinct: true,
    order:  [[safeSortBy, safeSortOrder]],
    limit,
    offset,
    attributes: [
      'id', 'refNumber', 'requestedBy', 'department',
      'category', 'estimatedBudget', 'currency', 'neededBy',
      'status', 'rfqId', 'createdAt', 'updatedAt',
    ],
    include: [
      { model: PurchaseOrder, as: 'purchaseOrders', attributes: ['id', 'refNumber', 'status'], required: false },
    ],
  });
};

exports.findPRById = async ({ id, corporateUserId }) => {
  return PurchaseRequest.findOne({ where: { id, corporateUserId } });
};

exports.updatePR = async ({ pr, fields }) => {
  return pr.update(fields);
};

exports.deletePR = async ({ pr }) => {
  return pr.destroy();
};

// ─── Procure Employee ─────────────────────────────────────────────────────────

exports.listLocalEmployees = async ({ corporateUserId, status }) => {
  const where = { corporateUserId };
  if (status) where.status = status;

  return ProcureEmployee.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
};

exports.findDuplicateEmployee = async ({ corporateUserId, duplicateWhere }) => {
  return ProcureEmployee.findOne({
    where: { corporateUserId, [Op.or]: duplicateWhere },
  });
};

exports.createEmployee = async ({ corporateUserId, payload }) => {
  return ProcureEmployee.create({ corporateUserId, ...payload });
};
