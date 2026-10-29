/**
 * Created by Ubair Noor.
 */

const express = require('express')
const router = express.Router()
const {
    login,
    getconnectiondetails,
    plans,
    payment,
    balanceCheck,
    rechargeValidation,
    rechargeStatus
} = require('../../../../../controllers/corporate/telecomPayments/prepaid')
const operatorsData = require("./../../../../../utils/operatorsData.json");
const { getLastFiveTransactions } = require('../../../../../controllers/corporate/serviceOperators');
const { checkServiceEnabled } = require('../../../../../middlewares/disableServiceCheck');
let accessKey = operatorsData["prepaid"]["accessKey"];

// -----------------------------
router.get('/login',checkServiceEnabled(accessKey), login)
router.get('/details',checkServiceEnabled(accessKey), getconnectiondetails)
router.post('/plans',checkServiceEnabled(accessKey), plans)
router.post('/balance',checkServiceEnabled(accessKey), balanceCheck)
router.post('/validate',checkServiceEnabled(accessKey), rechargeValidation)
router.get('/status', checkServiceEnabled(accessKey), rechargeStatus)
// ----------working-----------
router.post('/payment',checkServiceEnabled(accessKey), payment)
router.get('/latestTransactions',checkServiceEnabled(accessKey), getLastFiveTransactions)

module.exports = router
