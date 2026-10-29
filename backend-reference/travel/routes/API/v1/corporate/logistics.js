const express = require('express')
const router = express.Router()
const {
  calculateRate,
  payment,
  createMerchant,
  checkPincode,
  updateOrder,
  fetchStates,
  trackShipments,
  updateReceiverAddress
} = require('../../../../controllers/corporate/logistics')
const {
     validateLogisticsAddAdress,
     validateLogisticsCalculateRate,
     validateLogisticsPayment,
     validateCreateMerchant,
} = require('../../../../utils/apiValidation')
const {
  findAllAddress, addAddress,
} = require('../../../../controllers/admin/corporateUser')
const { findAllTransactionsAndCount } = require('../../../../controllers/corporate/transactionReport')

router.post('/createMerchant', validateCreateMerchant, createMerchant)
router.post('/checkPincode', checkPincode)
router.post('/calculateRate',validateLogisticsCalculateRate, calculateRate);
router.put('/order/:orderId', updateOrder);
router.get('/fetchStates', fetchStates)
router.get('/fetchAddresses', findAllAddress);
router.post('/payment',validateLogisticsPayment, payment);
// router.post('/checkProfileExists', checkProfileExists)
router.put('/recieverAddress/:orderId', updateReceiverAddress)

router.get('/orders', findAllTransactionsAndCount);
router.post("/addAddress",validateLogisticsAddAdress, addAddress);
router.get('/trackShipment/:providerId', trackShipments)


module.exports = router