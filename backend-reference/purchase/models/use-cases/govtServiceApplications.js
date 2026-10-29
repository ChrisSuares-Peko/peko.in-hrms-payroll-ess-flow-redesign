'use strict'

const { Op, literal } = require('sequelize')
const govtServiceApplication = require('../entities/govtServiceApplication')
const credential = require('../entities/credential')
const asyncHandler = require('../../middlewares/async')

const corporateTxnIdSubquery = [
  literal(`(SELECT \`corporateTxnId\` FROM \`orders\` WHERE \`orders\`.\`providerId\` = CAST(\`govtServiceApplications\`.\`id\` AS CHAR) COLLATE utf8mb4_unicode_ci ORDER BY \`orders\`.\`createdAt\` DESC LIMIT 1)`),
  'corporateTxnId'
]

const credentialInclude = {
  model: credential,
  attributes: ['name', 'email', 'username'],
  include: [
    {
      model: credential,
      as: 'registeredByCredential',
      attributes: ['name']
    }
  ]
}

exports.create = asyncHandler(async (data) => {
  return await govtServiceApplication.create(data)
})

exports.updateApplicationNumber = asyncHandler(async (id, applicationNumber) => {
  return await govtServiceApplication.update({ applicationNumber }, { where: { id } })
})

exports.findById = asyncHandler(async (id, credentialId) => {
  const where = { id }
  if (credentialId) where.credentialId = credentialId
  return await govtServiceApplication.findOne({
    where,
    attributes: { include: [corporateTxnIdSubquery] },
    include: [credentialInclude]
  })
})

exports.findByCredentialId = asyncHandler(async (credentialId) => {
  return await govtServiceApplication.findAll({
    where: { credentialId, status: { [Op.ne]: 'DRAFT' } },
    order: [['createdAt', 'DESC']]
  })
})

exports.findDraftsByCredentialId = asyncHandler(async (credentialId) => {
  return await govtServiceApplication.findAll({
    where: { credentialId, status: 'DRAFT' },
    order: [['createdAt', 'DESC']]
  })
})

exports.findDraftByService = asyncHandler(async (credentialId, service) => {
  return await govtServiceApplication.findOne({
    where: { credentialId, service, status: 'DRAFT' }
  })
})

exports.findByService = asyncHandler(async (credentialId, service) => {
  return await govtServiceApplication.findOne({
    where: { credentialId, service },
    order: [['createdAt', 'DESC']]
  })
})

exports.saveFormData = asyncHandler(async (id, credentialId, formData, currentStep) => {
  return await govtServiceApplication.update(
    { formData, currentStep },
    { where: { id, credentialId, status: 'DRAFT' } }
  )
})

exports.updateApplicationData = asyncHandler(async (id, credentialId, data) => {
  return await govtServiceApplication.update(data, { where: { id, credentialId } })
})

exports.submitApplication = asyncHandler(async (id, credentialId) => {
  const now = new Date()
  return await govtServiceApplication.update(
    {
      status: 'SUBMITTED',
      submittedAt: now,
      statusHistory: [{ status: 'SUBMITTED', timestamp: now }]
    },
    { where: { id, credentialId, status: 'DRAFT' } }
  )
})

