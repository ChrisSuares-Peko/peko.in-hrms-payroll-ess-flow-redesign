const express = require("express");
const router = express.Router({ mergeParams: true });


router.use('/e-sign/corporate-card', require("./corporateCardESign"))
router.use('/e-sign', require("./eSign"))

router.use('/whatsapp-for-business', require("./whatsAppForBusiness"))
router.use('/payment-links', require("./paymentLinks"))
router.use('/company-incorporation', require("./companyIncorporation"))
router.use('/india-filings', require("./indiaFilings"))
router.use('/verification-suite', require("./nupay"))
router.use('/vehicle-reports', require("./droom"))
router.use('/verification-suite', require("./nupay"))
router.use('/global-business-setup', require("./globalBusinessSetup"))


module.exports = router