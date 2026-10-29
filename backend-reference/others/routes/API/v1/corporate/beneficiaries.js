const express = require('express')
const router = express.Router()
const { findAllBeneficiary } = require('../../../../controllers/corporate/beneficiary')
const { findAllServiceOperator } = require('../../../../controllers/corporate/serviceOperators')

router.get('/beneficiaries', findAllBeneficiary)
router.get('/operators', findAllServiceOperator)

module.exports = router
