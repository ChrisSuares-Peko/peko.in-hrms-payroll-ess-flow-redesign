const express = require('express');
const { verifyToken, requireOwnCorporate } = require('../../../../utils/jwtToken');
const router = express.Router({mergeParams:true});

router.use(verifyToken)

// /internal is excluded from requireOwnCorporate on purpose: it's the corporateCard
// shared-data surface, and an employee/cardholder session reaches it with a :corporateId
// segment equal to req.user.corporateId (the employer), not req.user.id (their own
// credential) — see corporateCard/utils/othersClient.js. Its own handlers already derive
// the corporate strictly from the session (req.user.corporateId), never from this path
// param, so it doesn't need or want this check.
router.use("/internal", require("./internal"));

router.use(requireOwnCorporate)

router.use("/transactions", require("./transactions"));
router.use("/profile", require("./profile"));
router.use("/support", require("./support"));
router.use("/notification", require("./notification"));
router.use("/beneficiary", require("./beneficiary"));
router.use("/beneficiaries", require("./beneficiaries"));
router.use("/saved-travellers", require("./savedTravellers"));
router.use("/dashboard", require("./dashboard"));
router.use("/reportSetting", require("./reportSetting"));
router.use("/password-policy",require("./passwordPolicy"))
router.use("/productTour", require("./productTour"));
router.use("/wallet", require("./walletReport"))
router.use("/document", require("./document"));
router.use("/payrollDocs", require("./payrollDocs"));
router.use("/mobile-recharge-providers", require("./mobileRechargeProviders"));

module.exports = router;
