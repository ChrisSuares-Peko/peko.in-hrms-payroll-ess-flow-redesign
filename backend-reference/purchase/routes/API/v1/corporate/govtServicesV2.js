'use strict'

const express = require('express')
const router = express.Router({ mergeParams: true })
const {
  getGovtServiceCatalogV2,
  getVendorBusinessesV2,
  getVendorBusinessDetailV2,
  getVendorDirectorsV2,
  addVendorDirectorV2,
  createVendorBusinessV2,
  getVendorServiceDetailsV2,
  getVendorServiceDocumentsV2,
  verifyVendorPanV2,
  saveApplicationV2,
  getApplicationDraftV2,
  getTrademarkClassV2,
  getTrademarkLanguagesV2,
  locationLookupV2,
  requestExpertCallbackV2,
  searchSimilarTrademarksV2,
  getEngagementStatusV2,
  uploadTrademarkLogoV2,
  submitTrademarkFilingV2,
  uploadObjectionDocumentV2,
  getAllApplicationsV2,
  uploadGstDocumentV2,
  submitGstFilingV2,
  submitGstCancellationV2,
  searchHsnCodeV2,
  gstJurisdictionLookupV2,
} = require('../../../../controllers/corporate/govtServicesV2')
const {
  getIecFilingStatus,
  getIecDropdowns,
  submitIecFilingV2
} = require('../../../../controllers/corporate/govtServicesIecV2')

router.get('/services', getGovtServiceCatalogV2)
router.get('/service-details', getVendorServiceDetailsV2)
router.get('/service-documents', getVendorServiceDocumentsV2)
router.get('/vendor-businesses', getVendorBusinessesV2)
router.get('/vendor-business-detail', getVendorBusinessDetailV2)
router.get('/vendor-director', getVendorDirectorsV2)
router.post('/vendor-director', addVendorDirectorV2)
router.post('/vendor-businesses', createVendorBusinessV2)
router.post('/verify-pan', verifyVendorPanV2)
router.post('/applications', saveApplicationV2)
router.get('/applications', getAllApplicationsV2)
router.get('/applications/drafts', getApplicationDraftV2)
router.post('/trademark-description', getTrademarkClassV2)
router.post('/location', locationLookupV2)
router.get('/languages', getTrademarkLanguagesV2)
router.post('/request-callback', requestExpertCallbackV2)
router.get('/trademark-search', searchSimilarTrademarksV2)
router.get('/engagement-status', getEngagementStatusV2)
router.post('/trademark-logo', uploadTrademarkLogoV2)
router.post('/trademark-filing', submitTrademarkFilingV2)
router.post('/objection-document', uploadObjectionDocumentV2)
router.post('/gst-document', uploadGstDocumentV2)
router.post('/gst-filing', submitGstFilingV2)
router.get('/hsn-search', searchHsnCodeV2)
router.post('/gst-jurisdiction', gstJurisdictionLookupV2)
router.post('/gst-cancellation-filing', submitGstCancellationV2)


router.get('/iec/filing-status', getIecFilingStatus)
router.get('/iec/dropdowns', getIecDropdowns)
router.post('/iec/filing', submitIecFilingV2)

module.exports = router
