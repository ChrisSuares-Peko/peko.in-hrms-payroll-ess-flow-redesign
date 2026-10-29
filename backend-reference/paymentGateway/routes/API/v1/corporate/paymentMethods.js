const express = require('express')
const router = express.Router({ mergeParams: true })

const { fetchAllAvailablePgMethodsCorporate } = require('../../../../controllers/admin/paymentMethods');
const { fetchAllAvailablePgMethodsCorporateValidation } = require('../../../../utils/queryValidation');

router.get('/', fetchAllAvailablePgMethodsCorporateValidation, fetchAllAvailablePgMethodsCorporate);



module.exports = router