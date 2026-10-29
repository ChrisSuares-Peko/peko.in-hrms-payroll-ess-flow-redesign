const express = require('express')
const router = express.Router()
const { findAllGiftCardAndCount, payment, findDetails, findAllTransactionsAndCount, fetchGiftCardsFromServer, getXoxodayBalance } = require('../../../../controllers/corporate/giftCard');
const operatorsData = require('../../../../utils/operatorsData.json')
const { validateGiftCardPayment } = require('../../../../utils/apiValidation');
const { findAllGiftCardAndCountValidation, findAllTransactionsAndCountValidation } = require('../../../../utils/queryValidation');
const { checkServiceEnabled } = require('../../../../middlewares/disableServiceCheck');
const accessKey = operatorsData["giftCard"]["accessKey"];

router.use(checkServiceEnabled(accessKey))
router.get('/all',findAllGiftCardAndCountValidation, findAllGiftCardAndCount)
router.post('/payment', validateGiftCardPayment, payment)
router.get('/transactions',findAllTransactionsAndCountValidation, findAllTransactionsAndCount)
router.post('/balance', getXoxodayBalance)
router.get('/:id', findDetails)
//admin routes.....
router.post('/fetchGiftCards', fetchGiftCardsFromServer)




module.exports = router