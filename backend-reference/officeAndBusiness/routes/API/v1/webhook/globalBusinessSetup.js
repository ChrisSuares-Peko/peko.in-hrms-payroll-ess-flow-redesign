const express = require('express');
const router = express.Router({ mergeParams: true });
const { updateGlobalBusinessSetupAiCheckStatus } = require('../../../../controllers/corporate/globalBusinessSetup');

router.post('/ai-check', updateGlobalBusinessSetupAiCheckStatus);

module.exports = router;
