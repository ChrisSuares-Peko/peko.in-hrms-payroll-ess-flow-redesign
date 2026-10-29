const express = require('express');
const {
  payment,
  initializeBundledWhatsAppProject,
} = require('../../../../controllers/corporate/subscription');
const { activatePekoPlusSubscription } = require('../../../../controllers/corporate/globalBusinessSetup');

const router = express.Router({ mergeParams: true });

router.post('/payment', payment);
router.post('/whatsapp-bundle/init', initializeBundledWhatsAppProject);
router.post('/global-business-setup', activatePekoPlusSubscription);

module.exports = router;
