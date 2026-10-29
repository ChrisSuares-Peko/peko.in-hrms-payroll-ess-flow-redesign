const express = require("express");
const router = express.Router();
const { getEssProfile } = require("../controller/userProfile");

router.get("/profile", getEssProfile);

module.exports = router;
