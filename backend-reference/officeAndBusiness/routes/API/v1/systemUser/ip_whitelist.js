const express = require("express");
const {
  findAllWhitelistedIP,
  updateStatus,
  updateIP,
  whitelistIp,deleteip,ipWhitelistAndCountExcelCSV,ipWhitelistAndCountPDF
} = require("../../../../controllers/admin/ip_whitelist");
const router = express.Router({ mergeParams: true });

router.get("/", findAllWhitelistedIP);
router.put("/update-status/:id", updateStatus);
router.delete('/:id', deleteip);
router.get('/documents/pdf',ipWhitelistAndCountPDF )
router.get('/documents/:type', ipWhitelistAndCountExcelCSV)
router.put("/:id", updateIP);
router.post("/", whitelistIp)

module.exports = router;