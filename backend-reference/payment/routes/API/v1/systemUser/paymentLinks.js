const express = require("express");
const { findAllPaymentLinksAndCount, sendMail, paymentLinksPDF, paymentLinksExcelCSV } = require("../../../../controllers/admin/paymentLink");
const { listPayoutOnboarding, updatePayoutOnboardingStatus } = require("../../../../controllers/admin/payoutOnboarding");
const { findAllPaymentLinksAndCountValidation } = require("../../../../utils/queryValidation");
const router = express.Router();

router.get('/onboarding/admin/list', listPayoutOnboarding)
router.put('/onboarding/admin/status/:onboardingId', updatePayoutOnboardingStatus)

router.get('/all',findAllPaymentLinksAndCountValidation, findAllPaymentLinksAndCount)
router.post('/sendMail', sendMail)
router.get('/pdf',findAllPaymentLinksAndCountValidation, paymentLinksPDF)
router.get('/:type',findAllPaymentLinksAndCountValidation, paymentLinksExcelCSV)

module.exports = router;