const express = require('express')
const router = express.Router()
const {
  findTransactionDetails, findTransactionData,
  findSubscriptionData
} = require("../../../../controllers/corporate/transactionReport")

router.get('/details/:transactionId', findTransactionDetails)
router.get('/transaction/:transactionId', findTransactionData);
router.get('/subscription/:subscriptionId', findSubscriptionData);

// unused apis

// router.get("/:corporateId/orders", findAllTransactionsAndCount)
// router.get('/:corporateId/excel', getExcel)

module.exports = router