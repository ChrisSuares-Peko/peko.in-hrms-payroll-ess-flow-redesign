const express = require("express");
const router = express.Router({ mergeParams: true });
const upload = require("../../../../middlewares/multer");
const {
  onboardMerchantHandler,
  getMerchantListHandler,
  getOnboardingStatusHandler,
  getWalletBalanceHandler,
} = require("../../../../controllers/corporate/nupayOnboarding");

// POST /nupay/onboard  — onboard a merchant (payout or collection)
router.post("/onboard", upload.single("cancelled_cheque"), onboardMerchantHandler);

// GET /nupay/merchants — fetch merchant list
router.get("/merchants", getMerchantListHandler);

// GET /nupay/onboarding-status — get onboarding status from local DB
router.get("/onboarding-status", getOnboardingStatusHandler);

// GET /nupay/wallet-balance — get corporate wallet balance
router.get("/wallet-balance", getWalletBalanceHandler);

module.exports = router;
