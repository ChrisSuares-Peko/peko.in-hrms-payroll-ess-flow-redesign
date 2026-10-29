const express = require("express");
const { getDocument } = require("../../../../controllers/admin/document");

const router = express.Router({ mergeParams: true });

router.get("/:docKey(*)", getDocument);

module.exports = router;
