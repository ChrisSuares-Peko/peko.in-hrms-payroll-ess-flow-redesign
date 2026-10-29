'use strict'

const { Op } = require('sequelize')

const governmentServicesApplication = require('../entities/governmentServicesApplication')

// Resolves which draft to pay by {credentialId, serviceId}, not a client-supplied
// applicationId. Excludes COMPLETED applications so re-applying for the same
// service resolves to the new draft, not an old paid one.
exports.findUnpaidByServiceId = async (credentialId, serviceId) => {
  return await governmentServicesApplication.findOne({
    where: { credentialId, serviceId, paymentStatus: { [Op.ne]: 'COMPLETED' } },
    order: [['createdAt', 'DESC']]
  })
}

exports.findById = async (id, credentialId) => {
  return await governmentServicesApplication.findOne({ where: { id, credentialId } })
}

// Merges vendor payment/engagement details (doc §19) into applicationData and
// marks paid — mirrors govtServiceApplications.js's markApplicationPaid but
// writes real columns instead of burying them in JSON.
exports.markApplicationPaid = async (id, credentialId, paymentMeta) => {
  const application = await governmentServicesApplication.findOne({ where: { id, credentialId } })
  if (!application) throw new Error('Application not found')

  const applicationData = {
    ...(application.applicationData || {}),
    vendor: { ...(application.applicationData?.vendor || {}), ...(paymentMeta.vendor || {}) }
  }

  return await application.update({
    applicationData,
    paymentStatus: 'COMPLETED',
    corporateTxnId: paymentMeta.corporateTxnId,
    paidAt: paymentMeta.paidAt,
    ...(paymentMeta.amount != null ? { amount: paymentMeta.amount } : {}),
    ...(paymentMeta.vendor?.gid ? { vendorGid: paymentMeta.vendor.gid } : {}),
    // Create Order's (doc §19) engagement_id (stripped to numeric by the caller)
    // — own column for easy query/display.
    ...(paymentMeta.vendor?.vendorEngagementId ? { vendorEngagementId: paymentMeta.vendor.vendorEngagementId } : {}),
    ...(application.status === 'DRAFT' ? { status: 'SUBMITTED', submittedAt: new Date() } : {})
  })
}
