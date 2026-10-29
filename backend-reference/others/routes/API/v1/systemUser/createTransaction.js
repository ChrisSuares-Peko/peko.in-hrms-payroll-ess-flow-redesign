const express = require('express')
const router = express.Router()
const { createTransaction, fetchServiceOperator } = require('../../../../controllers/admin/createTransaction')
const { validateFetchServiceOperatorQuery } = require('../../../../utils/queryValidation')
const { validateCreateTransaction } = require('../../../../utils/apiValidation')
const { requireAdminSystemUser } = require('../../../../utils/jwtToken')

// F-OTH-19: this used to have zero validation and zero permission check — any authenticated
// system user could credit an arbitrary adminCommission straight into their own wallet.
router.post('/', requireAdminSystemUser, validateCreateTransaction, createTransaction)//✅
router.get('/services', validateFetchServiceOperatorQuery, fetchServiceOperator)//✅
module.exports = router
