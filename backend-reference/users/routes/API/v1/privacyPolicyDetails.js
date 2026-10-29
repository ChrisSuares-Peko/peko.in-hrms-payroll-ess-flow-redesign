const express = require('express')
const router = express.Router()
const { getAllPrivacyPolicyDetails, getPrivacyPolicyEnforcement } = require('../../../controllers/corporate/privacyPolicyDetails')
const { validatePrivacyPolicyEnforcement } = require('../../../utils/apiValidation')

router.get('/', getAllPrivacyPolicyDetails);
router.get('/enforcement', validatePrivacyPolicyEnforcement, getPrivacyPolicyEnforcement);

module.exports = router
