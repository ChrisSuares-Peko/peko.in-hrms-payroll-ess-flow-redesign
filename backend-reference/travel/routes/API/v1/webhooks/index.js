const express = require('express')
const router = express.Router({mergeParams:true});

router.use("/logistics", require("./logistics"));
router.use("/visa", require("./visa"));
router.use("/flags", require("./countryFlags"));

module.exports = router;