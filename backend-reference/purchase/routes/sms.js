const express = require("express");
const router = express.Router();
var sms = require('../utils/sms')
router.post('/rmlSms', async (req, res) => {
  try {
    let message = req.body.message
    let mobileNo = req.body.mobileNo
    let response = await sms.sendSMS(mobileNo, message)
    console.log(response)
    res.send(response)
  } catch (err) {
    console.log(err)
    var responseData = {
      responseCode: '500',
      responseMessage: 'Internal server error'
    }
    res.send(responseData)
  }
});
//router.use('/giftCard',require('./WEB/corporate/giftCard'))
module.exports = router