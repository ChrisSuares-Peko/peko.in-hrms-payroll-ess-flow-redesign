const express = require("express");
const { getDocument } = require("../../../../controllers/admin/document");
const router = express.Router();

router.get("/:docKey(*)", getDocument);
module.exports = router;
