const express = require('express');
const { verifyToken } = require('../../../../utils/jwtToken');
const router = express.Router({mergeParams:true});

// router.use("/paytm", require("./paytmWebhook"))

router.use(verifyToken)


//purchase
// router.use("/subscriptionPayments", require("./subscriptionPayments"));
router.use("/giftCards", require("./giftCards"))
router.use("/ecommerce", require("./ecommerce"))
router.use("/surcharge", require("./surCharge"))
router.use("/softwares", require("./softwares"))
router.use("/softwaresV2", require("./softwaresV2"))
router.use("/subscription", require("./subscription"))
router.use("/coupons", require("./couponCode"))
router.use("/software-subscriptions", require("./softwares_subscriptions"))
router.use("/hike", require("./hike"))
router.use("/eSIM", require("./eSIM"))
router.use("/govt-services", require("./govtServices"))
router.use("/govt-services/v2", require("./govtServicesV2"))
router.use("/govt-services/v2/trademark-objection", require("./govtServicesObjectionV2"))

// Procure module
router.use("/procure/dashboard",         require("./procure/dashboard"))
router.use("/procure/purchase-requests", require("./procure/purchaseRequests"))
router.use("/procure/vendors",           require("./procure/procureVendors"))
router.use("/procure/rfqs",              require("./procure/rfq"))
router.use("/procure/proposals",         require("./procure/proposals"))
router.use("/procure/purchase-orders",   require("./procure/purchaseOrders"))
router.use("/procure/invoices",          require("./procure/invoices"))

module.exports = router;