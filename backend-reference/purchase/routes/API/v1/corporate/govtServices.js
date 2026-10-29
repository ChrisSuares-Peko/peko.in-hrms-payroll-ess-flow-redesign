'use strict'

const express = require('express')
const router = express.Router({ mergeParams: true })
const {
  saveApplication,
  payApplication,
  submitApplication,
  getMyApplications,
  getMyDrafts,
  getApplicationById,
  getServices,
  getServiceBySlug,
  getServiceByAccessKey,
  downloadFile,
  getDistricts,
  getStates,
  getCountries,
  getMunicipalBodies,
  getPanBusinessCodes
} = require('../../../../controllers/corporate/govtServices')

router.get('/countries', getCountries)
router.get('/states', getStates)
router.get('/districts', getDistricts)
router.get('/municipal-bodies', getMunicipalBodies)
router.get('/pan-business-codes', getPanBusinessCodes)
router.get('/services', getServices)
router.get('/services/by-access-key/:accessKey', getServiceByAccessKey)
router.get('/services/:slug', getServiceBySlug)
router.get('/applications', getMyApplications)
router.get('/applications/drafts', getMyDrafts)
router.get('/applications/download', downloadFile)
router.get('/applications/:id', getApplicationById)

router.post('/applications', saveApplication)
router.post('/applications/payment', payApplication)
router.post('/applications/:id/submit', submitApplication)

module.exports = router
