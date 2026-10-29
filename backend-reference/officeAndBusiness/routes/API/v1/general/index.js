const express = require("express");
const router = express.Router({ mergeParams: true });

router.use("/ecommerce", require("./ecommerceStore"));

module.exports = router;
