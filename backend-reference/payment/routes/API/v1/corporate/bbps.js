const express = require('express');
const { category, billers, transactions, dispute, disputeStatus, findAllMessageAndCount, findAllBbpsTransactionsAndCount, transactionStatusCheck } = require('../../../../controllers/corporate/bbps');
const { findAllMessageAndCountValidation, findAllBbpsTransactionsAndCountValidation } = require('../../../../utils/queryValidation');
const { proxyAPIForTest } = require('../../../../controllers/corporate/proxyAPI');
const operatorsData = require("../../../../utils/operatorsData.json");
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');

const accessKey = operatorsData["billavenue"]["accessKey"];
const router = express.Router()

router.get('/billers', checkServiceEnabled(accessKey), billers);


router.get('/categories', checkServiceEnabled(accessKey), category);
router.get('/transactions', checkServiceEnabled(accessKey), transactions);
router.get('/disputes', checkServiceEnabled(accessKey),findAllMessageAndCountValidation, findAllMessageAndCount);
router.post('/disputes', checkServiceEnabled(accessKey), dispute);
router.put('/disputeStatus/:id', checkServiceEnabled(accessKey), disputeStatus);
router.get("/transactionsHistory", checkServiceEnabled(accessKey),findAllBbpsTransactionsAndCountValidation, findAllBbpsTransactionsAndCount);
router.post('/statusCheck', checkServiceEnabled(accessKey), transactionStatusCheck)
router.post('/proxy-api', proxyAPIForTest)

module.exports = router