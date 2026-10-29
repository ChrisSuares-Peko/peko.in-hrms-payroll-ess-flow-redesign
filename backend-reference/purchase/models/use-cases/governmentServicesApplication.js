'use strict';

const { Op } = require('sequelize');

const governmentServicesApplication = require('../entities/governmentServicesApplication');

exports.create = async (data) => {
  return await governmentServicesApplication.create(data);
};

exports.findById = async (id, credentialId) => {
  const where = { id };
  if (credentialId) where.credentialId = credentialId;
  return await governmentServicesApplication.findOne({ where });
};

// applicationId is no longer unique — this only answers "has this vendor business
// been used before" (createVendorBusinessV2's alreadyExists check); don't rely on
// this to resolve one specific application.
exports.findByApplicationId = async (applicationId) => {
  return await governmentServicesApplication.findOne({ where: { applicationId } });
};

// Draft resume, scoped by vendorCatalogId (mirrors findDraftByService for the old table).
exports.findDraftByVendorCatalogId = async (credentialId, vendorCatalogId) => {
  return await governmentServicesApplication.findOne({
    where: { credentialId, vendorCatalogId, status: 'DRAFT' }
  });
};

// Latest application for this catalog item regardless of status — used by
// getApplicationDraftV2 to detect an already-paid one and redirect into the
// filing form instead of the payment screen. Unlike findDraftByVendorCatalogId
// above, intentionally not limited to DRAFT.
exports.findLatestByVendorCatalogId = async (credentialId, vendorCatalogId) => {
  return await governmentServicesApplication.findOne({
    where: { credentialId, vendorCatalogId },
    order: [['createdAt', 'DESC']]
  });
};

exports.update = async (id, credentialId, data) => {
  const where = { id };
  if (credentialId) where.credentialId = credentialId;
  return await governmentServicesApplication.update(data, { where });
};

exports.submitApplication = async (id, credentialId) => {
  return await governmentServicesApplication.update(
    { status: 'SUBMITTED', submittedAt: new Date() },
    { where: { id, credentialId, status: 'DRAFT' } }
  );
};


exports.markApplicationPaid = async (applicationId, data) => {
  const application = await governmentServicesApplication.findOne({ where: { applicationId } });
  if (!application) throw new Error('Application not found');
  return await application.update(data);
};


exports.findLatestVendorGidByCredential = async (credentialId) => {
  return await governmentServicesApplication.findOne({
    where: { credentialId, vendorGid: { [Op.ne]: null } },
    order: [['createdAt', 'DESC']]
  });
};


exports.findAllVendorGidsByCredential = async (credentialId) => {
  const rows = await governmentServicesApplication.findAll({
    where: { credentialId, vendorGid: { [Op.ne]: null } },
    attributes: ['vendorGid'],
    order: [['createdAt', 'DESC']]
  });
  return [...new Set(rows.map(row => row.vendorGid))];
};

exports.findAllByCredential = async (credentialId, { offset = 0, limit = 10, status } = {}) => {
  const where = { credentialId, paymentStatus: { [Op.ne]: 'PENDING' } };
  if (status) where.status = status;
  return await governmentServicesApplication.findAndCountAll({
    where,
    offset,
    limit,
    order: [['paidAt', 'DESC'], ['createdAt', 'DESC']]
  });
};

// Admin listing across all corporates — summary columns only; JSON columns
// (applicationData/documents) are excluded to avoid MySQL's "Out of sort
// memory" on ORDER BY. findByIdAdmin below returns the full row instead.
exports.findAllApplicationsAdmin = async (options = {}) => {
  const {
    offset = 0,
    limit = 20,
    status,
    paymentStatus,
    searchText,
    from,
    to,
    sort = 'DESC',
    sortField = 'createdAt',
    corporateId
  } = options

  const credential = require('../entities/credential')

  const where = {}
  if (status) where.status = status
  if (paymentStatus) where.paymentStatus = paymentStatus
  if (corporateId) where.credentialId = corporateId
  if (from && to) where.createdAt = { [Op.between]: [new Date(from), new Date(`${to}T23:59:59`)] }

  const searchWhere = searchText
    ? {
        [Op.or]: [
          { applicationId: { [Op.like]: `%${searchText}%` } },
          { legalBusinessName: { [Op.like]: `%${searchText}%` } },
          { '$credential.username$': { [Op.like]: `%${searchText}%` } },
          { '$credential.name$': { [Op.like]: `%${searchText}%` } }
        ]
      }
    : {}

  const validSortFields = ['createdAt', 'updatedAt', 'status', 'amount', 'applicationId', 'legalBusinessName']
  const orderField = validSortFields.includes(sortField) ? sortField : 'createdAt'
  const orderDir = sort === 'ASC' ? 'ASC' : 'DESC'

  return await governmentServicesApplication.findAndCountAll({
    attributes: [
      'id', 'applicationId', 'vendorCatalogId', 'serviceId', 'legalBusinessName', 'pan',
      'phoneNumber', 'stateOfRegistration', 'amount', 'status', 'paymentStatus',
      'corporateTxnId', 'paidAt', 'vendorGid', 'vendorEngagementId', 'rejectionReason',
      'submittedAt', 'completedAt', 'createdAt', 'updatedAt', 'credentialId'
    ],
    where: { ...where, ...searchWhere },
    offset,
    limit,
    order: [[orderField, orderDir]],
    include: [
      { model: credential, as: 'credential', attributes: ['id', 'username', 'name'], required: false }
    ],
    subQuery: false
  })
}

// Admin single-record fetch — full row, no credentialId scope (unlike findById above).
exports.findByIdAdmin = async (id) => {
  const credential = require('../entities/credential')
  return await governmentServicesApplication.findOne({
    where: { id },
    include: [
      { model: credential, as: 'credential', attributes: ['id', 'username', 'name'], required: false }
    ]
  })
}
