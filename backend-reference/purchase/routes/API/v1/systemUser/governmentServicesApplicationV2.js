'use strict'

const express = require('express')
const router = express.Router({ mergeParams: true })
const {
  getAllApplications,
  getApplicationDetail
} = require('../../../../controllers/admin/governmentServicesApplicationV2')

router.get('/applications', getAllApplications)
router.get('/applications/:id', getApplicationDetail)

module.exports = router
