const express = require('express')
// const {
//   verifyToken
// } = require('../../../../utils/jwtToken');
// const { customLog } = require('../../../../utils/loggerHelper');
const router = express.Router({mergeParams:true});

router.use("/ondc/purchase",require("./ondc"));

module.exports = router;