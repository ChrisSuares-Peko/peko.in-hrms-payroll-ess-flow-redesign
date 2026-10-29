const express = require('express');
const { verifyToken } = require('../../../../utils/jwtToken');
const rejectClientPgProof = require('../../../../middlewares/rejectClientPgProof');
const router = express.Router({mergeParams:true});
const { completeAnyPayment } = require('../../../../controllers/corporate/paymentComplete');

router.use(verifyToken)
router.use('/transactions',require("./transactions"))
router.use("/surcharge", require("./surCharge"))
router.use('/cashfree-gateway', require('./cashFreeGateway'))
router.use('/razorpay-gateway', require('./razorpayGateway'))
router.post('/complete', completeAnyPayment)
router.use('/subscriptions', require('./subscriptions'))
router.use('/wallet-payments', rejectClientPgProof, require("./wallet"));
router.use('/payment-methods', require("./paymentMethods"))
router.use('/bulk-payment', require('./bulkPayment'));

router.use('/company-incorporation', rejectClientPgProof, require('./companyIncorporation'));

router.use('/ccavenue-gateway', require('./ccavenueGateway'));
router.use('/airpay-gateway', require('./airpayGateway'));
router.use('/mswipe-gateway', require('./mswipeGateway'));
router.use('/corporate-card-gateway', require('./corporateCardGateway'));

// unused
// F-PG-04 / F-PG-22: disabled — /complete accepted forged success for any order, and /status and /refund had
// no owner check. Plural is not offered in the frontend (VITE_PLURAL_GATEWAY_VISIBLE=false). The controller
// stays, as domainAndHosting.js imports refundGatewayTransaction from it directly.
// router.use('/plural-gateway',require("./pluralGateway"));
// F-PG-11: disabled — charged paytmAmount but settled on the client's pgAmount / paymentGatewayResponse.
// Not used: the frontend "PAYTM" mode calls cashfree-gateway/create-order.
// router.use('/paytm-gateway', require('./paytmGateway'));

module.exports = router;
