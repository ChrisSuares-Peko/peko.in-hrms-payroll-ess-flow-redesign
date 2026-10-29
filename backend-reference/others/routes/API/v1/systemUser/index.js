const express = require('express')
const {
  verifyToken,
  requireSystemUser,
} = require('../../../../utils/jwtToken')
const { bindRequestContext } = require('../../../../utils/requestContext')
const router = express.Router({mergeParams:true});

router.use(verifyToken)
router.use(requireSystemUser)
router.use(bindRequestContext)
router.use('/internal', require('./internal'));
router.use("/dashboard", require("./dashboard"));
router.use('/reports', require('./reports'));

router.use('/users', require('./users'));

router.use('/profile', require('./profile'))

router.use('/banner', require('./banner'))
router.use('/cashback', require('./cashback'))
router.use('/serviceOperators', require('./serviceOperators'))
router.use("/mobile-recharge-providers", require("./mobileRechargeProviders"))
router.use("/disableServices", require("./disableServices"));
router.use("/package", require("./package"));
router.use("/referralCodes", require("./referral_codes"));
router.use("/selfTransfer", require("./selfTransfer"));
router.use("/transferFunds", require("./transferFunds"));
router.use("/walletReports", require("./walletReports"));
router.use("/support", require("./support"));
router.use("/transactions", require("./transactions"));
router.use("/createTransaction", require("./createTransaction"));
router.use("/orders", require("./orders"));
router.use("/bulkRefund", require("./bulkRefund"));
router.use("/notifications", require("./notifications"));
router.use("/roleAndPermissions", require("./roleAndPermissions"))
router.use("/password-policy",require("./passwordPolicy"))
router.use("/partnerPermission",require("./partnerPermission"))
router.use("/partnerServiceAccess", require("./partnerServiceAccess"))
router.use("/pendingSignUps",require("./signUpActivityLog"))
router.use("/partner",require("./partner"))
router.use("/branding",require("./branding"))
router.use("/kyb-verification",require("./kybVerification"))
router.use("/peko-wallet",require("./peko_wallet"))
router.use("/domain-tlds", require("./domain_tlds"))
router.use("/payrollDocs",require("./payrollDocs"))
router.use("/settings", require("./settings"))
router.use("/coa-rules", require("./coaRules"))
router.use("/chart-of-accounts", require("./chartofAccounts"))
router.use("/order-journals", require("./orderJournals"))
router.use("/internal-accounts", require("./internalAccounts"))
router.use("/accounting", require("./accounting"))
router.use("/document", require("./document"))

module.exports = router;

