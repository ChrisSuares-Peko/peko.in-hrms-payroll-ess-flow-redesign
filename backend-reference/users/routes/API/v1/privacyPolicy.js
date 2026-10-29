const express = require('express')
const router = express.Router()
const { acceptPrivacyPolicy, getAllUserPendingPolicies } = require('../../../controllers/corporate/privacyPolicy')
const { validateAcceptPrivacyPolicy } = require('../../../utils/apiValidation')

router.get('/', getAllUserPendingPolicies);
router.post('/', validateAcceptPrivacyPolicy, acceptPrivacyPolicy);

module.exports = router
