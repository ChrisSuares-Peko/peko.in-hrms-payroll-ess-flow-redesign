const express = require('express')
const { findAllDetails, updateSearchServicesSetting } = require('../../../../controllers/admin/dashboard')
const { validateDashboardQuery } = require('../../../../utils/queryValidation')
const { requireAdminSystemUser } = require('../../../../utils/jwtToken')
const router = express.Router({ mergeParams: true })

router.get('/dashboardDetails',validateDashboardQuery, findAllDetails)//✅
// F-OTH-21: admin-only replacement for the corporate-tree /dashboard/update, which let any
// corporate overwrite this platform-wide, non-tenant-scoped setting.
router.put('/update', requireAdminSystemUser, updateSearchServicesSetting)

module.exports = router
