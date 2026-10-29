const express = require("express");
const router = express.Router();
const {
  findAllDocumentsAndCount,
  findAllCategoriesAndCount,
} = require("../../../../controllers/corporate/payrollDocs");

router.get("/categories", findAllCategoriesAndCount);
router.get("/documents", findAllDocumentsAndCount);

module.exports = router;
