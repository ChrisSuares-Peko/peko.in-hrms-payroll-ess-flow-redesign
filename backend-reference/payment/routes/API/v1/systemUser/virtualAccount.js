const express = require("express");
const router = express.Router({ mergeParams: true });

// F-PAY-20: dead Decentro VA route (replaced by NuPay) — commented out, not removed.
// const { createVA } = require("../../../../controllers/admin/virtualAccount");
// router.post("/", createVA);

module.exports = router;
