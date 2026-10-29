

const express = require('express');
const { verifyToken } = require('../../../../utils/jwtToken');
const router = express.Router({mergeParams:true});

router.use(verifyToken)


router.use('/', require('./kyc')); 

module.exports = router;