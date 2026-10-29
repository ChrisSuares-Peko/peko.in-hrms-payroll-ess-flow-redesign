const express = require('express')
const router = express.Router()

const { transferFunds } = require('../../../../controllers/admin/transferFunds')
const { fetchAllCorporateUsers } = require('../../../../controllers/admin/corporateUser')
const { validateTransferFunds } = require('../../../../utils/apiValidation')
const { fetchAllCorporateUsersValidation } = require('../../../../utils/queryValidation')
const { requireAdminSystemUser } = require('../../../../utils/jwtToken')

// F-OTH-18: this moves real money between wallets and previously had no permission check
// at all — any authenticated system user could call it, gated only by their own password
// (which they always know). The frontend already hides this feature behind a "Transfer
// Funds" service permission, but nothing enforced that server-side.
router.post('/', requireAdminSystemUser, validateTransferFunds, transferFunds)//✅
router.get('/corporate-users', fetchAllCorporateUsersValidation, fetchAllCorporateUsers)//✅
module.exports = router
