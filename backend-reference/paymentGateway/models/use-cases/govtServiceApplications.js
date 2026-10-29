'use strict'

const govtServiceApplication = require('../entities/govtServiceApplication')
const asyncHandler = require('../../middlewares/async')

exports.findById = async (id, credentialId) => {
  return await govtServiceApplication.findOne({
    where: { id, credentialId }
  })
}

exports.findDraftByService = asyncHandler(async (credentialId, service) => {
  return await govtServiceApplication.findOne({
    where: { credentialId, service, status: 'DRAFT' }
  })
})

exports.submitApplication = asyncHandler(async (id, credentialId) => {
  return await govtServiceApplication.update(
    { status: 'SUBMITTED', submittedAt: new Date() },
    { where: { id, credentialId, status: 'DRAFT' } }
  )
})

// Gov Services V2 (vendor catalog) payment fulfilment — merges the vendor
// payment/engagement details (doc v1.1 §19) into the existing formData JSON
// (no dedicated columns/migration, unlike businessRegistration's entity) and
// flips the draft to SUBMITTED, mirroring markApplicationPaid's role there.
exports.markApplicationPaid = asyncHandler(async (id, credentialId, paymentMeta) => {
  const application = await govtServiceApplication.findOne({ where: { id, credentialId } })
  if (!application) throw new Error('Application not found')

  const formData = {
    ...(application.formData || {}),
    vendor: { ...(application.formData?.vendor || {}), ...(paymentMeta.vendor || {}) },
    payment: {
      status: 'COMPLETED',
      corporateTxnId: paymentMeta.corporateTxnId,
      paidAt: paymentMeta.paidAt
    }
  }

  return await application.update({
    formData,
    status: 'SUBMITTED',
    submittedAt: new Date()
  })
})
