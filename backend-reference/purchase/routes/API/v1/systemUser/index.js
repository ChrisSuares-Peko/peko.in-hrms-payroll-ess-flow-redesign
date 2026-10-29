const express = require('express')
const {
  verifyToken,
  requireSystemUser,
} = require('../../../../utils/jwtToken')
const router = express.Router({mergeParams:true});

router.use(verifyToken)
router.use(requireSystemUser)
router.use("/categories", require("./categories"));
router.use("/vendor", require("./vendor"));
router.use("/products", require("./products"));
router.use("/giftCards", require("./giftCards"));
router.use("/ecommerce", require("./ecommerce"));
router.use("/software", require("./software"))
router.use("/plans", require("./software_plans"))
router.use("/coupons", require("./couponCode"))

router.use("/subscription-code", require("./subscription"))
router.use("/software-subscriptions", require("./software_subscriptions"))
router.use("/software-subscriptions-plans", require("./software_subscriptions_plans"))
router.use("/hike", require("./hike"))
router.use("/esim", require("./esim"))
router.use("/peko-credits", require("./pekoCredits"))
router.use("/govt-services", require("./govtServiceCatalog"))
router.use("/govt-services-v2", require("./governmentServicesApplicationV2"))

module.exports = router;