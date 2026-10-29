const express = require('express')
const router = express.Router({ mergeParams: true })




router.post('/jit', async(req,res)=>{
    return res.status(200).json({
        status: true,
        message: "JIT Webhook received",
        responseCode: "000",
        data: {},
      });
});

router.post('/callback', async(req,res)=>{
     return res.status(200).json({
        status: true,
        message: "Callback Webhook received",
        responseCode: "000",
        data: {},
      });
});
router.post('/kyc', async(req,res)=>{
     return res.status(200).json({
        status: true,
        message: "Kyc Webhook received",
        responseCode: "000",
        data: {},
      });
});

module.exports = router;