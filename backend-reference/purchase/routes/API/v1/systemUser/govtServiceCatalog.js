'use strict'

const express = require('express')
const router = express.Router({ mergeParams: true })
const {
  syncFromVendor,
  getCatalog,
  updateCatalogItem,
  updateStatus
} = require('../../../../controllers/admin/govtServiceCatalog')

// Matches admin/manage/api/govtServicesApi.ts — the "Manage -> Government
// Services" catalog page's paths (list, sync, per-item update, status toggle).
router.get('/', getCatalog)
router.post('/sync', syncFromVendor)
router.put('/status/:id', updateStatus)
router.put('/:id', updateCatalogItem)

module.exports = router
